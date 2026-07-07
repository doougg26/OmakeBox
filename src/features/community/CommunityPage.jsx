import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, trackingApi, translateApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ImageWithFallback from '../../components/ImageWithFallback';
import SpoilerBlock from '../../components/SpoilerBlock';
import styles from './CommunityPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'assistindo', label: 'Assistindo' },
  { value: 'completo', label: 'Completo' },
  { value: 'planejo_assistir', label: 'Planejo Assistir' },
  { value: 'abandonado', label: 'Abandonado' },
  { value: 'em_pausa', label: 'Em Pausa' },
];

export default function CommunityPage() {
  const { id: malId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados de UI
  const [selectedChar, setSelectedChar] = useState(null);
  const [pendingChar, setPendingChar] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [pendingRating, setPendingRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [trackingStatus, setTrackingStatus] = useState('');
  const [pendingTracking, setPendingTracking] = useState('');
  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [rateError, setRateError] = useState('');
  const [trackingError, setTrackingError] = useState('');

  // Busca detalhes do anime
  const { data: anime, isLoading, error } = useQuery({
    queryKey: ['anime-details', malId],
    queryFn: async () => {
      const { data } = await communityApi.getAnimeDetails(malId);
      return data;
    },
  });

  // Busca tracking do usuário para este anime
  const { data: myTracking } = useQuery({
    queryKey: ['my-tracking', malId],
    queryFn: async () => {
      try {
        const { data } = await trackingApi.getTrackingByAnime(malId);
        if (data) {
          setUserRating(data.nota || 0);
          setTrackingStatus(data.status || '');
        }
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  // Busca ranking de personagens
  const { data: ranking = [] } = useQuery({
    queryKey: ['character-ranking', malId],
    queryFn: async () => {
      const { data } = await communityApi.getCharacterRanking(malId);
      return data;
    },
  });

  // Busca characters list
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', malId],
    queryFn: async () => {
      const { data } = await communityApi.getCharacters(malId);
      return data;
    },
  });

  // Busca reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', malId],
    queryFn: async () => {
      const { data } = await communityApi.getReviews(malId);
      return data;
    },
  });

  // Votar em personagem
  const voteMutation = useMutation({
    mutationFn: async (charMalId) => {
      const { data } = await communityApi.voteCharacter(malId, charMalId);
      return data;
    },
    onSuccess: () => {
      setPendingChar(null);
      setSelectedChar(null);
      setVoteError('');
      queryClient.invalidateQueries({ queryKey: ['character-ranking', malId] });
    },
    onError: (err) => {
      setVoteError(err.response?.data?.error || 'Erro ao votar');
    },
  });

  // Avaliar anime
  const rateMutation = useMutation({
    mutationFn: async (nota) => {
      const { data } = await communityApi.rateAnime(malId, nota);
      return data;
    },
    onSuccess: () => {
      setPendingRating(0);
      setUserRating(pendingRating);
      setRateError('');
      queryClient.invalidateQueries({ queryKey: ['anime-details', malId] });
    },
    onError: (err) => {
      setRateError(err.response?.data?.error || 'Erro ao avaliar');
    },
  });

  // Adicionar review
  const reviewMutation = useMutation({
    mutationFn: async (texto) => {
      await communityApi.addReview(malId, texto);
    },
    onSuccess: () => {
      setReviewText('');
      queryClient.invalidateQueries({ queryKey: ['reviews', malId] });
    },
  });

  // Tracking
  const trackingMutation = useMutation({
    mutationFn: async (data) => {
      return trackingApi.upsertTracking(malId, data);
    },
    onSuccess: () => {
      setPendingTracking('');
      setTrackingStatus(pendingTracking);
      setTrackingError('');
      queryClient.invalidateQueries({ queryKey: ['my-tracking', malId] });
      queryClient.invalidateQueries({ queryKey: ['anime-details', malId] });
    },
    onError: (err) => {
      setTrackingError(err.response?.data?.error || 'Erro ao salvar tracking');
    },
  });

  // Estados para edição de episódio
  const [epEditValue, setEpEditValue] = useState('');

  // Sincroniza epEditValue com o valor do tracking quando carrega
  const epInputValue = epEditValue === '' ? (myTracking?.ultimo_episodio_assistido ?? '') : epEditValue;

  // Marcar episódio como assistido
  const watchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await trackingApi.watchEpisode(malId);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setTrackingStatus(data.status || trackingStatus);
      }
      setEpEditValue(''); // reseta para usar o valor do servidor
      setTrackingError('');
      queryClient.invalidateQueries({ queryKey: ['my-tracking', malId] });
      queryClient.invalidateQueries({ queryKey: ['anime-details', malId] });
    },
    onError: (err) => {
      setTrackingError(err.response?.data?.error || 'Erro ao marcar episódio');
    },
  });

  // Definir episódio exato
  const setEpMutation = useMutation({
    mutationFn: async (episodio) => {
      const { data } = await trackingApi.setEpisode(malId, episodio);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setTrackingStatus(data.status || trackingStatus);
      }
      setEpEditValue(''); // reseta para usar o valor do servidor
      setTrackingError('');
      queryClient.invalidateQueries({ queryKey: ['my-tracking', malId] });
      queryClient.invalidateQueries({ queryKey: ['anime-details', malId] });
    },
    onError: (err) => {
      setTrackingError(err.response?.data?.error || 'Erro ao atualizar episódio');
    },
  });

  function handleSetEpisode(value) {
    const ep = parseInt(value, 10);
    if (!isNaN(ep) && ep >= 0 && ep !== (myTracking?.ultimo_episodio_assistido || 0)) {
      setEpMutation.mutate(ep);
    }
  }

  function handleSelectChar(charMalId) {
    setSelectedChar(charMalId);
    setPendingChar(charMalId);
    setVoteError('');
  }

  function handleConfirmVote() {
    if (!user || !pendingChar) return;
    voteMutation.mutate(pendingChar);
  }

  function handleCancelVote() {
    setSelectedChar(null);
    setPendingChar(null);
    setVoteError('');
  }

  function handleSelectStar(nota) {
    setPendingRating(nota);
    setRateError('');
  }

  function handleConfirmRate() {
    if (!user || !pendingRating) return;
    rateMutation.mutate(pendingRating);
  }

  function handleCancelRate() {
    setPendingRating(0);
    setRateError('');
  }

  function handleSubmitReview() {
    if (!reviewText.trim() || !user) return;
    reviewMutation.mutate(reviewText.trim());
  }

  function handleSelectTracking(status) {
    setPendingTracking(status);
    setTrackingError('');
  }

  function handleConfirmTracking() {
    if (!user || !pendingTracking) return;
    trackingMutation.mutate({ status: pendingTracking });
  }

  function handleCancelTracking() {
    setPendingTracking('');
    setTrackingError('');
  }

  // Remove - não usado, manter como referência
  // function handleRemoveTracking() { }

  const handleTranslate = useCallback(async () => {
    if (!anime?.sinopse || translating) return;
    setTranslating(true);
    try {
      const { data } = await translateApi.translate(
        anime.sinopse.substring(0, 1900),
        'pt'
      );
      setTranslatedText(data.translatedText);
    } catch {
      // Se falhar, tenta mostrar link para Google Translate
      const url = `https://translate.google.com/?sl=en&tl=pt&text=${encodeURIComponent(anime.sinopse.substring(0, 1000))}`;
      window.open(url, '_blank');
    } finally {
      setTranslating(false);
    }
  }, [anime?.sinopse, translating]);

  useDocumentTitle(anime?.titulo || 'Comunidade');

  if (isLoading) {
    return (
      <div className="container page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <p className="error-text">Erro ao carregar detalhes do anime</p>
      </div>
    );
  }

  const statusLabel =
    anime?.status === 'em_exibicao' ? 'Em Exibição'
    : anime?.status === 'finalizado' ? 'Finalizado'
    : anime?.status === 'anunciado' ? 'Anunciado'
    : anime?.status || '';

  const currentTrackingStatus = pendingTracking || trackingStatus || myTracking?.status || '';

  return (
    <div className={styles.community}>
      {/* Hero */}
      <div className={styles.hero}>
        <ImageWithFallback
          className={styles.hero__bg}
          src={anime?.capa_url || ''}
          alt={anime?.titulo}
        />
        <div className={styles.hero__overlay}>
          <h1 className={styles.hero__title}>{anime?.titulo}</h1>
          <div className={styles.hero__meta}>
            {anime?.total_episodios && <span>{anime.total_episodios} episódios</span>}
            {anime?.temporada && <span>{anime.temporada}</span>}
            {anime?.ano && <span>{anime.ano}</span>}
            {statusLabel && (
              <span className={`${styles.hero__tag} ${anime?.status === 'em_exibicao' ? styles['hero__tag--airing'] : styles['hero__tag--finished']}`}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Main content */}
        <div className={styles.mainSection}>
          {/* Sinopse + Tradução */}
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Sinopse</h2>
              {anime?.sinopse && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                  onClick={handleTranslate}
                  disabled={translating}
                >
                  {translating ? 'Traduzindo...' : (translatedText ? 'Traduzido' : 'Traduzir para PT-BR')}
                </button>
              )}
            </div>
            <p className={styles.sinopse}>
              {translatedText || anime?.sinopse || 'Nenhuma sinopse disponível.'}
            </p>
            {translatedText && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: '0.5rem' }}
                onClick={() => setTranslatedText(null)}
              >
                Mostrar original
              </button>
            )}
            {anime?.generos?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className={styles.genres}>
                  {anime.generos.map((g, i) => (
                    <span key={g.id || i} className={styles.genreTag}>
                      {g.nome || g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personagens */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Personagens <span>({characters.length})</span>
            </h2>
            <div className={styles.charactersGrid}>
              {characters.map((char) => {
                const voteCount = ranking.find((r) => r.character_id === char.id)?.votos || 0;
                const topRanking = ranking.findIndex((r) => r.character_id === char.id);

                return (
                  <div
                    key={char.id}
                    className={`${styles.charCard} ${
                      selectedChar === char.mal_id ? styles['charCard--selected'] : ''
                    } ${topRanking === 0 ? styles['charCard--voted'] : ''}`}
                    onClick={() => handleSelectChar(char.mal_id)}
                  >
                    <ImageWithFallback src={char.imagem_url || ''} alt={char.nome} />
                    <span className={styles.charCard__name}>{char.nome}</span>
                    <span className={styles.charCard__votes}>
                      {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
                    </span>
                    {topRanking === 0 && voteCount > 0 && (
                      <div className={styles.charCard__badge}>#1</div>
                    )}
                  </div>
                );
              })}
            </div>
            {characters.length === 0 && (
              <p className={styles.noResults}>Nenhum personagem encontrado.</p>
            )}

            {/* Botões de confirmar/editar voto */}
            {user && pendingChar && (
              <div className={styles.actionBar}>
                {voteError && <span className="error-text">{voteError}</span>}
                <div className={styles.actionButtons}>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmVote}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending ? 'Votando...' : 'Confirmar Voto'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelVote}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Impressões <span>({reviews.length})</span>
            </h2>

            {user && (
              <div className={styles.reviewForm}>
                <textarea
                  className="input"
                  placeholder="Escreva sua impressão sobre este anime (máx. 500 caracteres)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={500}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`${styles.charCount} ${reviewText.length > 450 ? styles['charCount--warn'] : ''} ${reviewText.length >= 500 ? styles['charCount--error'] : ''}`}>
                    {reviewText.length}/500
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitReview}
                    disabled={!reviewText.trim() || reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? 'Salvando...' : 'Publicar Impressão'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              {reviews.length === 0 && (
                <p className={styles.noResults}>
                  Nenhuma impressão ainda. Seja o primeiro!
                </p>
              )}
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewCard__header}>
                    <span className={styles.reviewCard__author}>{review.user?.nickname}</span>
                    {review.nota && <span className={styles.reviewCard__rating}>★ {review.nota}/10</span>}
                  </div>
                  {review.texto ? (
                    <div className={styles.reviewCard__text}>{review.texto}</div>
                  ) : (
                    <SpoilerBlock>
                      <div className={styles.reviewCard__text}>
                        Review bloqueado — complete o anime para desbloquear!
                      </div>
                    </SpoilerBlock>
                  )}
                  {review.bloqueado && review.progresso_necessario && (
                    <div className={styles.reviewCard__blocked}>
                      ⚠ {review.progresso_necessario} assistidos para desbloquear
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Tracking */}
          {user && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Meu Tracking</h3>

              {/* Episódios + controle editável */}
              <div className={styles.episodeControl}>
                <div className={styles.episodeControl__info}>
                  <span className={styles.episodeControl__label}>Episódios Assistidos</span>
                  <div className={styles.episodeControl__edit}>
                    <input
                      type="number"
                      className={styles.episodeControl__input}
                      min="0"
                      max={anime?.total_episodios || 9999}
                      value={epInputValue}
                      onChange={(e) => setEpEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSetEpisode(e.target.value);
                        }
                      }}
                    />
                    <span className={styles.episodeControl__separator}>/</span>
                    <span className={styles.episodeControl__total}>
                      {anime?.total_episodios || '?'}
                    </span>
                  </div>
                </div>
                <div className={styles.episodeControl__actions}>
                  <button
                    className={styles.episodeControl__btn}
                    onClick={() => watchMutation.mutate()}
                    disabled={watchMutation.isPending}
                    title="+1 episódio"
                  >
                    +1
                  </button>
                  <button
                    className={styles.episodeControl__save}
                    onClick={() => handleSetEpisode(epInputValue)}
                    disabled={setEpMutation.isPending}
                  >
                    {setEpMutation.isPending ? '...' : 'Atualizar'}
                  </button>
                </div>
              </div>

              {/* Barra de progresso rápida */}
              {anime?.total_episodios > 0 && (
                <div className={styles.episodeProgress}>
                  <div className={styles.episodeProgress__bg}>
                    <div
                      className={styles.episodeProgress__fill}
                      style={{
                        width: `${Math.min(
                          ((myTracking?.ultimo_episodio_assistido || 0) / anime.total_episodios) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {currentTrackingStatus ? (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  <span className={styles.trackingBadge}>
                    {STATUS_OPTIONS.find((s) => s.value === currentTrackingStatus)?.label || currentTrackingStatus}
                  </span>
                </div>
              ) : null}

              <div className={styles.trackingGrid}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.trackingBtn} ${pendingTracking === opt.value ? styles['trackingBtn--selected'] : ''} ${currentTrackingStatus === opt.value && !pendingTracking ? styles['trackingBtn--active'] : ''}`}
                    onClick={() => handleSelectTracking(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {trackingError && <span className="error-text">{trackingError}</span>}

              {pendingTracking && pendingTracking !== currentTrackingStatus && (
                <div className={styles.actionButtons} style={{ marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                    onClick={handleConfirmTracking}
                    disabled={trackingMutation.isPending}
                  >
                    {trackingMutation.isPending ? 'Salvando...' : 'Confirmar'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                    onClick={handleCancelTracking}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {pendingTracking === currentTrackingStatus && (
                <span style={{ fontSize: '0.75rem', color: '#6b8398', display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>
                  Status atual
                </span>
              )}
            </div>
          )}

          {/* Rating */}
          <div className={styles.section}>
            <div className={styles.ratingBox}>
              <div className={styles.ratingScore}>
                {anime?.rating?.media || '—'}
                <div className={styles.ratingScore__label}>
                  {anime?.rating?.total_votos || 0} avaliações
                </div>
              </div>

              {user && (
                <>
                  <div className={styles.starInput}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <span
                        key={star}
                        className={`${styles.star} ${star <= (pendingRating || userRating) ? styles['star--active'] : ''}`}
                        onClick={() => handleSelectStar(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {rateError && <span className="error-text">{rateError}</span>}

                  {pendingRating > 0 && pendingRating !== userRating && (
                    <div className={styles.actionButtons}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                        onClick={handleConfirmRate}
                        disabled={rateMutation.isPending}
                      >
                        {rateMutation.isPending ? 'Salvando...' : `Confirmar Nota ${pendingRating}`}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handleCancelRate}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {userRating > 0 && !pendingRating && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                      onClick={() => setPendingRating(userRating)}
                    >
                      Editar Nota
                    </button>
                  )}

                  {!userRating && !pendingRating && (
                    <span style={{ fontSize: '0.75rem', color: '#6b8398' }}>
                      Selecione as estrelas e confirme
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Informações</h3>
            {anime?.estudios?.length > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoRow__label}>Estúdio</span>
                <span className={styles.infoRow__value}>{anime.estudios.map((s) => s.nome || s).join(', ')}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoRow__label}>Episódios</span>
              <span className={styles.infoRow__value}>{anime?.total_episodios || '?'}</span>
            </div>
            {anime?.temporada && (
              <div className={styles.infoRow}>
                <span className={styles.infoRow__label}>Temporada</span>
                <span className={styles.infoRow__value}>{anime.temporada} {anime.ano}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoRow__label}>Status</span>
              <span className={styles.infoRow__value}>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

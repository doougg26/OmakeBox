import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ImageWithFallback from '../../components/ImageWithFallback';
import styles from './TrackingDetailPage.module.scss';

const STATUS_LABELS = {
  assistindo: 'Assistindo',
  completo: 'Completo',
  planejo_assistir: 'Planejo Assistir',
  abandonado: 'Abandonado',
  em_pausa: 'Em Pausa',
};

const STATUS_COLORS = {
  assistindo: '#4caf50',
  completo: '#7c5cfc',
  planejo_assistir: '#6b8398',
  abandonado: '#ef5350',
  em_pausa: '#ff9800',
};

export default function TrackingDetailPage() {
  const { malId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tracking-details', malId],
    queryFn: async () => {
      const { data } = await trackingApi.getTrackingDetails(malId);
      return data;
    },
    enabled: !!user,
  });

  // Mutations para ações rápidas
  const watchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await trackingApi.watchEpisode(malId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-details', malId] });
      queryClient.invalidateQueries({ queryKey: ['my-trackings'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await trackingApi.removeTracking(malId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trackings'] });
      toast.success('Tracking removido');
      navigate('/tracking');
    },
    onError: () => toast.error('Erro ao remover tracking'),
  });

  useDocumentTitle(anime?.titulo ? `${anime.titulo} — Detalhes` : 'Detalhes do Tracking');

  if (isLoading) {
    return (
      <div className="container page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page">
        <p className="error-text">Erro ao carregar detalhes do tracking</p>
        <Link to="/tracking" className="btn btn-secondary">Voltar</Link>
      </div>
    );
  }

  const { anime, tracking, history = [] } = data;

  // Agrupa histórico por data
  const historyByDate = {};
  for (const h of history) {
    const date = h.assistido_em
      ? new Date(h.assistido_em).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Data desconhecida';
    if (!historyByDate[date]) historyByDate[date] = [];
    historyByDate[date].push(h);
  }

  // Remove tracking se tracking for null
  if (!tracking) {
    return (
      <div className="container page">
        <div className={`card ${styles.notFound}`}>
          <p>Você ainda não está rastreando este anime.</p>
          <Link to="/tracking" className="btn btn-secondary">Voltar ao Tracking</Link>
        </div>
      </div>
    );
  }

  const totalEp = anime?.total_episodios;
  const watchedEp = tracking.ultimo_episodio_assistido || 0;
  const percent = tracking.progresso_percentual || 0;
  const remaining = tracking.episodios_restantes;
  const statusColor = STATUS_COLORS[tracking.status] || '#6b8398';

  return (
    <div className={styles.page}>
      <div className={styles.backNav}>
        <Link to="/tracking" className={styles.backLink}>← Meu Tracking</Link>
        <Link to={`/anime/${malId}`} className={styles.animeLink}>Ir para Comunidade →</Link>
      </div>

      <div className={styles.grid}>
        {/* Coluna principal - Info do Anime */}
        <div className={styles.mainCol}>
          {/* Hero compacto */}
          <div className={styles.hero}>
            <ImageWithFallback
              className={styles.hero__bg}
              src={anime?.capa_url || ''}
              alt={anime?.titulo}
            />
            <div className={styles.hero__overlay}>
              <h1 className={styles.hero__title}>{anime?.titulo}</h1>
              <div className={styles.hero__meta}>
                {totalEp && <span>{totalEp} episódios</span>}
                {anime?.temporada && <span>{anime.temporada}</span>}
                {anime?.ano && <span>{anime.ano}</span>}
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className={styles.quickActions}>
            <button
              className={styles.watchBtn}
              onClick={() => watchMutation.mutate()}
              disabled={watchMutation.isPending || (totalEp && watchedEp >= totalEp)}
            >
              {watchMutation.isPending ? '...' : '+1 Episódio'}
            </button>
            <Link to={`/anime/${malId}`} className={styles.communityBtn}>
              Comunidade
            </Link>
          </div>

          {/* Sinopse */}
          {anime?.sinopse && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Sinopse</h3>
              <p className={styles.sinopse}>{anime.sinopse}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Stats */}
        <div className={styles.sideCol}>
          <div className={styles.statsCard}>
            <h3 className={styles.sectionTitle}>Progresso</h3>

            {/* Círculo de progresso */}
            <div className={styles.progressCircleWrapper}>
              <svg className={styles.progressCircle} viewBox="0 0 120 120">
                <circle
                  className={styles.progressCircle__bg}
                  cx="60" cy="60" r="52"
                  fill="none"
                  strokeWidth="10"
                />
                <circle
                  className={styles.progressCircle__fill}
                  cx="60" cy="60" r="52"
                  fill="none"
                  strokeWidth="10"
                  stroke={statusColor}
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - percent / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="50" textAnchor="middle" className={styles.progressCircle__pct}>
                  {percent}%
                </text>
                <text x="60" y="72" textAnchor="middle" className={styles.progressCircle__label}>
                  {watchedEp}/{totalEp || '?'}
                </text>
              </svg>
            </div>

            {/* Stats rápidas */}
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.stat__value}>{watchedEp}</span>
                <span className={styles.stat__label}>Assistidos</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.stat__value}>{remaining !== null ? remaining : '?'}</span>
                <span className={styles.stat__label}>Restantes</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.stat__value}>{history.length}</span>
                <span className={styles.stat__label}>Sessões</span>
              </div>
            </div>

            {/* Status badge */}
            <div className={styles.statusRow}>
              <span
                className={styles.statusBadge}
                style={{ background: `${statusColor}22`, color: statusColor, borderColor: statusColor }}
              >
                {STATUS_LABELS[tracking.status] || tracking.status}
              </span>
              {tracking.nota && (
                <span className={styles.ratingBadge}>★ {tracking.nota}/10</span>
              )}
            </div>

            {/* Impressão */}
            {tracking.impressao_texto && (
              <div className={styles.impressionBox}>
                <span className={styles.impressionBox__label}>Impressão</span>
                <p className={styles.impressionBox__text}>{tracking.impressao_texto}</p>
              </div>
            )}

            {/* Datas */}
            <div className={styles.datesBox}>
              <span>Iniciado: <strong>{new Date(tracking.criado_em).toLocaleDateString('pt-BR')}</strong></span>
              <span>Atualizado: <strong>{new Date(tracking.atualizado_em).toLocaleDateString('pt-BR')}</strong></span>
            </div>

            {/* Remover */}
            <button
              className={styles.removeBtn}
              onClick={async () => {
                const confirmed = await toast.confirm('Remover este anime do tracking?');
                if (confirmed) {
                  removeMutation.mutate();
                }
              }}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Removendo...' : 'Remover Tracking'}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline de Episódios */}
      <div className={styles.timelineSection}>
        <h2 className={styles.timelineTitle}>
          Histórico de Episódios
          <span>{history.length} registro{history.length !== 1 ? 's' : ''}</span>
        </h2>

        {history.length === 0 ? (
          <div className={styles.timelineEmpty}>
            <p>Nenhum episódio registrado ainda.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {/* Barra de progresso geral */}
            <div className={styles.timelineProgress}>
              {totalEp > 0 && (
                <div className={styles.timelineProgress__bar}>
                  {Array.from({ length: Math.min(totalEp, 200) }, (_, i) => {
                    const epNum = i + 1;
                    const isWatched = epNum <= watchedEp;
                    return (
                      <div
                        key={epNum}
                        className={`${styles.timelineProgress__seg} ${isWatched ? styles['timelineProgress__seg--watched'] : ''}`}
                        title={`Ep. ${epNum}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timeline por data */}
            {Object.entries(historyByDate).map(([date, eps]) => (
              <div key={date} className={styles.timelineDateGroup}>
                <div className={styles.timelineDateHeader}>
                  <span className={styles.timelineDateDot} />
                  <span className={styles.timelineDateLabel}>{date}</span>
                  <span className={styles.timelineDateCount}>
                    {eps.length} episódio{eps.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.timelineEps}>
                  {eps.map((h) => (
                    <div key={h.episode_number} className={styles.timelineEp}>
                      <span className={styles.timelineEp__num}>EP {h.episode_number}</span>
                      <span className={styles.timelineEp__time}>
                        {h.assistido_em
                          ? new Date(h.assistido_em).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Resumo compacto */}
            <div className={styles.timelineSummary}>
              <span>
                {watchedEp > 0 ? (
                  <>Você assistiu do <strong>Ep. 1</strong> ao <strong>Ep. {watchedEp}</strong></>
                ) : (
                  'Nenhum episódio assistido'
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

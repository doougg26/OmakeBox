import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ImageWithFallback from '../../components/ImageWithFallback';
import styles from './TrackingPage.module.scss';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'assistindo', label: 'Assistindo' },
  { value: 'completo', label: 'Completo' },
  { value: 'planejo_assistir', label: 'Planejo' },
  { value: 'abandonado', label: 'Abandonado' },
  { value: 'em_pausa', label: 'Pausa' },
];

const STATUS_LABELS = {
  assistindo: 'Assistindo',
  completo: 'Completo',
  planejo_assistir: 'Planejo Assistir',
  abandonado: 'Abandonado',
  em_pausa: 'Em Pausa',
};

export default function TrackingPage() {
  useDocumentTitle('Meu Tracking');
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data: trackings = [], isLoading } = useQuery({
    queryKey: ['my-trackings'],
    queryFn: async () => {
      const { data } = await trackingApi.getMyTrackings();
      return data || [];
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['tracking-stats'],
    queryFn: async () => {
      const { data } = await trackingApi.getStats();
      return data;
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (animeMalId) => {
      await trackingApi.removeTracking(animeMalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trackings'] });
    },
  });

  const [editingEp, setEditingEp] = useState(null);
  const [epInputValue, setEpInputValue] = useState('');

  const setEpMutation = useMutation({
    mutationFn: async ({ animeMalId, episodio }) => {
      const { data } = await trackingApi.setEpisode(animeMalId, episodio);
      return data;
    },
    onSuccess: () => {
      setEditingEp(null);
      setEpInputValue('');
      queryClient.invalidateQueries({ queryKey: ['my-trackings'] });
    },
  });

  function handleSetEpisode(animeMalId, value) {
    const ep = parseInt(value, 10);
    if (!isNaN(ep) && ep >= 0) {
      setEpMutation.mutate({ animeMalId, episodio: ep });
    }
  }

  function startEditing(malId, currentEp) {
    setEditingEp(malId);
    setEpInputValue(String(currentEp));
  }

  function adjustEditing(delta) {
    const current = parseInt(epInputValue, 10) || 0;
    const next = Math.max(0, current + delta);
    setEpInputValue(String(next));
  }

  const filteredTrackings = filter
    ? trackings.filter((t) => t.tracking?.status === filter)
    : trackings;

  async function handleRemove(animeMalId, e) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await toast.confirm('Remover este anime do tracking?');
    if (confirmed) {
      removeMutation.mutate(animeMalId, {
        onSuccess: () => toast.success('Anime removido do tracking'),
        onError: () => toast.error('Erro ao remover anime'),
      });
    }
  }

  return (
    <div className={`container ${styles.trackingPage}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Meu <span>Tracking</span>
        </h1>
        <p className={styles.subtitle}>
          {trackings.length} {trackings.length === 1 ? 'anime rastreado' : 'animes rastreados'}
        </p>
      </div>

      {/* Stats Hero */}
      {stats && (
        <div className={styles.statsHero}>
          <div className={styles.statsHero__item}>
            <span className={styles.statsHero__value}>{stats.total_episodios_assistidos}</span>
            <span className={styles.statsHero__label}>Episódios Assistidos</span>
          </div>
          <div className={styles.statsHero__item}>
            <span className={styles.statsHero__value}>{stats.total_animes_completos}</span>
            <span className={styles.statsHero__label}>Completos</span>
          </div>
          <div className={styles.statsHero__item}>
            <span className={styles.statsHero__value}>{stats.tempo_gasto.label}</span>
            <span className={styles.statsHero__label}>Tempo Gasto</span>
          </div>
          <div className={styles.statsHero__item}>
            <span className={styles.statsHero__value}>{stats.total_animes}</span>
            <span className={styles.statsHero__label}>Total Rastreados</span>
          </div>
          {stats.media_nota && (
            <div className={styles.statsHero__item}>
              <span className={styles.statsHero__value}>★ {stats.media_nota}</span>
              <span className={styles.statsHero__label}>Média</span>
            </div>
          )}
          <div className={styles.statsHero__item}>
            <span className={styles.statsHero__value}>{stats.total_assistindo}</span>
            <span className={styles.statsHero__label}>Assistindo</span>
          </div>
        </div>
      )}

      {trackings.length > 0 && (
        <div className={styles.filterBar}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.filterBtn} ${filter === opt.value ? styles['filterBtn--active'] : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}><div className="spinner" /></div>
      ) : filteredTrackings.length === 0 ? (
        <div className={`card ${styles.emptyState}`}>
          <p>{filter ? 'Nenhum anime com este status.' : 'Você ainda não está rastreado nenhum anime.'}</p>
          <Link to="/discovery" className="btn btn-primary">
            Explorar Animes
          </Link>
        </div>
      ) : (
        <div className={styles.trackList}>
          {filteredTrackings.map((item) => {
            const t = item.tracking;
            const a = item.anime;
            const statusClass = styles[`statusBadge--${t?.status}`] || '';

            const totalEp = a?.total_episodios;
            const watchedEp = t?.ultimo_episodio_assistido || 0;
            const hasProgress = totalEp && totalEp > 0 && watchedEp > 0;
            const percent = hasProgress
              ? Math.min(Math.round((watchedEp / totalEp) * 100), 100)
              : t?.status === 'completo' ? 100 : 0;

            let barClass = styles.progressBar__fill;
            if (percent >= 100) barClass += ` ${styles['progressBar__fill--complete']}`;
            else if (percent < 25) barClass += ` ${styles['progressBar__fill--low']}`;
            else barClass += ` ${styles['progressBar__fill--partial']}`;

            return (
              <Link
                key={t?.id || a?.mal_id}
                to={`/anime/${a?.mal_id}`}
                className={styles.trackCard}
              >
                <ImageWithFallback
                  className={styles.trackImage}
                  src={a?.capa_url || ''}
                  alt={a?.titulo}
                />
                <div className={styles.trackInfo}>
                  <div className={styles.trackTitle}>{a?.titulo || 'Desconhecido'}</div>
                  <div className={styles.trackMeta}>
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {STATUS_LABELS[t?.status] || t?.status}
                    </span>
                    {watchedEp > 0 && (
                      <span className={styles.progress}>
                        Ep. <strong>{watchedEp}</strong>
                        {totalEp ? ` / ${totalEp}` : ''}
                      </span>
                    )}
                    {t?.nota && (
                      <span className={styles.rating}>★ {t.nota}/10</span>
                    )}
                  </div>

                  {/* Barra de progresso visual */}
                  {totalEp > 0 && (
                    <div className={styles.progressBar}>
                      <div className={styles.progressBar__bg}>
                        <div
                          className={barClass}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className={styles.progressBar__label}>
                        <span>
                          <strong>{watchedEp}</strong>/{totalEp} episódios
                        </span>
                        <span>{percent}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  {editingEp === a?.mal_id ? (
                    <div className={styles.epEditGroup}>
                      <button
                        className={styles.epEditBtn}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); adjustEditing(-1); }}
                        disabled={setEpMutation.isPending || parseInt(epInputValue) <= 0}
                      >−</button>
                      <input
                        type="number"
                        className={styles.epEditInput}
                        min="0"
                        max={totalEp || 9999}
                        value={epInputValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEpInputValue(e.target.value)}
                        onBlur={() => handleSetEpisode(a?.mal_id, epInputValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSetEpisode(a?.mal_id, epInputValue);
                          }
                          if (e.key === 'Escape') {
                            setEditingEp(null);
                          }
                        }}
                      />
                      <button
                        className={styles.epEditBtn}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); adjustEditing(1); }}
                        disabled={setEpMutation.isPending || (totalEp && parseInt(epInputValue) >= totalEp)}
                      >+</button>
                      <button
                        className={styles.epEditSave}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSetEpisode(a?.mal_id, epInputValue); }}
                        disabled={setEpMutation.isPending}
                      >
                        {setEpMutation.isPending ? '...' : 'Ok'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className={styles.watchBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditing(a?.mal_id, watchedEp);
                        }}
                      >
                        {watchedEp} / {totalEp || '?'}
                      </button>
                    </>
                  )}
                  <span className={styles.episodes}>
                    {totalEp || '?'} eps
                  </span>
                  <Link
                    to={`/tracking/${a?.mal_id}/details`}
                    className={styles.detailsBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Detalhes
                  </Link>
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => handleRemove(a?.mal_id, e)}
                    disabled={removeMutation.isPending}
                  >
                    Remover
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

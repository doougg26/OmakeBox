import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, trackingApi, connectionApi, feedApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Avatar from '../../components/Avatar';
import ImageWithFallback from '../../components/ImageWithFallback';
import SpoilerBlock from '../../components/SpoilerBlock';
import EditProfileModal from './EditProfileModal';
import styles from './ProfilePage.module.scss';

const STATUS_LABELS = {
  assistindo: 'Assistindo',
  completo: 'Completo',
  planejo_assistir: 'Planejo Assistir',
  abandonado: 'Abandonado',
  em_pausa: 'Em Pausa',
};

export default function ProfilePage() {
  const { nickname } = useParams();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tracking');
  const [connectionError, setConnectionError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useDocumentTitle(nickname ? `Perfil de ${nickname}` : 'Perfil');

  const isOwnProfile = currentUser?.nickname === nickname;

  // Busca perfil
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', nickname],
    queryFn: async () => {
      const { data } = await userApi.getProfile(nickname);
      return data;
    },
    enabled: !!nickname,
  });

  // Busca trackings do perfil (usa endpoint público para outros, autenticado para próprio)
  const { data: trackings = [] } = useQuery({
    queryKey: ['profile-trackings', nickname],
    queryFn: async () => {
      if (isOwnProfile) {
        const { data } = await trackingApi.getMyTrackings();
        return data || [];
      }
      const { data } = await userApi.getTrackings(nickname);
      return data || [];
    },
    enabled: !!nickname,
  });

  // Busca posts do perfil (usa endpoint público para outros, autenticado para próprio)
  const { data: userPosts = [] } = useQuery({
    queryKey: ['profile-posts', nickname],
    queryFn: async () => {
      if (isOwnProfile) {
        const { data } = await feedApi.getUserPosts();
        return data || [];
      }
      const { data } = await userApi.getPosts(nickname);
      return data || [];
    },
    enabled: !!nickname,
  });

  // Conexões
  const { data: connections = [] } = useQuery({
    queryKey: ['my-connections'],
    queryFn: async () => {
      const { data } = await connectionApi.getConnections();
      return data || [];
    },
    enabled: !!currentUser,
  });

  // Solicitações pendentes
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data } = await connectionApi.getPendingRequests();
      return data || [];
    },
    enabled: !!currentUser,
  });

  // Reviews derivados dos trackings já carregados (evita chamada extra à API)
  const userReviews = useMemo(() =>
    (trackings || [])
      .filter((t) => t.tracking?.impressao_texto)
      .map((t) => ({ anime: t.anime, tracking: t.tracking })),
    [trackings]
  );

  // Enviar solicitação de conexão
  const sendConnectionMutation = useMutation({
    mutationFn: async () => {
      await connectionApi.sendRequest(profile.id);
    },
    onSuccess: () => {
      setConnectionError('');
      toast.success('Solicitação de conexão enviada!');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Erro ao enviar solicitação';
      setConnectionError(msg);
      toast.error(msg);
    },
  });

  // Aceitar solicitação
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId) => {
      await connectionApi.acceptRequest(connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    },
  });

  // Remover conexão
  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId) => {
      await connectionApi.removeConnection(connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
      toast.success('Conexão removida');
    },
    onError: () => toast.error('Erro ao remover conexão'),
  });

  // Stats do tracking (usa endpoint público para outros, autenticado para próprio)
  const { data: stats } = useQuery({
    queryKey: ['profile-stats', nickname],
    queryFn: async () => {
      if (isOwnProfile) {
        const { data } = await trackingApi.getStats();
        return data;
      }
      const { data } = await userApi.getStats(nickname);
      return data;
    },
    enabled: !!nickname,
  });

  if (isLoading) {
    return (
      <div className="container page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container page">
        <p className="error-text">Usuário não encontrado</p>
      </div>
    );
  }

  const isConnected = connections.some((c) => c.user?.nickname === nickname);
  const hasPendingRequest = pendingRequests.some(
    (r) => r.Solicitante?.nickname === currentUser?.nickname
  );

  return (
    <div className={styles.profilePage}>
      {/* Hero do perfil */}
      <div className={styles.hero}>
        <Avatar
          src={profile.avatar?.imagem_url}
          nickname={profile.nickname}
          size="xl"
        />
        <div className={styles.hero__info}>
          <h1 className={styles.hero__nickname}>{profile.nickname}</h1>
          <p className={styles.hero__meta}>
            Membro desde{' '}
            {profile.criado_em
              ? new Date(profile.criado_em).toLocaleDateString('pt-BR')
              : '—'}
          </p>

          {profile.bio && <p className={styles.hero__bio}>{profile.bio}</p>}

          {/* Stats compactas */}
          {stats && (
            <div className={styles.hero__stats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStat__value}>{stats.total_episodios_assistidos}</span>
                <span className={styles.heroStat__label}>Eps</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStat__value}>{stats.total_animes_completos}</span>
                <span className={styles.heroStat__label}>Completos</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStat__value}>{stats.total_animes}</span>
                <span className={styles.heroStat__label}>Rastreados</span>
              </div>
              {stats.media_nota && (
                <div className={styles.heroStat}>
                  <span className={styles.heroStat__value}>★ {stats.media_nota}</span>
                  <span className={styles.heroStat__label}>Média</span>
                </div>
              )}
            </div>
          )}

          {/* Links sociais */}
          {profile.links_sociais?.length > 0 && (
            <div className={styles.hero__links}>
              {profile.links_sociais.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.hero__link}
                >
                  {link.label || link.url}
                </a>
              ))}
            </div>
          )}

          {/* Conexões - resumo */}
          {connections.length > 0 && (
            <div className={styles.hero__connections}>
              <span className={styles.connectionsLabel}>
                {connections.length}{' '}
                {connections.length === 1 ? 'conexão' : 'conexões'}
              </span>
            </div>
          )}

          {/* Botão de editar perfil (próprio perfil) */}
          {isOwnProfile && (
            <div className={styles.hero__actions}>
              <button
                className="btn btn-primary"
                onClick={() => setShowEditModal(true)}
              >
                Editar Perfil
              </button>
            </div>
          )}

          {/* Botão de conectar (se não for o próprio perfil) */}
          {currentUser && !isOwnProfile && (
            <div className={styles.hero__actions}>
              {isConnected ? (
                <span className={styles.connectedBadge}>✓ Conectado</span>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => sendConnectionMutation.mutate()}
                  disabled={sendConnectionMutation.isPending}
                >
                  {sendConnectionMutation.isPending ? 'Enviando...' : 'Conectar'}
                </button>
              )}
              {connectionError && (
                <span className={styles.connectionMessage}>{connectionError}</span>
              )}
            </div>
          )}

          {/* Solicitações pendentes (apenas para o próprio perfil) */}
          {isOwnProfile && pendingRequests.length > 0 && (
            <div className={styles.pendingRequests}>
              <h4 className={styles.pendingRequests__title}>
                Solicitações pendentes ({pendingRequests.length})
              </h4>
              {pendingRequests.map((req) => (
                <div key={req.id} className={styles.pendingRequestItem}>
                  <Link to={`/perfil/${req.Solicitante?.nickname}`}>
                    {req.Solicitante?.nickname}
                  </Link>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                    onClick={() => acceptConnectionMutation.mutate(req.id)}
                    disabled={acceptConnectionMutation.isPending}
                  >
                    Aceitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'tracking' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Tracking ({trackings.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'reviews' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Impressões ({userReviews.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({userPosts.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'connections' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          Conexões ({connections.length})
        </button>
      </div>

      {/* Conteúdo das abas */}
      <div className={styles.tabContent}>
        {/* Tracking */}
        {activeTab === 'tracking' && (
          <div className={styles.trackingList}>
            {trackings.length === 0 ? (
              <div className={styles.emptyTab}>
                <p>Nenhum anime rastreado ainda.</p>
                {isOwnProfile && (
                  <Link to="/discovery" className="btn btn-primary">
                    Explorar Animes
                  </Link>
                )}
              </div>
            ) : (
              trackings.map((item) => {
                const t = item.tracking;
                const a = item.anime;
                const statusClass = styles[`statusBadge--${t?.status}`] || '';
                const totalEp = a?.total_episodios;
                const watchedEp = t?.ultimo_episodio_assistido || 0;
                const percent = totalEp > 0
                  ? Math.min(Math.round((watchedEp / totalEp) * 100), 100)
                  : 0;

                return (
                  <Link
                    key={t?.id || a?.mal_id}
                    to={`/anime/${a?.mal_id}`}
                    className={styles.trackingItem}
                  >
                    <ImageWithFallback
                      className={styles.trackingItem__image}
                      src={a?.capa_url || ''}
                      alt={a?.titulo}
                    />
                    <div className={styles.trackingItem__info}>
                      <div className={styles.trackingItem__title}>{a?.titulo}</div>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {STATUS_LABELS[t?.status] || t?.status}
                      </span>
                      {t?.nota && (
                        <span className={styles.trackingItem__rating}>
                          ★ {t.nota}/10
                        </span>
                      )}
                      {totalEp > 0 && (
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressBar__fill}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                      <span className={styles.trackingItem__episodes}>
                        Ep. {watchedEp}{totalEp ? ` / ${totalEp}` : ''}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Impressões */}
        {activeTab === 'reviews' && (
          <div className={styles.reviewsList}>
            {userReviews.length === 0 ? (
              <div className={styles.emptyTab}>
                <p>Nenhuma impressão registrada.</p>
              </div>
            ) : (
              userReviews.map((item) => (
                <div key={item.tracking?.id} className={styles.reviewCard}>
                  <Link
                    to={`/anime/${item.anime?.mal_id}`}
                    className={styles.reviewCard__header}
                  >
                    <ImageWithFallback
                      src={item.anime?.capa_url || ''}
                      alt={item.anime?.titulo}
                    />
                    <div>
                      <div className={styles.reviewCard__title}>
                        {item.anime?.titulo}
                      </div>
                      {item.tracking?.nota && (
                        <div className={styles.reviewCard__rating}>
                          ★ {item.tracking.nota}/10
                        </div>
                      )}
                    </div>
                  </Link>
                  <p className={styles.reviewCard__text}>
                    {item.tracking?.impressao_texto}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          <div className={styles.postsList}>
            {userPosts.length === 0 ? (
              <div className={styles.emptyTab}>
                <p>Nenhum post publicado.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  <div className={styles.postCard__header}>
                    <Link
                      to={`/anime/${post.anime?.mal_id}`}
                      className={styles.postCard__anime}
                    >
                      {post.anime?.titulo}
                    </Link>
                    <span className={styles.postCard__time}>
                      {new Date(post.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {post.marcado_como_spoiler ? (
                    <SpoilerBlock>
                      <p className={styles.postCard__text}>{post.texto}</p>
                    </SpoilerBlock>
                  ) : (
                    <p className={styles.postCard__text}>{post.texto}</p>
                  )}
                  <div className={styles.postCard__footer}>
                    <span>❤ {post.likes_count}</span>
                    <span>💬 {post.comment_count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Conexões */}
        {activeTab === 'connections' && (
          <div className={styles.connectionsList}>
            {connections.length === 0 ? (
              <div className={styles.emptyTab}>
                <p>Nenhuma conexão ainda.</p>
              </div>
            ) : (
              connections.map((conn) => (
                <div key={conn.id} className={styles.connectionItem}>
                  <Link
                    to={`/perfil/${conn.user?.nickname}`}
                    className={styles.connectionItem__info}
                  >
                    <Avatar
                      src={conn.user?.avatar?.imagem_url}
                      nickname={conn.user?.nickname}
                      size="sm"
                    />
                    <div>
                      <div className={styles.connectionItem__nickname}>
                        {conn.user?.nickname}
                      </div>
                      <div className={styles.connectionItem__date}>
                        Conectado em{' '}
                        {new Date(conn.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </Link>
                  {isOwnProfile && (
                    <button
                      className={styles.removeConnectionBtn}
                      onClick={async () => {
                        const confirmed = await toast.confirm('Remover esta conexão?');
                        if (confirmed) {
                          removeConnectionMutation.mutate(conn.id);
                        }
                      }}
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de edição de perfil */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          queryClient={queryClient}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

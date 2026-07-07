import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './NotificationsPage.module.scss';

const NOTIF_LABELS = {
  novo_episodio: 'Novo episódio disponível',
  curtida: 'Curtiu seu post',
  comentario: 'Comentou em seu post',
  solicitacao_conexao: 'Enviou uma solicitação de conexão',
  conexao_aceita: 'Aceitou sua solicitação de conexão',
};

function getNotificationLink(notification) {
  const { referencia_tipo, referencia_id } = notification;
  switch (referencia_tipo) {
    case 'post':
      // Sem rota de post individual, redireciona para o feed
      return '/feed';
    case 'anime':
      return `/anime/${referencia_id}`;
    case 'user':
      // referencia_id é um UUID, não nickname — fallback para feed
      return '/feed';
    default:
      return '#';
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7) return `há ${days}d`;
  return d.toLocaleDateString('pt-BR');
}

export default function NotificationsPage() {
  useDocumentTitle('Notificações');
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await notificationApi.getNotifications(page);
      return data || { notifications: [], unread_count: 0 };
    },
    enabled: isAuthenticated,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await notificationApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  // Mark all as read
  const markAllMutation = useMutation({
    mutationFn: async () => {
      await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container page">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b8398', marginBottom: '1rem' }}>
            Faça login para ver suas notificações.
          </p>
          <Link to="/login" className="btn btn-primary">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Notifi<span>cações</span>
          </h1>
          <p className={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
              : 'Todas lidas'}
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending ? '...' : 'Marcar todas como lidas'}
          </button>
        )}
      </div>

      {error ? (
        <div className={styles.emptyState}>
          <p className="error-text">Erro ao carregar notificações. Tente novamente mais tarde.</p>
        </div>
      ) : isLoading ? (
        <div className={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonDot} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} style={{ width: '70%' }} />
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3>Nenhuma notificação</h3>
          <p>Você receberá notificações quando alguém curtir ou comentar seus posts, ou enviar solicitações de conexão.</p>
        </div>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((notif) => {
            const label = NOTIF_LABELS[notif.tipo] || notif.tipo;
            const link = getNotificationLink(notif);

            return (
              <div
                key={notif.id}
                className={`${styles.notifItem} ${!notif.lida ? styles['notifItem--unread'] : ''}`}
              >
                <div className={styles.notifDot}>
                  {!notif.lida && <div className={styles.unreadDot} />}
                </div>

                <div className={styles.notifContent}>
                  <Link
                    to={link}
                    className={styles.notifLink}
                    onClick={() => {
                      if (!notif.lida) {
                        markReadMutation.mutate(notif.id);
                      }
                    }}
                  >
                    <span className={styles.notifText}>
                      {label}
                    </span>
                  </Link>
                  <span className={styles.notifTime}>
                    {formatDate(notif.criado_em)}
                  </span>
                </div>

                <div className={styles.notifActions}>
                  {!notif.lida && (
                    <button
                      className={styles.markReadBtn}
                      onClick={() => markReadMutation.mutate(notif.id)}
                      title="Marcar como lida"
                      disabled={markReadMutation.isPending}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Paginação */}
          {notifications.length >= 50 && (
            <div className={styles.pagination}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <span className={styles.pagination__info}>Página {page}</span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => setPage((p) => p + 1)}
                disabled={notifications.length < 50}
              >
                Próximo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

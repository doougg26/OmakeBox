import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import Avatar from './Avatar';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const { data: notifData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { data } = await notificationApi.getUnreadCount();
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll a cada 30s
  });

  const unreadCount = notifData?.unread_count || 0;

  return (
    <nav className={styles.navbar}>
      <Link to="/discovery" className={styles.navbar__brand}>
        Omake<span>Box</span>
      </Link>

      <div className={styles.navbar__links}>
        <NavLink
          to="/discovery"
          className={({ isActive }) =>
            `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
          }
        >
          Discovery
        </NavLink>
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
          }
        >
          Feed
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink
              to="/tracking"
              className={({ isActive }) =>
                `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
              }
            >
              Tracking
            </NavLink>
            <NavLink
              to={`/perfil/${user.nickname}`}
              className={({ isActive }) =>
                `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
              }
            >
              Perfil
            </NavLink>
          </>
        )}
      </div>

      <div className={styles.navbar__user}>
        {isAuthenticated ? (
          <>
            <NavLink to="/notifications" className={styles.navbar__notifBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.navbar__notifBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
            <Avatar
              src={user.avatar?.imagem_url}
              nickname={user.nickname}
              size="md"
            />
            <span>{user.nickname}</span>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={logout}>
              Sair
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={styles.navbar__link}>Entrar</NavLink>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
              Cadastrar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationApi } from '../services/api';
import Avatar from './Avatar';
import Icon from './Icon';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { data } = await notificationApi.getUnreadCount();
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unread_count || 0;

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar__left}>
        <Link to="/discovery" className={styles.navbar__brand} onClick={closeMenu}>
          Omake<span>Box</span>
        </Link>

        <div className={`${styles.navbar__links} ${menuOpen ? styles['navbar__links--open'] : ''}`}>
          <NavLink
            to="/discovery"
            className={({ isActive }) =>
              `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
            }
            onClick={closeMenu}
          >
            <Icon name="compass" size={16} />
            <span className={styles.navbar__linkLabel}>Descobrir</span>
          </NavLink>
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
            }
            onClick={closeMenu}
          >
            <Icon name="feed" size={16} />
            <span className={styles.navbar__linkLabel}>Feed</span>
          </NavLink>

          {isAuthenticated && (
            <>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
            }
            onClick={closeMenu}
          >
            <Icon name="barChart" size={16} />
            <span className={styles.navbar__linkLabel}>Estatísticas</span>
          </NavLink>
          <NavLink
            to="/tracking"
                className={({ isActive }) =>
                  `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
                }
                onClick={closeMenu}
              >
                <Icon name="list" size={16} />
                <span className={styles.navbar__linkLabel}>Tracking</span>
              </NavLink>
              <NavLink
                to={`/perfil/${user.nickname}`}
                className={({ isActive }) =>
                  `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
                }
                onClick={closeMenu}
              >
                <Icon name="user" size={16} />
                <span className={styles.navbar__linkLabel}>Perfil</span>
              </NavLink>
            </>
          )}

          {/* Menu items visíveis apenas no mobile */}
          <div className="hide-desktop" style={{ marginTop: '8px' }}>
            <hr className={styles.navbar__divider} />
            {!isAuthenticated && (
              <div className={styles.navbar__mobileAuth}>
                <Link to="/login" className={styles.navbar__link} onClick={closeMenu}>
                  <Icon name="login" size={16} />
                  <span>Entrar</span>
                </Link>
                <Link to="/register" className={styles.navbar__link} onClick={closeMenu}>
                  <Icon name="userPlus" size={16} />
                  <span>Cadastrar</span>
                </Link>
              </div>
            )}
            <button className={styles.navbar__themeBtn} onClick={() => { toggleTheme(); closeMenu(); }}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.navbar__right}>
        <button
          className={styles.navbar__iconBtn}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        {isAuthenticated ? (
          <>
            <NavLink to="/notifications" className={styles.navbar__notifBtn}>
              <Icon name="notifications" size={18} />
              {unreadCount > 0 && (
                <span className={styles.navbar__notifBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
            <NavLink to={`/perfil/${user.nickname}`} className={styles.navbar__userBtn}>
              <Avatar
                src={user.avatar?.imagem_url}
                nickname={user.nickname}
                size="xs"
              />
            </NavLink>
          </>
        ) : (
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/login" className={styles.navbar__link}>Entrar</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
              Cadastrar
            </Link>
          </div>
        )}

        <button
          className={`${styles.navbar__hamburger} ${menuOpen ? styles['navbar__hamburger--open'] : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && <div className={styles.navbar__overlay} onClick={closeMenu} />}
    </nav>
  );
}

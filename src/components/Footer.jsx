import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';
import styles from './Footer.module.scss';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <div className={styles.footer__brand}>
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="OmakeBox"
            className={styles.footer__logo}
          />
          <p className={styles.footer__desc}>
            Rastreie, avalie e compartilhe sua jornada pelos animes.
          </p>
        </div>

        <div className={styles.footer__links}>
          <div className={styles.footer__col}>
            <h4 className={styles.footer__heading}>Navegar</h4>
            <Link to="/discovery" className={styles.footer__link}>Discovery</Link>
            <Link to="/feed" className={styles.footer__link}>Feed</Link>
            <Link to="/stats" className={styles.footer__link}>Estatísticas</Link>
          </div>
          <div className={styles.footer__col}>
            <h4 className={styles.footer__heading}>Conta</h4>
            <Link to="/tracking" className={styles.footer__link}>Meu Tracking</Link>
            <Link to="/login" className={styles.footer__link}>Entrar</Link>
          </div>
        </div>

        <div className={styles.footer__bottom}>
          <p className={styles.footer__copyright}>
            &copy; {new Date().getFullYear()} OmakeBox. Dados via{' '}
            <a href="https://jikan.moe" target="_blank" rel="noopener noreferrer" className={styles.footer__external}>
              Jikan API
            </a>.
          </p>
          <div className={styles.footer__social}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.footer__socialLink} title="GitHub">
              <Icon name="github" size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

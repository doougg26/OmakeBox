import { Link } from 'react-router-dom';
import styles from './AnimeCard.module.scss';

export default function AnimeCard({ anime, showEpisodes = false }) {
  return (
    <Link to={`/anime/${anime.mal_id}`} className={styles.card}>
      <img
        className={styles.image}
        src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || ''}
        alt={anime.title}
        loading="lazy"
      />
      <div className={styles.info}>
        <h3 className={styles.title}>{anime.title}</h3>
        <div className={styles.meta}>
          {anime.score && (
            <span className={styles.score}>★ {anime.score}</span>
          )}
          {anime.type && <span>{anime.type}</span>}
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {showEpisodes && anime.airing && (
            <span className={styles.airing}>Lançando</span>
          )}
        </div>
      </div>
    </Link>
  );
}

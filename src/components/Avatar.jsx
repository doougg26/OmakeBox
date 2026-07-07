import { useState } from 'react';
import styles from './Avatar.module.scss';

export default function Avatar({
  src,
  nickname,
  size = 'md',
  className = '',
  onClick,
}) {
  const [imgError, setImgError] = useState(false);

  const hasImage = src && !imgError;
  const initial = nickname?.charAt(0)?.toUpperCase() || '?';

  const sizeClass = styles[size] || styles.md;

  function handleError() {
    setImgError(true);
  }

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={nickname || ''}
    >
      {hasImage ? (
        <img
          src={src}
          alt={nickname || ''}
          className={styles.image}
          onError={handleError}
          loading="lazy"
        />
      ) : (
        <span className={styles.initials}>{initial}</span>
      )}
    </div>
  );
}

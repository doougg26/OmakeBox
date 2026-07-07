import { useState } from 'react';
import styles from './Avatar.module.scss';

const PLACEHOLDER = '/avatar-placeholder.png';

export default function Avatar({
  src,
  nickname,
  size = 'md',
  className = '',
  onClick,
}) {
  const [imgError, setImgError] = useState(false);

  const imageSrc = src && !imgError ? src : PLACEHOLDER;

  const sizeClass = styles[size] || styles.md;

  function handleError() {
    if (imgError) return; // evita loop se o placeholder também falhar
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
      <img
        src={imageSrc}
        alt={nickname || 'Avatar'}
        className={styles.image}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

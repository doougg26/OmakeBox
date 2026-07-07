import { useState } from 'react';

const FALLBACK_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect fill="#233344" width="200" height="300"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#6b8398">🎬</text>
  </svg>`
)}`;

export default function ImageWithFallback({
  src,
  alt,
  className,
  style,
  fallback = FALLBACK_SVG,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  function handleError() {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}

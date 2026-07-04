import { useState } from 'react';

export default function SpoilerBlock({ children }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      onClick={() => setRevealed(true)}
      style={{
        cursor: revealed ? 'default' : 'pointer',
        userSelect: revealed ? 'auto' : 'none',
        filter: revealed ? 'none' : 'blur(6px)',
        background: revealed ? 'transparent' : 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: revealed ? 0 : '0.5rem 1rem',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {!revealed && (
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            color: '#9aafc4',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            background: '#1a2a3a',
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #2d4155',
          }}
        >
          Clique para revelar (spoiler)
        </span>
      )}
      {children}
    </div>
  );
}

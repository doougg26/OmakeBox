/**
 * Sanitiza URLs para uso seguro em atributos href, prevenindo XSS.
 * Bloqueia protocolos perigosos como javascript:, data:, vbscript:.
 */
const UNSAFE_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  // Bloqueia protocolos perigosos
  if (UNSAFE_PROTOCOLS.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitiza e retorna um URL seguro para href.
 * Retorna '#' se o URL for inválido/perigoso para manter a UI consistente.
 */
export function safeHref(url) {
  const sanitized = sanitizeUrl(url);
  return sanitized || '#';
}

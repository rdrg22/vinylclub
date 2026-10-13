/** Utilidades para construir consultas Lucene seguras a partir de texto del usuario. */

const SPECIAL = /([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g

/** Escapa los caracteres especiales y desactiva AND/OR/NOT escritos por el usuario («Black AND White»). */
export function escapeTerms(text: string): string {
  return text
    .trim()
    .replace(SPECIAL, '\\$1')
    .replace(/\b(AND|OR|NOT)\b/g, (op) => op.toLowerCase())
}

/** Frase exacta entre comillas. */
export const quote = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`

/**
 * Búsqueda de discos por texto libre. MusicBrainz no tiene datos de popularidad,
 * así que se ordena por: coincidencia exacta con el artista o con el título,
 * luego coincidencia de palabras, y se priorizan álbumes con ediciones oficiales.
 */
export function albumTextQuery(text: string): string {
  const phrase = quote(text.trim())
  return `+(artistname:${phrase}^4 OR releasegroup:${phrase}^3 OR ${escapeTerms(text)}) primarytype:album^2 status:official^2`
}

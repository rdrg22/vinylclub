/**
 * Forma comparable de un título o nombre: sin acentos, sin mayúsculas, sin
 * paréntesis de edición («(Remastered)», «[Deluxe]»), sin puntuación ni espacios.
 */
export function comparable(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, ' ')
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '')
}

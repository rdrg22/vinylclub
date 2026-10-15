/**
 * Códigos de barras de discos: EAN-13 (Europa), UPC-A (EE. UU., 12 cifras), EAN-8 y
 * GTIN-14. MusicBrainz guarda el número tal como aparece en la funda, así que se
 * normaliza (solo cifras) y se prueban las variantes equivalentes UPC-A ⇄ EAN-13.
 */

/** Deja solo las cifras («0 77774-6439 2 0» → «0777746439220»). */
export const normalizeBarcode = (input: string) => input.replace(/\D/g, '')

const GTIN_LENGTHS = new Set([8, 12, 13, 14])

/** Dígito de control GTIN (módulo 10, pesos 3 y 1 desde la derecha). */
export function isValidGtin(digits: string): boolean {
  if (!/^\d+$/.test(digits) || !GTIN_LENGTHS.has(digits.length)) return false
  const body = digits.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i])
    sum += i % 2 === 0 ? digit * 3 : digit
  }
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1))
}

export type BarcodeCheck = 'empty' | 'too-short' | 'valid' | 'unchecked'

/**
 * Comprobación orientativa. Un dígito de control que no cuadra no bloquea la
 * búsqueda (hay ediciones antiguas con códigos atípicos): solo se avisa.
 */
export function checkBarcode(input: string): BarcodeCheck {
  const digits = normalizeBarcode(input)
  if (!digits) return 'empty'
  if (digits.length < 6) return 'too-short'
  return isValidGtin(digits) ? 'valid' : 'unchecked'
}

/** El mismo código escrito de las formas que puede tener en MusicBrainz. */
export function barcodeVariants(input: string): string[] {
  const digits = normalizeBarcode(input)
  if (!digits) return []
  const variants = [digits]
  if (digits.length === 12) variants.push(`0${digits}`) // UPC-A → EAN-13
  if (digits.length === 13 && digits.startsWith('0')) variants.push(digits.slice(1)) // EAN-13 → UPC-A
  return [...new Set(variants)]
}

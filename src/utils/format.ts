const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Fecha parcial de MusicBrainz (YYYY, YYYY-MM o YYYY-MM-DD) sin inventar la precisión que falta. */
export function formatPartialDate(date: string | undefined): string | undefined {
  if (!date) return undefined
  const [year, month, day] = date.split('-')
  const monthName = month ? MONTHS[Number.parseInt(month, 10) - 1] : undefined
  if (day && monthName) return `${Number.parseInt(day, 10)} ${monthName} ${year}`
  if (monthName) return `${monthName} ${year}`
  return year
}

/** Códigos especiales de MusicBrainz que no son países ISO. */
const SPECIAL_REGIONS: Record<string, string> = { XW: 'Mundial', XE: 'Europa', XU: 'Desconocido' }
let regionNames: Intl.DisplayNames | null | undefined

export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined
  if (SPECIAL_REGIONS[code]) return SPECIAL_REGIONS[code]
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(['es'], { type: 'region' })
    } catch {
      regionNames = null
    }
  }
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

export const formatCount = (n: number) => n.toLocaleString('es-ES')

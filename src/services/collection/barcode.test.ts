import { describe, expect, it } from 'vitest'
import { barcodeVariants, checkBarcode, isValidGtin, normalizeBarcode } from './barcode'

describe('códigos de barras', () => {
  it('deja solo las cifras', () => {
    expect(normalizeBarcode(' 0 77774-6439 2 0 ')).toBe('077774643920')
  })

  it('valida el dígito de control GTIN', () => {
    expect(isValidGtin('4006381333931')).toBe(true) // EAN-13
    expect(isValidGtin('036000291452')).toBe(true) // UPC-A
    expect(isValidGtin('96385074')).toBe(true) // EAN-8
    expect(isValidGtin('4006381333932')).toBe(false)
    expect(isValidGtin('12345')).toBe(false)
  })

  it('avisa sin bloquear', () => {
    expect(checkBarcode('')).toBe('empty')
    expect(checkBarcode('123')).toBe('too-short')
    expect(checkBarcode('036000291452')).toBe('valid')
    expect(checkBarcode('036000291453')).toBe('unchecked')
  })

  it('prueba UPC-A y EAN-13 equivalentes', () => {
    expect(barcodeVariants('036000291452')).toEqual(['036000291452', '0036000291452'])
    expect(barcodeVariants('0036000291452')).toEqual(['0036000291452', '036000291452'])
    expect(barcodeVariants('4006381333931')).toEqual(['4006381333931'])
    expect(barcodeVariants('abc')).toEqual([])
  })
})

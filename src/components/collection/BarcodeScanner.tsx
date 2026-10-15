/**
 * Escáner de códigos de barras con la cámara, usando la API nativa BarcodeDetector
 * (Chrome en Android, Edge/Chrome en macOS…). Donde no existe, el botón no aparece
 * y el código se escribe a mano. La imagen no sale del dispositivo.
 */
import { useEffect, useRef, useState } from 'react'

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options?: { formats: string[] }) => BarcodeDetectorLike

const FORMATS = ['ean_13', 'upc_a', 'ean_8', 'upc_e']

const detectorCtor = () => (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector

/** La cámara solo funciona en contexto seguro (https o localhost). */
export const canScanBarcodes = () =>
  typeof window !== 'undefined' && window.isSecureContext && !!detectorCtor() && !!navigator.mediaDevices?.getUserMedia

function cameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError') return 'No hay permiso para usar la cámara. Actívalo en el navegador o escribe el código a mano.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No se encuentra ninguna cámara.'
  if (name === 'NotReadableError') return 'La cámara está ocupada por otra aplicación.'
  return 'No se ha podido abrir la cámara.'
}

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const done = useRef(onDetected)
  done.current = onDetected

  useEffect(() => {
    dialog.current?.showModal()
    const Detector = detectorCtor()
    if (!Detector) {
      setError('Este navegador no sabe leer códigos de barras.')
      return
    }
    const detector = new Detector({ formats: FORMATS })
    let stream: MediaStream | null = null
    let timer = 0
    let stopped = false

    const scan = async () => {
      if (stopped) return
      const v = video.current
      if (v && v.readyState >= 2) {
        try {
          const [hit] = await detector.detect(v)
          if (hit?.rawValue && !stopped) {
            stopped = true
            navigator.vibrate?.(60)
            done.current(hit.rawValue)
            return
          }
        } catch {
          // Fotograma no válido: se prueba con el siguiente.
        }
      }
      timer = window.setTimeout(scan, 200)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (video.current) {
          video.current.srcObject = s
          void video.current.play().catch(() => undefined)
        }
        scan()
      })
      .catch((e: unknown) => setError(cameraError(e)))

    return () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      aria-labelledby="scanner-title"
      className="m-auto w-[min(92vw,28rem)] bg-paper p-0 text-ink backdrop:bg-ink/70"
    >
      <div className="flex items-center justify-between border-b border-ink px-4 py-3">
        <h2 id="scanner-title" className="label-mono">
          Escanear código de barras
        </h2>
        <button type="button" onClick={onClose} className="label-mono text-ink-soft hover:text-signal">
          Cerrar ✕
        </button>
      </div>
      {error ? (
        <p role="alert" className="p-6 text-signal-deep">
          {error}
        </p>
      ) : (
        <div className="relative aspect-[4/3] bg-ink">
          <video ref={video} muted playsInline className="size-full object-cover" />
          {/* Guía: el código dentro de la franja */}
          <div aria-hidden className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 border-2 border-paper/90 shadow-[0_0_0_999px_rgba(22,20,18,0.35)]">
            <div className="absolute inset-x-0 top-1/2 h-px bg-signal" />
          </div>
        </div>
      )}
      <p className="px-4 py-3 text-sm text-ink-soft">Apunta al código de barras de la funda (normalmente en la contraportada).</p>
    </dialog>
  )
}

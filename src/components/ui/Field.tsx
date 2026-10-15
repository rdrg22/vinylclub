import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
}

/** Campo de formulario con etiqueta en mono y línea inferior, como el buscador. */
export function Field({ label, hint, className, ...input }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label-mono block text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        {...input}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1 w-full border-b border-ink/40 bg-transparent py-2 text-base placeholder:text-ink-faint transition-colors focus:border-ink focus:outline-none"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Aviso dentro de un formulario: error (rojo) o confirmación. */
export function FormNotice({ tone, children }: { tone: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('border-l-2 py-1 pl-3 text-sm', tone === 'error' ? 'border-signal text-signal-deep' : 'border-ink text-ink')}
    >
      {children}
    </p>
  )
}

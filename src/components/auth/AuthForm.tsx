/** Formulario de cuenta: entrar, crear cuenta o pedir el enlace para cambiar la contraseña. */
import { useState, type FormEvent } from 'react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Field, FormNotice } from '@/components/ui/Field'
import { cn } from '@/utils/cn'
import { useAuth } from './authContext'

type Mode = 'entrar' | 'registro' | 'recuperar'

const MIN_PASSWORD = 8

const SUBMIT: Record<Mode, string> = {
  entrar: 'Entrar',
  registro: 'Crear cuenta',
  recuperar: 'Enviar enlace',
}

export function AuthForm() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setNotice(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    if (mode === 'registro' && password.length < MIN_PASSWORD) {
      setNotice({ tone: 'error', text: `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.` })
      return
    }
    setBusy(true)
    try {
      if (mode === 'entrar') {
        const error = await auth.signIn(email, password)
        if (error) setNotice({ tone: 'error', text: error })
      } else if (mode === 'registro') {
        const { error, confirm } = await auth.signUp(email, password)
        if (error) setNotice({ tone: 'error', text: error })
        else if (confirm) setNotice({ tone: 'ok', text: `Te hemos enviado un email a ${email.trim()}. Abre el enlace para activar tu cuenta.` })
      } else {
        const error = await auth.sendPasswordReset(email)
        // Mismo mensaje exista o no la cuenta: no se revela qué emails están registrados.
        setNotice(error ? { tone: 'error', text: error } : { tone: 'ok', text: 'Si hay una cuenta con ese email, te llegará un enlace para elegir contraseña nueva.' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {mode !== 'recuperar' ? (
        <div role="tablist" aria-label="Entrar o crear cuenta" className="flex gap-6">
          {(['entrar', 'registro'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn('label-mono border-b-2 pb-1 transition-colors', mode === m ? 'border-signal text-ink' : 'border-transparent text-ink-faint hover:text-ink')}
            >
              {SUBMIT[m]}
            </button>
          ))}
        </div>
      ) : (
        <p className="label-mono text-ink-soft">Recuperar contraseña</p>
      )}

      <Field label="Email" type="email" name="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />

      {mode !== 'recuperar' && (
        <div className="relative">
          <Field
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'entrar' ? undefined : MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={mode === 'entrar' ? undefined : `Al menos ${MIN_PASSWORD} caracteres.`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="label-mono absolute top-7 right-0 py-2 text-ink-faint hover:text-ink"
            aria-pressed={showPassword}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>
      )}

      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" disabled={busy || auth.state.status === 'loading'} className={buttonClass('primary')}>
          {busy ? 'Un momento…' : SUBMIT[mode]}
        </button>
        {mode === 'entrar' && (
          <button type="button" onClick={() => switchMode('recuperar')} className="text-sm text-ink-soft underline underline-offset-4 hover:text-signal">
            He olvidado mi contraseña
          </button>
        )}
        {mode === 'recuperar' && (
          <button type="button" onClick={() => switchMode('entrar')} className="text-sm text-ink-soft underline underline-offset-4 hover:text-signal">
            Volver a entrar
          </button>
        )}
      </div>
    </form>
  )
}

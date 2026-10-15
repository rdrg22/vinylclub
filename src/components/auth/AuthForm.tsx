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
  const [name, setName] = useState('')
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
        const { error, confirm } = await auth.signUp(email, password, name)
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
      {mode !== 'recuperar' && (
        <>
          <button
            type="button"
            disabled={busy || auth.state.status === 'loading'}
            onClick={async () => {
              setNotice(null)
              setBusy(true)
              const error = await auth.signInWithGoogle()
              setBusy(false)
              if (error) setNotice({ tone: 'error', text: error })
            }}
            className="flex items-center justify-center gap-3 rounded-sm border border-ink/40 bg-white px-4 py-3 text-[15px] font-medium text-[#1f1f1f] transition-colors hover:border-ink disabled:opacity-50"
          >
            <GoogleMark />
            Continuar con Google
          </button>
          <p className="label-mono flex items-center gap-3 text-ink-faint before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">
            o con tu email
          </p>
        </>
      )}
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

      {mode === 'registro' && (
        <Field label="Tu nombre (opcional)" type="text" name="name" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      )}

      <Field label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

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

/** Logotipo «G» de Google (el que pide su guía para los botones de inicio de sesión). */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/auth/authContext'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Field, FormNotice } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { cn } from '@/utils/cn'

type Mode = 'entrar' | 'registro' | 'recuperar' | 'nueva'

const MIN_PASSWORD = 8

const TITLES: Record<Mode, string> = {
  entrar: 'Entrar',
  registro: 'Crear cuenta',
  recuperar: 'Recuperar contraseña',
  nueva: 'Nueva contraseña',
}

/** Solo rutas internas: evita que `?siguiente=` mande a otra web. */
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/coleccion')

export function LoginPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('siguiente'))
  const [mode, setMode] = useState<Mode>(params.get('nueva') ? 'nueva' : 'entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)

  if (auth.state.status === 'demo') {
    return (
      <>
        <PageHeader eyebrow="Cuentas" title="Entrar" />
        <StateMessage
          eyebrow="Modo demostración"
          title="Las cuentas todavía no están activadas"
          action={
            <Link to="/coleccion" className={buttonClass('primary')}>
              Probar la colección en este navegador
            </Link>
          }
        >
          Para entrar con tu cuenta hay que conectar la tienda con Firebase (los pasos están en el README). Mientras tanto
          puedes probar la colección: se guarda solo en este navegador.
        </StateMessage>
      </>
    )
  }

  // Ya dentro: a la colección (salvo si viene a poner contraseña nueva).
  if (auth.state.status === 'signed-in' && mode !== 'nueva') return <Navigate to={next} replace />

  const switchMode = (m: Mode) => {
    setMode(m)
    setNotice(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    if ((mode === 'registro' || mode === 'nueva') && password.length < MIN_PASSWORD) {
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
      } else if (mode === 'recuperar') {
        const error = await auth.sendPasswordReset(email)
        // Mismo mensaje exista o no la cuenta: no se revela qué emails están registrados.
        setNotice(error ? { tone: 'error', text: error } : { tone: 'ok', text: 'Si hay una cuenta con ese email, te llegará un enlace para elegir contraseña nueva.' })
      } else {
        const error = await auth.updatePassword(password)
        if (error) setNotice({ tone: 'error', text: error })
        else {
          setNotice({ tone: 'ok', text: 'Contraseña cambiada.' })
          setMode('entrar')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const loading = auth.state.status === 'loading'

  return (
    <>
      <PageHeader eyebrow="Tu cuenta" title={TITLES[mode]}>
        Con tu cuenta puedes registrar los discos que tienes en casa y llevar tu colección a todas partes.
      </PageHeader>

      <div className="grid gap-10 border-t-2 border-ink pt-8 md:grid-cols-[minmax(0,26rem)_1fr]">
        <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate={false}>
          {(mode === 'entrar' || mode === 'registro') && (
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
                  {TITLES[m]}
                </button>
              ))}
            </div>
          )}

          {mode !== 'nueva' && (
            <Field label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          )}

          {mode !== 'recuperar' && (
            <div className="relative">
              <Field
                label={mode === 'nueva' ? 'Contraseña nueva' : 'Contraseña'}
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

          <button type="submit" disabled={busy || loading} className={buttonClass('primary', 'self-start')}>
            {busy ? 'Un momento…' : mode === 'entrar' ? 'Entrar' : mode === 'registro' ? 'Crear cuenta' : mode === 'recuperar' ? 'Enviar enlace' : 'Guardar contraseña'}
          </button>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {mode === 'entrar' && (
              <button type="button" onClick={() => switchMode('recuperar')} className="underline underline-offset-4 hover:text-signal">
                He olvidado mi contraseña
              </button>
            )}
            {(mode === 'recuperar' || mode === 'nueva') && (
              <button type="button" onClick={() => switchMode('entrar')} className="underline underline-offset-4 hover:text-signal">
                Volver a entrar
              </button>
            )}
          </div>
        </form>

        <aside className="hidden self-start border-l border-rule pl-8 text-ink-soft md:block">
          <p className="label-mono text-ink-faint">Qué guardamos</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Tu email y tu contraseña (cifrada) en Firebase.</li>
            <li>Los discos que añadas a tu colección: solo los ves tú.</li>
            <li>Los datos de cada disco vienen de MusicBrainz.</li>
          </ul>
        </aside>
      </div>
    </>
  )
}

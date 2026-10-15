import { useEffect, useState, type ReactNode } from 'react'

export function Num({
  value, onChange, disabled, width = 90, placeholder,
}: { value: number; onChange: (n: number) => void; disabled?: boolean; width?: number; placeholder?: string }) {
  const [t, setT] = useState(String(value))
  useEffect(() => {
    if (parseFloat(t) !== value && !(t === '' && value === 0)) setT(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      className="num"
      style={{ width }}
      inputMode="decimal"
      value={t}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => {
        const s = e.target.value
        setT(s)
        const n = parseFloat(s)
        if (!Number.isNaN(n)) onChange(n)
        else if (s === '') onChange(0)
      }}
    />
  )
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card">
      {(title || right) && (
        <header>
          <h3>{title}</h3>
          <div>{right}</div>
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Badge({ kind, children }: { kind: 'ok' | 'warn' | 'bad' | 'info' | 'mute'; children: ReactNode }) {
  return <span className={`badge ${kind}`}>{children}</span>
}

export function Notice({ kind, children }: { kind: 'warn' | 'bad' | 'info'; children: ReactNode }) {
  return <div className={`notice ${kind}`}>{children}</div>
}

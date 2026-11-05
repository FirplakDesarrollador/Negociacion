export function fmtM(v: number, d = 1): string {
  return (v >= 0 ? '+' : '') + (v / 1e6).toFixed(d) + 'M'
}

export function fmtP(v: number, d = 2): string {
  return (v > 0 ? '+' : '') + v.toFixed(d) + '%'
}

export function fmtC(v: number): string {
  return Math.abs(v) < 5e4 ? '—' : fmtM(v)
}

export function num(v: number): string {
  return Math.round(v).toLocaleString('es-CO')
}

export function big(v: number): string {
  return '$' + Math.round(v / 1e6).toLocaleString('es-CO') + ' M'
}

export function bigS(v: number): string {
  return (v < 0 ? '−' : '+') + '$' + Math.abs(Math.round(v / 1e6)).toLocaleString('es-CO') + ' M'
}

export function cc(v: number): string {
  return v > 5e4 ? 'cr' : v < -5e4 ? 'cg' : 'cn'
}

export function ccA(v: number): string {
  return v > 5e4 ? 'cg' : v < -5e4 ? 'cr' : 'cn'
}

export function cp(v: number | null | undefined): string {
  return v == null ? 'cn' : v > 0.05 ? 'cr' : v < -0.05 ? 'cg' : 'cn'
}

export function colP(p: number, pa: number): string {
  return p > pa ? 'var(--rd)' : p < pa ? 'var(--gn)' : 'var(--t2)'
}

export function colPc(v: number): string {
  return v > 0.05 ? 'var(--rd)' : v < -0.05 ? 'var(--gn)' : 'var(--t2)'
}

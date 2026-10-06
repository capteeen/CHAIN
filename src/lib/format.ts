export function sol(v: number, digits?: number): string {
  const d = digits ?? (v >= 100 ? 1 : v >= 1 ? 2 : 3);
  return `${v.toFixed(d)} SOL`;
}

export function num(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

export function shortCa(ca?: string): string {
  if (!ca) return '—';
  return `${ca.slice(0, 4)}…${ca.slice(-4)}`;
}

export function ago(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function minutes(m: number): string {
  if (!isFinite(m)) return '—';
  if (m < 1) return '<1 min';
  if (m < 90) return `${Math.round(m)} min`;
  return `${(m / 60).toFixed(1)} h`;
}

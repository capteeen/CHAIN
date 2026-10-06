// Deterministic placeholder artwork for mock chains (no gold: gold is reserved for link #1).

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BGS = ['#3B4A5C', '#2A2F36', '#5B6878', '#8A949F', '#1F2933', '#4C5A6B', '#6E6E6E', '#A9B1BA'];
const FGS = ['#F4F4F2', '#DADAD6', '#111111', '#FFFFFF'];

export function chainArt(seed: string, ticker: string): string {
  const h = hash(seed);
  const bg = BGS[h % BGS.length];
  const fg = FGS[(h >> 3) % (bg === '#A9B1BA' || bg === '#8A949F' ? 1 : FGS.length)];
  const fgSafe = bg === '#A9B1BA' || bg === '#8A949F' ? '#111111' : fg === '#111111' ? '#F4F4F2' : fg;
  const shape = (h >> 7) % 4;
  const r = 18 + ((h >> 11) % 18);
  const shapes = [
    `<circle cx="64" cy="54" r="${r}" fill="none" stroke="${fgSafe}" stroke-width="8"/>`,
    `<rect x="${64 - r}" y="${54 - r}" width="${r * 2}" height="${r * 2}" rx="${r / 2}" fill="${fgSafe}" opacity=".9"/>`,
    `<path d="M64 ${54 - r} L${64 + r} ${54 + r} L${64 - r} ${54 + r}Z" fill="${fgSafe}"/>`,
    `<ellipse cx="52" cy="54" rx="${r}" ry="${r * 0.6}" fill="none" stroke="${fgSafe}" stroke-width="7"/><ellipse cx="76" cy="54" rx="${r}" ry="${r * 0.6}" fill="none" stroke="${fgSafe}" stroke-width="7"/>`,
  ];
  const label = ticker.slice(0, 5).replace(/[<&>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="${bg}"/>${shapes[shape]}<text x="64" y="112" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="800" letter-spacing="-0.5" fill="${fgSafe}">$${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

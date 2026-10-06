import type { Chain } from '../types';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/**
 * Per-chain OG image (1200×630): image, name, "LENGTH 47", fees to #1.
 * Rendered client-side in Phase 1; Phase 2 serves the same layout from /og/:id.png (api.ogImageUrl).
 */
export async function renderOg(chain: Chain): Promise<string> {
  const W = 1200;
  const H = 630;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#F4F4F2';
  g.fillRect(0, 0, W, H);
  const font = (w: number, px: number) => `${w} ${px}px Inter, Helvetica, Arial, sans-serif`;

  const img = await loadImage(chain.image);
  const S = 360;
  const x = 80;
  const y = (H - S) / 2;
  g.save();
  g.beginPath();
  g.roundRect(x, y, S, S, 40);
  g.clip();
  if (img) g.drawImage(img, x, y, S, S);
  else {
    g.fillStyle = '#3B4A5C';
    g.fillRect(x, y, S, S);
  }
  g.restore();
  g.lineWidth = 10;
  g.strokeStyle = '#DADAD6';
  g.beginPath();
  g.roundRect(x, y, S, S, 40);
  g.stroke();

  const tx = x + S + 70;
  g.fillStyle = '#6E6E6E';
  g.font = font(600, 26);
  g.fillText('CHAIN', tx, 150);
  g.fillStyle = '#111111';
  let size = 92;
  g.font = font(900, size);
  const name = chain.name.toUpperCase();
  while (g.measureText(name).width > W - tx - 60 && size > 40) g.font = font(900, (size -= 4));
  g.fillText(name, tx, 150 + size + 10);

  g.font = font(800, 64);
  g.fillText(`LENGTH ${chain.length}`, tx, 400);
  g.font = font(600, 34);
  g.fillStyle = '#6E6E6E';
  const pre = 'FEES TO ';
  g.fillText(pre, tx, 470);
  const w1 = g.measureText(pre).width;
  g.fillStyle = '#C9A227';
  g.fillText('#1', tx + w1, 470);
  const w2 = g.measureText('#1 ').width;
  g.fillStyle = '#111111';
  g.fillText(`${chain.feesToRoot.toFixed(2)} SOL`, tx + w1 + w2, 470);
  if (chain.status === 'broken') {
    g.fillStyle = '#C0392B';
    g.font = font(800, 28);
    g.fillText('BROKEN', tx, 530);
  }
  return c.toDataURL('image/png');
}

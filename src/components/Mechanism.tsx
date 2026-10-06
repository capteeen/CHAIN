import { useEffect, useRef, useState } from 'react';

/**
 * The utility, as a loop you can watch: a link trades → the fee splits 30% back to #1 and
 * 70% into that link's vault → when the vault is full the link forges the next one.
 * Pure SVG + CSS transitions, no backend. Self-paced; pauses off-screen.
 */

type Phase = 'idle' | 'drop' | 'split' | 'paid' | 'forge';

const SPACING = 80;
const X0 = 56;
const Y = 112;
const WINDOW = 4; // links kept in view before the line scrolls

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const CAPTION: Record<Phase, string> = {
  idle: 'The newest link waits for a trade.',
  drop: 'Someone trades the newest link. Creator fees land.',
  split: '30% flies back to #1. 70% sinks into this link’s vault.',
  paid: 'Holders of #1 are paid. Every link does this.',
  forge: 'Vault full. The link forges the next one — once.',
};

export function Mechanism({ className = '' }: { className?: string }) {
  const [n, setN] = useState(3);
  const [vault, setVault] = useState(0.35);
  const [phase, setPhase] = useState<Phase>('idle');
  const [forging, setForging] = useState<number | undefined>(undefined);
  const [running, setRunning] = useState(true);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || REDUCED) return;
    let t: number;
    let alive = true;
    const after = (ms: number, f: () => void) => {
      t = window.setTimeout(() => alive && f(), ms);
    };
    const cycle = () => {
      setPhase('drop');
      after(650, () => {
        setPhase('split');
        setVault((v) => Math.min(1, v + 0.34));
        after(1500, () => {
          setPhase('paid');
          after(700, () => {
            setVault((v) => {
              if (v >= 0.99) {
                setPhase('forge');
                setN((k) => {
                  setForging(k + 1);
                  return k + 1;
                });
                after(1400, () => {
                  setForging(undefined);
                  setPhase('idle');
                  after(900, cycle);
                });
                return 0;
              }
              setPhase('idle');
              after(900, cycle);
              return v;
            });
          });
        });
      });
    };
    after(600, cycle);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [running]);

  const tip = n;
  const xOf = (k: number) => X0 + (k - 1) * SPACING;
  const shift = Math.max(0, tip - WINDOW) * SPACING;
  const tipX = xOf(tip) - shift;
  const rootX = X0 - shift;
  const rootVisible = rootX > 20;
  const links = Array.from({ length: n }, (_, i) => i + 1).filter((k) => xOf(k) - shift > -60);
  const heat = vault;

  return (
    <div ref={host} className={`mech ${className}`} data-phase={phase}>
      <svg viewBox="0 0 440 212" className="block h-auto w-full" role="img" aria-label="How a chain forges">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* baseline */}
        <line x1="0" x2="440" y1={Y} y2={Y} className="mech-line" />

        {/* links */}
        <g style={{ transform: `translateX(${-shift}px)`, transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)' }}>
          {links.map((k) => {
            const x = xOf(k);
            const isRoot = k === 1;
            const isTip = k === tip;
            const bar = k % 2 === 0;
            return (
              <g key={k} className={`mech-link ${isRoot ? 'is-root' : ''} ${isTip ? 'is-tip' : ''} ${forging === k ? 'is-forging' : ''}`}>
                {bar ? (
                  <rect x={x - 46} y={Y - 8} width={92} height={16} rx={8} className="mech-ring" />
                ) : (
                  <ellipse cx={x} cy={Y} rx={38} ry={23} className="mech-ring" pathLength={100} />
                )}
                {isRoot && phase === 'paid' && <ellipse cx={x} cy={Y} rx={46} ry={30} className="mech-pay" filter="url(#glow)" />}
                {isTip && !bar && <ellipse cx={x} cy={Y} rx={38} ry={23} className="mech-heat" style={{ opacity: heat * 0.9 }} />}
                {isTip && bar && <rect x={x - 46} y={Y - 8} width={92} height={16} rx={8} className="mech-heat" style={{ opacity: heat * 0.9 }} />}
                <text x={x} y={Y + 48} textAnchor="middle" className={`mech-num ${isRoot ? 'is-root' : ''}`}>
                  #{k}
                </text>
                {forging === k && (
                  <g className="mech-spark" style={{ transform: `translate(${x - 40}px, ${Y}px)` }}>
                    {[0, 60, 120, 180, 240, 300].map((d) => (
                      <circle key={d} r="2" className="mech-ray" style={{ ['--dx' as string]: `${Math.cos((d * Math.PI) / 180) * 18}px`, ['--dy' as string]: `${Math.sin((d * Math.PI) / 180) * 18}px` }} />
                    ))}
                  </g>
                )}
              </g>
            );
          })}
          {/* ghost slot for the next link */}
          <g className="mech-ghost" style={{ opacity: phase === 'forge' ? 0 : 1 }}>
            {tip % 2 === 0 ? (
              <ellipse cx={xOf(tip + 1)} cy={Y} rx={38} ry={23} />
            ) : (
              <rect x={xOf(tip + 1) - 46} y={Y - 8} width={92} height={16} rx={8} />
            )}
            <text x={xOf(tip + 1)} y={Y + 48} textAnchor="middle" className="mech-num">
              next
            </text>
          </g>
        </g>

        {/* vault gauge under the tip */}
        <g style={{ transform: `translateX(${tipX}px)`, transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)' }}>
          <rect x={-34} y={Y + 60} width={68} height={6} rx={3} className="mech-track" />
          <rect x={-34} y={Y + 60} width={68 * vault} height={6} rx={3} className="mech-fill" />
          <text x={0} y={Y + 82} textAnchor="middle" className="mech-cap">
            vault {Math.round(vault * 100)}%
          </text>
          {/* the fee coin */}
          <g className="mech-coin" style={{ transform: phase === 'drop' || phase === 'split' ? `translateY(${Y - 30}px)` : 'translateY(10px)', opacity: phase === 'drop' ? 1 : 0 }}>
            <circle r="11" className="mech-coin-c" />
            <text y="4" textAnchor="middle" className="mech-coin-t">
              fee
            </text>
          </g>
          {/* 70% → vault */}
          {[0, 1].map((i) => (
            <circle
              key={i}
              r="4"
              className="mech-dot"
              style={{
                transform: phase === 'split' || phase === 'paid' ? `translate(${i * 10 - 5}px, ${Y + 62}px)` : `translate(${i * 10 - 5}px, ${Y - 24}px)`,
                opacity: phase === 'split' ? 1 : 0,
                transition: `transform 900ms ${i * 120}ms cubic-bezier(.4,0,.6,1), opacity 300ms`,
              }}
            />
          ))}
          <text x={14} y={Y + 44} className="mech-tag" style={{ opacity: phase === 'split' ? 1 : 0 }}>
            70% → vault
          </text>
        </g>

        {/* 30% → #1, flying back along the line */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            r="4"
            className="mech-dot"
            style={{
              transform:
                phase === 'split' || phase === 'paid'
                  ? `translate(${Math.max(rootX, 6)}px, ${Y - 34 - i * 2}px)`
                  : `translate(${tipX}px, ${Y - 24}px)`,
              opacity: phase === 'split' ? 1 : 0,
              transition: phase === 'split' ? `transform ${1100 + i * 110}ms ${i * 90}ms cubic-bezier(.3,0,.2,1), opacity 250ms` : 'opacity 250ms',
            }}
          />
        ))}
        <text x={(Math.max(rootX, 6) + tipX) / 2} y={Y - 44} textAnchor="middle" className="mech-tag" style={{ opacity: phase === 'split' || phase === 'paid' ? 1 : 0 }}>
          30% → <tspan className="fill-gold">#1</tspan>
        </text>
        {!rootVisible && (
          <text x={8} y={Y - 34} className="mech-tag fill-gold">
            ← #1
          </text>
        )}
      </svg>
      <p className="mech-caption">{CAPTION[phase]}</p>
    </div>
  );
}

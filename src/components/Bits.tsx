import { useState, type ReactNode } from 'react';
import { useTween } from '../lib/useTween';
import { useUi } from '../ui';
import { Reveal } from './Reveal';

export function SectionHead({ eyebrow, lines, id }: { eyebrow: string; lines: [string, string]; id?: string }) {
  return (
    <Reveal className="mb-10 sm:mb-14">
      <div id={id}>
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h2 className="h2">
          {lines[0]}
          <br />
          <span className="text-muted">{lines[1]}</span>
        </h2>
      </div>
    </Reveal>
  );
}

export function ChainImage({ src, n, size = 40, root }: { src: string; n?: number; size?: number; root?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        className={`h-full w-full rounded-xl object-cover ${root ? 'ring-2 ring-gold' : 'ring-1 ring-rule'}`}
        draggable={false}
      />
      {n !== undefined && (
        <span
          className={`absolute -bottom-1.5 -right-1.5 rounded-full px-1.5 text-[10px] font-bold leading-4 ${
            n === 1 ? 'bg-gold text-black' : 'bg-ink text-[rgb(var(--base))]'
          }`}
        >
          #{n}
        </span>
      )}
    </span>
  );
}

export function VaultBar({ value, max, className = '', hot }: { value: number; max: number; className?: string; hot?: boolean }) {
  const p = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-rule ${className}`}>
      <div className={`h-full rounded-full bg-steel transition-[width] duration-500 ${hot && p > 0.8 ? 'bar-hot' : ''}`} style={{ width: `${p * 100}%` }} />
    </div>
  );
}

export function Counter({ value, format }: { value: number; format: (v: number) => string }) {
  const v = useTween(value, 600);
  return <>{format(v)}</>;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="no-bar -mx-4 mb-6 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      {options.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={k === value} className={`tab shrink-0 ${k === value ? 'tab-on' : ''}`} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Copy({ text, children }: { text: string; children?: ReactNode }) {
  const say = useUi((s) => s.say);
  const [done, setDone] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-ink"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setDone(true);
        say('Copied');
        setTimeout(() => setDone(false), 1200);
      }}
      title="Copy"
    >
      {children ?? text}
      <span aria-hidden>{done ? '✓' : '⧉'}</span>
    </button>
  );
}

export function Arrow() {
  return <span aria-hidden>→</span>;
}

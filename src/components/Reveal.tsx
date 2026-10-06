import { useEffect, useRef, type ReactNode } from 'react';

/** Fades/slides children in when they scroll into view. `delay` staggers siblings. */
export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as 'div';
  return (
    <T ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </T>
  );
}

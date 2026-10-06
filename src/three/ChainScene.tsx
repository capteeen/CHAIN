// 3D chain: every link is a torus, alternating orientation so they interlock. The scene only
// moves on real store events — trades drop a coin on the link, 30% of it flies back along the
// chain to link #1, 70% sinks into the tip's vault (which heats up), and when the vault is full
// a new link forges in with a spark. A break drops the tip in red.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '../store';
import type { ChainEvent, Link } from '../types';
import { LabelLayer } from './labels';
import { ParticleSystem, PCOLORS } from './particles';

export type SceneMode = 'hero' | 'live' | 'detail';

const SP = 1.55; // spacing between link centres
const COL = {
  gold: new THREE.Color('#C9A227'),
  steel: new THREE.Color('#3B4A5C'),
  steelNight: new THREE.Color('#7A8EA6'),
  dead: new THREE.Color('#C0392B'),
  hot: new THREE.Color('#FFFFFF'),
};
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const xOf = (n: number) => (n - 1) * SP;
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function useNightFlag() {
  const [night, setNight] = useState(() => document.documentElement.classList.contains('night'));
  useEffect(() => {
    const mo = new MutationObserver(() => setNight(document.documentElement.classList.contains('night')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return night;
}

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

interface RigProps {
  chainId: string;
  mode: SceneMode;
  selected?: number;
  onSelect?: (n: number) => void;
  labels: React.MutableRefObject<LabelLayer | undefined>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  night: boolean;
}

function Rig({ chainId, mode, selected, onSelect, labels, pointer, night }: RigProps) {
  const links = useStore((s) => s.links[chainId]);
  const chain = useStore((s) => s.chains[chainId]);
  const meshes = useRef(new Map<number, THREE.Mesh>());
  const mats = useRef(new Map<number, THREE.MeshStandardMaterial>());
  const queue = useRef<ChainEvent[]>([]);
  const forgedAt = useRef(new Map<number, number>());
  const brokeAt = useRef<number | undefined>(undefined);
  const ps = useMemo(() => new ParticleSystem(320), []);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));
  const { camera, size } = useThree();

  const geo = useMemo(() => new THREE.TorusGeometry(0.72, 0.19, 18, 56), []);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 10, 10), []);

  // Only consume events newer than the ones present at mount: no replay of history.
  useEffect(() => {
    let last = useStore.getState().events[0]?.id ?? 0;
    const unsub = useStore.subscribe((s) => {
      const fresh: ChainEvent[] = [];
      for (const e of s.events) {
        if (e.id <= last) break;
        if (e.chainId === chainId) fresh.push(e);
      }
      last = Math.max(last, s.events[0]?.id ?? 0);
      if (fresh.length) queue.current.push(...fresh.reverse());
    });
    return unsub;
  }, [chainId]);

  useEffect(() => {
    if (instRef.current) ps.mesh = instRef.current;
  });
  useEffect(() => () => labels.current?.clear(), [chainId, labels]);

  const matFor = (l: Link) => {
    let m = mats.current.get(l.n);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.32 });
      mats.current.set(l.n, m);
    }
    return m;
  };

  const n = links?.length ?? 0;
  const tip = links?.[n - 1];

  useFrame((_, dt) => {
    if (!links || !tip) return;
    const now = performance.now();
    const steel = night ? COL.steelNight : COL.steel;

    // ---- drain events ----
    for (const e of queue.current.splice(0)) {
      const m = meshes.current.get(e.n);
      const at = m ? m.position.clone() : new THREE.Vector3(xOf(e.n), 0, 0);
      if (e.kind === 'trade') {
        const fee = e.amount ?? 0;
        ps.fly('coin', at.clone().setY(3.2), at.clone().setY(0.25), { lift: 0, dur: 420, size: 0.12, color: night ? PCOLORS.paper : PCOLORS.ink });
        // 70% → this link's vault (sinks into the tip)
        const tipPos = new THREE.Vector3(xOf(tip.n), 0, 0);
        for (let i = 0; i < 3; i++)
          ps.fly('vault', at.clone().setY(0.25), tipPos.clone().setZ(0.1), { lift: 0.6 + i * 0.2, dur: 650 + i * 90, size: 0.06, color: steel, delay: 420 + i * 60 });
        if (mode !== 'hero') labels.current?.set(`t${e.id}`, at.clone().setY(1.1), { text: `+${fee.toFixed(3)} SOL`, cls: 'lbl-float', ttl: 1500, rise: true });
      } else if (e.kind === 'fee_to_root') {
        // 30% → link #1, flying back along the line
        const root = new THREE.Vector3(0, 0, 0.3);
        const dist = at.x;
        for (let i = 0; i < 4; i++)
          ps.fly('root', at.clone().setY(0.3), root, {
            lift: 1.4 + Math.min(3, dist * 0.08) + i * 0.25,
            dur: Math.min(2600, 600 + dist * 28) + i * 70,
            size: 0.07,
            color: night ? PCOLORS.paper : PCOLORS.ink,
            delay: 420 + i * 70,
          });
        if (mode === 'live' && e.n !== 1) labels.current?.set(`r${e.id}`, at.clone().setY(0.6), { text: '30% → #1', cls: 'lbl-float', ttl: 1600, rise: true });
      } else if (e.kind === 'forge') {
        forgedAt.current.set(e.n, now);
        ps.burst(new THREE.Vector3(xOf(e.n), 0, 0), 30, night ? PCOLORS.paper : PCOLORS.ink);
        if (mode !== 'hero') labels.current?.set(`f${e.id}`, new THREE.Vector3(xOf(e.n), 1.3, 0), { text: `#${e.n} forged`, cls: 'lbl-float lbl-forge', ttl: 2200, rise: true });
      } else if (e.kind === 'break') {
        brokeAt.current = now;
        if (mode !== 'hero') labels.current?.set(`b${e.id}`, new THREE.Vector3(xOf(e.n), 1.3, 0), { text: 'Broken', cls: 'lbl-float lbl-broken', ttl: 3000, rise: true });
      }
    }

    // ---- links ----
    const fill = Math.min(1, tip.vault / tip.threshold);
    const pulse = 0.5 + 0.5 * Math.sin(now / 180);
    for (const l of links) {
      const m = meshes.current.get(l.n);
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial;
      const isTip = l.n === tip.n && chain?.status === 'forging';
      const base = l.n === 1 ? COL.gold : !l.alive ? COL.dead : steel;
      mat.color.copy(base);
      if (isTip) {
        // vault heat: the tip glows brighter as it approaches the forge threshold
        const heat = fill * fill * (0.25 + (fill > 0.85 ? 0.6 * pulse : 0));
        mat.emissive.copy(COL.hot);
        mat.emissiveIntensity = heat;
      } else if (selected === l.n) {
        mat.emissive.copy(base);
        mat.emissiveIntensity = 0.35;
      } else {
        mat.emissiveIntensity = 0;
      }

      // forge-in: 400ms scale with overshoot, plus a quarter spin into place
      const f = forgedAt.current.get(l.n);
      const base_sx = 1.4;
      if (f !== undefined && now - f < 400 && !REDUCED) {
        const t = (now - f) / 400;
        const s = easeOutBack(t);
        m.scale.set(base_sx * s, s, s);
        m.rotation.y = (1 - t) * Math.PI * 0.5;
      } else {
        m.scale.set(base_sx, 1, 1);
        m.rotation.y = 0;
      }

      // dead tip: swings down and drops off the line
      if (!l.alive) {
        const b = brokeAt.current;
        const t = b === undefined ? 1 : Math.min(1, (now - b) / 1200);
        const e = t * t;
        m.position.y = -1.6 * e;
        m.rotation.z = -0.9 * e;
        m.position.x = xOf(l.n) + 0.35 * e;
      } else {
        m.position.set(xOf(l.n), 0, 0);
        m.rotation.z = 0;
      }
      // idle sway so the line feels alive
      if (!REDUCED) m.position.y += Math.sin(now / 900 + l.n * 0.6) * 0.03;
    }

    ps.update();

    // ---- camera ----
    const tipX = xOf(tip.n);
    const aspect = size.width / size.height;
    const narrow = aspect < 1;
    const focusX = mode === 'detail' && selected ? xOf(selected) - 0.5 : n < 7 ? tipX / 2 + 0.5 : tipX - (narrow ? 1.5 : 3.2);
    camTarget.current.x += (focusX - camTarget.current.x) * Math.min(1, dt * 3.5);
    const px = REDUCED ? 0 : pointer.current.x;
    const py = REDUCED ? 0 : pointer.current.y;
    const sway = REDUCED ? 0 : Math.sin(now / 4000) * 0.6;
    const dist = (mode === 'hero' ? 14 : 10.5) * (narrow ? 1.55 : 1);
    // hero: chain runs along the lower band, under the copy
    const lookY = mode === 'hero' ? (narrow ? 1.0 : 3.1) : 0;
    camera.position.set(camTarget.current.x + sway + px * 1.4, 2.4 + py * 0.9 + (mode === 'hero' ? 1.2 : 0), dist);
    camera.lookAt(camTarget.current.x, lookY, 0);

    // ---- persistent labels ----
    const L = labels.current;
    if (L) {
      if (mode !== 'hero') {
        L.set('root', new THREE.Vector3(0, -1.25, 0), { text: mode === 'live' ? '#1 · earns 30% of every link' : '#1', cls: 'lbl-root lbl-key', pin: true });
        if (chain?.status === 'forging')
          L.set('tip', new THREE.Vector3(tipX, -1.25, 0), { text: `#${tip.n} · vault ${Math.floor(fill * 100)}%`, cls: 'lbl-key', pin: false });
        else L.set('tip', new THREE.Vector3(tipX, -1.25, 0), { text: `#${tip.n} · broken`, cls: 'lbl-key lbl-broken', pin: false });
        // numbers near the camera
        const lo = Math.max(2, Math.floor(camTarget.current.x / SP) - 6);
        const hi = Math.min(n - 1, lo + 14);
        for (let k = lo; k <= hi; k++) L.set(`n${k}`, new THREE.Vector3(xOf(k), -1.05, 0), { text: `#${k}`, cls: 'lbl-num' });
        for (let k = 2; k < lo; k++) L.remove(`n${k}`);
        for (let k = hi + 1; k <= n; k++) L.remove(`n${k}`);
      } else {
        L.set('root', new THREE.Vector3(0, -1.2, 0), { text: '#1', cls: 'lbl-root lbl-key' });
        L.set('tip', new THREE.Vector3(tipX, -1.2, 0), { text: `#${tip.n}`, cls: 'lbl-key' });
      }
      L.update(camera, size.width, size.height);
    }
  });

  if (!links) return null;
  return (
    <group>
      {links.map((l) => (
        <mesh
          key={l.ca}
          ref={(m) => {
            if (m) meshes.current.set(l.n, m);
            else meshes.current.delete(l.n);
          }}
          geometry={geo}
          material={matFor(l)}
          position={[xOf(l.n), 0, 0]}
          rotation={[l.n % 2 === 0 ? Math.PI / 2 : 0, 0, 0]}
          scale={[1.4, 1, 1]}
          castShadow
          onClick={(e) => {
            if (!onSelect) return;
            e.stopPropagation();
            onSelect(l.n);
          }}
          onPointerOver={() => onSelect && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => onSelect && (document.body.style.cursor = '')}
        />
      ))}
      <instancedMesh ref={instRef} args={[sphere, undefined, ps.max]} frustumCulled={false}>
        <meshStandardMaterial metalness={0.3} roughness={0.5} />
      </instancedMesh>
      {/* the line the chain hangs on */}
      <mesh position={[Math.max(0, xOf(n) - 0) / 2, 0, -0.6]} rotation={[0, 0, 0]}>
        <boxGeometry args={[Math.max(xOf(n) + 40, 60), 0.012, 0.012]} />
        <meshBasicMaterial color={night ? '#2A2A28' : '#DADAD6'} />
      </mesh>
    </group>
  );
}

export function ChainScene({
  chainId,
  mode,
  selected,
  onSelect,
  className = '',
  interactive = mode !== 'hero',
}: {
  chainId: string;
  mode: SceneMode;
  selected?: number;
  onSelect?: (n: number) => void;
  className?: string;
  interactive?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labelHost = useRef<HTMLDivElement>(null);
  const labels = useRef<LabelLayer | undefined>(undefined);
  const pointer = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  const night = useNightFlag();

  useLayoutEffect(() => {
    if (labelHost.current) labels.current = new LabelLayer(labelHost.current);
    return () => labels.current?.clear();
  }, []);

  // Pause rendering while off-screen.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Parallax from the pointer (window-wide for the hero so text on top doesn't block it).
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const target = mode === 'hero' ? window : el;
    const onMove = (ev: Event) => {
      const e = ev as PointerEvent;
      const r = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.current.y = ((e.clientY - r.top) / r.height - 0.5) * -2;
    };
    const onLeave = () => (pointer.current = { x: 0, y: 0 });
    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerleave', onLeave);
    return () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', onLeave);
    };
  }, [mode]);

  return (
    <div ref={host} className={`relative ${className}`} style={{ pointerEvents: interactive ? 'auto' : 'none', touchAction: 'pan-y' }}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ fov: 32, near: 0.1, far: 200, position: [0, 2.4, 11] }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: 'absolute', inset: 0 }}
        eventSource={undefined}
      >
        <Env />
        <hemisphereLight args={[night ? 0x5a6470 : 0xffffff, night ? 0x101010 : 0xb9bcc2, night ? 0.35 : 0.5]} />
        <directionalLight position={[4, 8, 6]} intensity={night ? 1.6 : 1.9} />
        <directionalLight position={[-6, 3, -4]} intensity={0.5} color={night ? '#8FA3BA' : '#DADAD6'} />
        <Rig chainId={chainId} mode={mode} selected={selected} onSelect={onSelect} labels={labels} pointer={pointer} night={night} />
      </Canvas>
      <div ref={labelHost} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />
    </div>
  );
}

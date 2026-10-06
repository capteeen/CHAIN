// Pooled particles (fees travelling along the chain, forge sparks) on one InstancedMesh.
import * as THREE from 'three';

export type ParticleKind = 'coin' | 'root' | 'vault' | 'spark';

interface Particle {
  kind: ParticleKind;
  from: THREE.Vector3;
  to: THREE.Vector3;
  ctrl: THREE.Vector3;
  t0: number;
  dur: number;
  size: number;
  color: THREE.Color;
  vel?: THREE.Vector3;
}

const tmpM = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);

export const PCOLORS = {
  ink: new THREE.Color('#111111'),
  paper: new THREE.Color('#F4F4F2'),
  steel: new THREE.Color('#3B4A5C'),
  steelLight: new THREE.Color('#8FA3BA'),
};

export class ParticleSystem {
  readonly max: number;
  private list: Particle[] = [];
  mesh?: THREE.InstancedMesh;

  constructor(max = 300) {
    this.max = max;
  }

  get count() {
    return this.list.length;
  }

  /** Bezier flight from a to b with an arc of `lift`. */
  fly(kind: ParticleKind, a: THREE.Vector3, b: THREE.Vector3, opts: { lift?: number; dur?: number; size?: number; color?: THREE.Color; delay?: number } = {}) {
    if (this.list.length >= this.max) this.list.shift();
    const ctrl = a.clone().add(b).multiplyScalar(0.5);
    ctrl.y += opts.lift ?? 1.5;
    ctrl.z += 0.4;
    this.list.push({
      kind,
      from: a.clone(),
      to: b.clone(),
      ctrl,
      t0: performance.now() + (opts.delay ?? 0),
      dur: opts.dur ?? 900,
      size: opts.size ?? 0.09,
      color: opts.color ?? PCOLORS.ink,
    });
  }

  /** Radial burst with gravity (the forge spark). */
  burst(at: THREE.Vector3, n = 28, color = PCOLORS.ink) {
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) this.list.shift();
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
      this.list.push({
        kind: 'spark',
        from: at.clone(),
        to: at.clone(),
        ctrl: at.clone(),
        t0: performance.now(),
        dur: 500 + Math.random() * 350,
        size: 0.04 + Math.random() * 0.05,
        color: i % 3 === 0 ? PCOLORS.steelLight : color,
        vel: dir.multiplyScalar(3 + Math.random() * 4),
      });
    }
  }

  update() {
    const mesh = this.mesh;
    if (!mesh) return;
    const now = performance.now();
    this.list = this.list.filter((p) => now - p.t0 < p.dur);
    for (let i = 0; i < this.max; i++) {
      const p = this.list[i];
      if (!p || now < p.t0) {
        mesh.setMatrixAt(i, HIDE);
        continue;
      }
      const t = (now - p.t0) / p.dur;
      let s = p.size;
      if (p.kind === 'spark') {
        const dt = (now - p.t0) / 1000;
        tmpP.copy(p.from).addScaledVector(p.vel!, dt);
        tmpP.y -= 4.5 * dt * dt;
        s = p.size * (1 - t);
      } else {
        // quadratic bezier with ease-in-out
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const u = 1 - e;
        tmpP.set(
          u * u * p.from.x + 2 * u * e * p.ctrl.x + e * e * p.to.x,
          u * u * p.from.y + 2 * u * e * p.ctrl.y + e * e * p.to.y,
          u * u * p.from.z + 2 * u * e * p.ctrl.z + e * e * p.to.z,
        );
        if (p.kind === 'vault') s = p.size * (1 - t * 0.7);
        if (p.kind === 'coin') s = p.size * (0.4 + 0.6 * Math.min(1, t * 3));
      }
      tmpM.compose(tmpP, tmpQ, tmpS.setScalar(s));
      mesh.setMatrixAt(i, tmpM);
      mesh.setColorAt(i, p.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}

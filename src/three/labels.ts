// Imperative HTML labels projected from 3D points. Driven from useFrame, so no React re-renders.
import * as THREE from 'three';

export interface LabelSpec {
  text: string;
  cls?: string;
  /** Pin to the viewport edge instead of hiding when off-screen. */
  pin?: boolean;
  /** Auto-remove after this many ms. */
  ttl?: number;
  /** Drift upward while alive (for "+fee" floats). */
  rise?: boolean;
}

interface Entry extends LabelSpec {
  el: HTMLDivElement;
  born: number;
  pos: THREE.Vector3;
}

const v = new THREE.Vector3();

export class LabelLayer {
  private entries = new Map<string, Entry>();
  constructor(private host: HTMLDivElement) {}

  set(id: string, pos: THREE.Vector3, spec: LabelSpec) {
    let e = this.entries.get(id);
    if (!e) {
      const el = document.createElement('div');
      el.className = 'lbl';
      this.host.appendChild(el);
      e = { ...spec, el, born: performance.now(), pos: pos.clone() };
      this.entries.set(id, e);
    } else {
      Object.assign(e, spec);
      e.pos.copy(pos);
    }
    if (e.el.textContent !== spec.text) e.el.textContent = spec.text;
    const cls = `lbl ${spec.cls ?? ''}`;
    if (e.el.className !== cls) e.el.className = cls;
  }

  remove(id: string) {
    const e = this.entries.get(id);
    if (!e) return;
    e.el.remove();
    this.entries.delete(id);
  }

  clear() {
    for (const id of Array.from(this.entries.keys())) this.remove(id);
  }

  update(camera: THREE.Camera, width: number, height: number) {
    const now = performance.now();
    for (const [id, e] of this.entries) {
      const age = now - e.born;
      if (e.ttl && age > e.ttl) {
        this.remove(id);
        continue;
      }
      v.copy(e.pos);
      if (e.rise) v.y += (age / 1000) * 1.2;
      v.project(camera);
      let x = (v.x * 0.5 + 0.5) * width;
      const y = (-v.y * 0.5 + 0.5) * height;
      const behind = v.z > 1;
      let pinned = '';
      if (e.pin) {
        if (x < 24) {
          x = 24;
          pinned = 'pin-l';
        } else if (x > width - 24) {
          x = width - 24;
          pinned = 'pin-r';
        }
      }
      const visible = !behind && (e.pin || (x > -80 && x < width + 80 && y > -40 && y < height + 40));
      const anchor = pinned === 'pin-l' ? '0' : pinned === 'pin-r' ? '-100%' : '-50%';
      e.el.style.transform = `translate(${anchor}, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      e.el.style.opacity = visible ? (e.ttl ? String(Math.max(0, 1 - age / e.ttl)) : '1') : '0';
      e.el.dataset.pin = pinned;
    }
  }
}

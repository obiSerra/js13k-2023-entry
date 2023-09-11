import { PositionComponent } from "./components";
import { IVec } from "./contracts";
import { ComponentBaseEntity } from "./entities";

// Movement dependent on delta-time
export const pXs = (s: number, d: number) => Math.round(s * (d / 1000));
export const multiplyVecScalar = (vec: IVec, scalar: number): IVec => vec.map(v => v * scalar) as IVec;
export const sumVec = (vec1: IVec, vec2: IVec) => vec1.map((v, i) => v + vec2[i]) as IVec;

export const isInView = (e: ComponentBaseEntity, c: IVec, canvas: HTMLCanvasElement) => {
  const [cx, cy] = c;
  const p = e.getComponent<PositionComponent>("pos")?.p;
  if (!p) return true;
  const iP = [p[0] + cx, p[1] + cy];
  const border = 200;
  const { width, height } = canvas;
  if (iP[0] < -border || iP[0] > width + border || iP[1] < -border || iP[1] > height + border) return false;
  return true;
};

export class Throttle {
  private _lastCall: number;
  private _limit: number;

  constructor(limit: number) {
    this._lastCall = limit;
    this._limit = limit;
  }

  call(d: number, fn: () => void) {
    this._lastCall += d;
    if (this._lastCall > this._limit) {
      this._lastCall = 0;
      fn();
    }
  }
  update(d: number) {
    this._lastCall += d;
  }
}

export class Expire {
  private _ttl: number;
  private _lived: number;
  private _onExpire: () => void;

  constructor(ttl: number, onExpire: () => void) {
    this._lived = 0;
    this._ttl = ttl;
    this._onExpire = onExpire;
  }

  update(d: number) {
    this._lived += d;

    if (this._lived > this._ttl) {
      this._onExpire();
    }
  }
}

export const getProgress = x => {
  return Math.floor((x - 400) / 100);
};

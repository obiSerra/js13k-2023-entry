import { PositionComponent } from "./components";
import { IEntity, IVec } from "./contracts";

// Movement dependent on delta-time
export const pXs = (s: number, d: number) => Math.round(s * (d / 1000));
export const multiplyVecScalar = (vec: IVec, scalar: number): IVec => vec.map(v => v * scalar) as IVec;
export const sumVec = (vec1: IVec, vec2: IVec) => vec1.map((v, i) => v + vec2[i]) as IVec;

export const isInView = (e: IEntity, c: IVec, canvas: HTMLCanvasElement) => {
  const [cx, cy] = c;
  const p = e.getComponent<PositionComponent>("position").p;
  const iP = [p[0] + cx, p[1] + cy];
  const border = 200;
  const { width, height } = canvas;
  if (iP[0] < -border || iP[0] > width + border || iP[1] < -border || iP[1] > height + border) return false;
  return true;
};

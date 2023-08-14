import { IVec } from "./contracts";

// Movement dependent on delta-time
export const pXs = (s: number, d: number) => Math.round(s * (d / 1000));
export const multiplyVecScalar = (vec: IVec, scalar: number): IVec => vec.map(v => v * scalar) as IVec;
export const sumVec = (vec1: IVec, vec2: IVec) => vec1.map((v, i) => v + vec2[i]) as IVec;

import { ComponentBaseEntity } from "./entities";
import { GameState } from "./gameState";

export type IVec = [number, number];

export type ComponentType = "pos" | "ctl" | "coll" | "rnd" | "grv" | "snd" | "menu" | "html";

export interface IComponent {
  type: ComponentType;
  onInit?(e: ComponentBaseEntity): void;
  onRender?(e: ComponentBaseEntity, delta: number, c: IVec): void;
  onUpdate?(e: ComponentBaseEntity, delta: number, gs?: GameState): void;
  onTerminate?(e: ComponentBaseEntity): void;
}

export interface IRenderComponent extends IComponent {
  renderPriority: number;
}

export interface IStage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export type RenderFn = (ctx: CanvasRenderingContext2D, pos: IVec) => void;

export type SpriteFrame = {
  frames: HTMLImageElement[];
  changeTime: number;
};

export type Sprite = {
  [key: string]: SpriteFrame;
};

export type ColorMap = { colors: (string | null)[] };
export type ImagePxsRaw = number[][];
export type ImagePxsRawMap = { [key: string]: ImagePxsRaw } | ColorMap;

export type ImagePxs = (string | null)[][];

export type Note = {
  n: string;
  d: number;
  p?: number;
  c?: number;
  s?: number;
};

export type NoteData = {
  n: string;
  d: number;
  p?: number;
  c?: number;
  s?: number;
};

export type NodeDataFixed = {
  n: string;
  d: number;
  p: number;
  c: number;
  s: number;
};

export type MusicSheet = NodeDataFixed[];

export type NoteFrequencies = { [k: string]: number };

export type CollisionSensor = { d: number; t: any };

export type CollisionSensors = [
  CollisionSensor | null,
  CollisionSensor | null,
  CollisionSensor | null,
  CollisionSensor | null
];

export type ImgFnMap = { [key: string]: { d: IVec; f: RenderFn } };
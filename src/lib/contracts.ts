import { GameState } from "./gameState";

export type IVec = [number, number];
export type IVecNullable = [number | null, number | null];

export type ComponentType = "position" | "control" | "collider" | "render" | "gravity" | "sound" | "menu" | "html";

export interface IComponent {
  type: ComponentType;
  onInit?(e: IEntity): void;
  onRender?(e: IEntity, delta: number, c: IVec): void;
  onUpdate?(e: IEntity, delta: number, gs?: GameState): void;
  onTerminate?(e: IEntity): void;
}

export interface IRenderComponent extends IComponent {
  renderPriority: number;
}

export interface RenderComponent extends IComponent {
  type: "render";
}

export interface IEntity {
  ID: string;
  stage: IStage;
  components: { [key: string]: IComponent };
  pos?: IVec;
  v?: IVec;
  box?: IVec;
  lastMv: IVec;
  isColliding: boolean;
  mass?: number;
  init?(): void;
  destroy?(): void;
  render?(t: number, c: IVec): void;
  update?(delta: number, gs?: GameState): void;
  onUpdateStart?(delta: number, gs?: GameState): void;
  onUpdateEnd?(delta: number, gs?: GameState): void;
  onCollide(e: IEntity, c: CollisionSensors): void;
  initComponent?(c: string): void;
  componentList?(): IComponent[];
  addComponent?(c: IComponent): void;
  getComponent<T extends IComponent>(c: string): T;
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

export type SpriteAnimator = {
  charSprite: Sprite;
  spriteTime: number;
  currentFrame: number;
  direction: number;
  currentSprite: string;
};

export type ColorMap = { colors: (string | null)[] };
export type ImagePxsRaw = number[][];
export type ImagePxsRawMap = { [key: string]: ImagePxsRaw } | ColorMap;

export type ImagePxs = (string | null)[][];
export type ImagePxsMap = { [key: string]: ImagePxs };

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

export type CollisionSensors = [CollisionSensor | null, CollisionSensor | null, CollisionSensor | null, CollisionSensor | null];


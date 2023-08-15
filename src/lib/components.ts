import {
  IComponent,
  IVec,
  IEntity,
  ComponentType,
  Sprite,
  IStage,
  Note,
  NodeDataFixed,
  IVecNullable,
  CollisionSensors,
} from "./contracts";
import { GameState } from "./gameState";
import { Sound, noteFrequencies } from "./soundComponent";
import { pXs, sumVec } from "./utils";

export class StaticPositionComponent implements IComponent {
  type: ComponentType;
  p: IVec;
  direction: number;
  constructor(p: IVec, v: IVec = [0, 0]) {
    this.type = "position";
    this.p = p;
    this.direction = 1;
  }
}

export class PositionComponent implements IComponent {
  type: "position";
  p: IVec;
  v: IVec;
  a: IVec = [0, 0];
  maxA = [10, 10];
  lp: IVec;
  maxSpeed: IVec;
  collisionSensors: CollisionSensors = [null, null, null, null];
  direction: number;
  constructor(p: IVec, v: IVec = [0, 0], maxSpeed: IVec = [200, 200], direction = 1) {
    this.type = "position";
    this.p = p;
    this.lp = p;
    this.v = v;
    this.direction = direction;
    this.maxSpeed = maxSpeed;
  }

  accelerate(acc: IVec) {
    this.a = sumVec(this.a, acc);
  }
  stopDir(dir: [boolean, boolean]) {
    this.a[0] = dir[0] ? 0 : this.a[0];
    this.a[1] = dir[1] ? 0 : this.a[1];
  }
  onUpdate(e: IEntity, delta: number, gs?: GameState): void {
    const { solid, onCollide } = e.getComponent<BoxColliderComponent>("collider");

    const maxSpeed = this.maxSpeed;
    let {
      p: [x, y],
      v: [vx, vy],
      a: [ax, ay],
    } = this;
    this.lp[0] = x;
    this.lp[1] = y;

    // Apply movement
    vx += ax;
    vy += ay;

    vx = Math.abs(vx) > maxSpeed[0] ? maxSpeed[0] * Math.sign(vx) : vx;
    vy = Math.abs(vy) > maxSpeed[1] ? maxSpeed[1] * Math.sign(vy) : vy;

    const [a, b, c, d] = this.collisionSensors;
    const def = { d: null };
    const [{ d: mxT }, { d: mxR }, { d: mxB }, { d: mxL }] = [a ?? def, b ?? def, c ?? def, d ?? def];

    let mvY = pXs(vy, delta);
    let mvX = pXs(vx, delta);

    const lT = (n: null | number, b: number) => n !== null && Math.abs(b) > Math.abs(n);

    if (solid) {
      if (mvY > 0 && lT(mxB, mvY)) {
        mvY = mxB * Math.sign(mvY);
        vy = 0;
      } else if (mvY < 0 && lT(mxT, mvY)) {
        mvY = mxT * Math.sign(mvY);
        vy = 0;
      }

      if (mvX > 0 && lT(mxR, mvX)) {
        mvX = mxR * Math.sign(mvX);
        vx = 0;
      } else if (mvX < 0 && lT(mxL, mvX)) {
        mvX = mxL * Math.sign(mvX);
        vx = 0;
      }
    }

    this.a = [0, 0];

    this.v = [vx, vy];
    this.p = [x + mvX, y + mvY];
  }
}

export class BoxColliderComponent implements IComponent {
  type: "collider";
  box: IVec;
  trigger: boolean;
  onCollide?: (e: IEntity, c: any) => void;
  onCollideFn?: (e: IEntity, c: any) => void;
  isColliding: boolean;
  collisions: { e: IEntity; c: CollisionSensors }[] = [];
  solid: boolean = true;

  constructor(box: IVec, onCollide?: (e: IEntity, b: CollisionSensors) => void, solid: boolean = true) {
    this.type = "collider";
    this.box = box;
    this.trigger = true;
    this.onCollideFn = onCollide;
    this.isColliding = false;
    this.solid = solid;
  }
  onInit(e: IEntity): void {
    this.onCollide = this.onCollideFn?.bind(e) || null;
  }

  // TODO Debug code, remove before release
  onRender(e: IEntity, delta: number, c: IVec): void {
    const [w, h] = this.box;
    const pos = (e.components["position"] as PositionComponent).p;
    if (!pos) throw new Error("PositionComponent not found");
    const [x, y] = pos;
    const ctx = e.stage.ctx;
    ctx.beginPath();
    ctx.rect(x + c[0], y + c[1], w, h);
    ctx.strokeStyle = "lime";
    ctx.stroke();
    ctx.closePath();
  }
}

export class SpriteRenderComponent implements IComponent {
  type: ComponentType;
  sprite: Sprite;

  stage: IStage;
  time: number;
  currentFrame: number;
  currentAnimation: string;
  renderPriority: number;

  constructor(sprite: Sprite, defaultAnimation: string, renderPriority: number = 0) {
    this.type = "render";
    this.sprite = sprite;
    this.renderPriority = renderPriority;
    this.setupAnimation(defaultAnimation);
  }
  onInit(e: IEntity): void {
    this.stage = e.stage;
  }
  setupAnimation(animationName: string) {
    this.time = 0;
    this.currentFrame = 0;
    this.currentAnimation = animationName;
  }
  onRender(e: IEntity, t: number, c: IVec): void {
    const pos = (e.components["position"] as PositionComponent).p;
    if (!pos) throw new Error("PositionComponent not found");
    const [x, y] = pos;

    const an = this.sprite[this.currentAnimation];
    this.time += t;
    if (this.time > an.changeTime) {
      this.time = 0;
      this.currentFrame = (this.currentFrame + 1) % an.frames.length;
    }
    const ctx = this.stage.ctx;
    ctx.beginPath();
    ctx.drawImage(
      an.frames[this.currentFrame],
      x + c[0],
      y + c[1],
      an.frames[this.currentFrame].width,
      an.frames[this.currentFrame].height
    );

    ctx.closePath();
  }
}

export class ImgRenderComponent implements IComponent {
  type: ComponentType;
  stage: IStage;
  image: HTMLImageElement;
  renderPriority: number;

  pos: IVec;

  constructor(image: HTMLImageElement, renderPriority: number = 99) {
    this.type = "render";
    this.image = image;
    this.renderPriority = renderPriority;
  }
  onInit(e: IEntity): void {
    this.stage = e.stage;
  }

  onRender(e: IEntity, delta: number, c: IVec): void {
    const pos = (e.components["position"] as PositionComponent).p;
    this.stage.ctx.drawImage(this.image, pos[0] + c[0], pos[1] + c[1]);
  }
}

export class GravityComponent implements IComponent {
  type: ComponentType;
  gravity: number;
  ev: number;
  active: true;
  constructor(gravity: number = 1, ev: number = null) {
    this.type = "gravity";
    this.gravity = gravity * 9.8;
    this.ev = !!ev ? ev : gravity * 100;
  }
  onUpdate(e: IEntity, delta: number): void {
    const box = e.components["collider"] as BoxColliderComponent;
    const pos = e.getComponent<PositionComponent>("position");
    const {
      p: [x, y],
      v,
    } = pos;

    pos.accelerate([0, this.gravity]);
    // const accV = Math.max(v[1] + mXs(this.gravity, delta), th  is.ev);

    // const accV = v[1] + pXs(this.gravity, delta);
    // (e.components["position"] as PositionComponent).v = [v[0], accV];
  }
}

const noteToTone = (note: string) => {
  const freq = noteFrequencies[note];
  if (typeof freq === "undefined") {
    console.error(`Note ${note} not found`);
    return 0;
  }
  return freq;
};

export class SoundComponent implements IComponent {
  type: ComponentType;
  sound: Sound;
  channels: number | (string | null)[];
  volume: number = 0.5;

  constructor(channels: number | (string | null)[] = 3) {
    this.type = "sound";
    this.sound = new Sound(channels);
    this.channels = channels;
  }

  playChannel(channel: string, music: NodeDataFixed[]) {
    music
      .reduce(
        (acc, v: NodeDataFixed) => {
          v.s = v.s || acc.t;
          acc.t += v.d + v.p;
          acc.n.push(v);
          return acc;
        },
        { t: music[0].s, n: [] }
      )
      .n.forEach((n: NodeDataFixed, i) => {
        const f = noteToTone(n.n);

        setTimeout(() => {
          this.sound.playNote(channel, f, n.d, this.volume);
        }, n.s);
      });
  }

  play(music: Note[]) {
    const perChannel = music.reduce((acc, v: Note) => {
      const ch = v.c.toString() || "0";
      acc[ch] = acc[ch] || [];
      acc[ch].push(v);
      return acc;
    }, {});

    for (let k of Object.keys(perChannel)) {
      const channelMusic = perChannel[k];
      this.playChannel(k, channelMusic);
    }
  }
}

export class MenuComponent implements IComponent {
  type: ComponentType;
  selector: string;

  el: HTMLElement;
  behavior: { [key: string]: { cb: (e: Event) => void; t: string } } = {};
  removers: { [key: string]: { cb: (e: Event) => void; t: string } } = {};

  constructor(selector: string) {
    this.type = "menu";
    this.selector = selector;
    this.el = document.querySelector(selector);
  }
  addListener(sel: string, cb: (e: Event) => void, eventType: string = "click") {
    this.behavior[sel] = { cb, t: eventType };
  }
  onInit(e: IEntity): void {
    for (let k of Object.keys(this.behavior)) {
      const el = this.el.querySelector(k);
      const b = this.behavior[k];
      if (!el) continue;
      el.addEventListener(b.t, b.cb);
    }
    this.show();
  }

  show() {
    this.el.classList.remove("h");
  }
  hide() {
    this.el.classList.add("h");
  }
  onTerminate(e: IEntity): void {
    this.hide();
  }
}

export class HTMLComponent implements IComponent {
  type: ComponentType;
  selector: string;
  el: HTMLElement;

  constructor(selector: string) {
    this.type = "html";
    this.selector = selector;
  }
  onInit(e: IEntity): void {
    this.el = document.querySelector(this.selector);
    if (!this.el) throw new Error(`Element ${this.selector} not found`);
  }
  show() {
    this.el.classList.remove("h");
  }
  hide() {
    this.el.classList.add("h");
  }
}

export class KeyboardControlComponent implements IComponent {
  type: ComponentType;
  downButtons: Set<string>;
  clickedDown: Set<string>;
  clickedUp: Set<string>;
  constructor() {
    this.type = "control";

    this.downButtons = new Set();
    this.clickedDown = new Set();
    this.clickedUp = new Set();
  }
  onInit(e: IEntity): void {
    document.addEventListener("keydown", e => {
      this.clickedDown.add(e.key);
    });
    document.addEventListener("keyup", e => {
      this.clickedUp.add(e.key);
      this.downButtons = new Set(Array.from(this.downButtons).filter(k => k !== e.key));
    });
  }
}

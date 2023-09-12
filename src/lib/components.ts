import { IComponent, IVec, ComponentType, Sprite, IStage, CollisionSensors } from "./contracts";
import { ComponentBaseEntity } from "./entities";
import { GameState } from "./gameState";
import { pXs, sumVec } from "./utils";

export class StaticPositionComponent implements IComponent {
    type: ComponentType;
    p: IVec;
    direction: number;
    constructor(p: IVec, v: IVec = [0, 0]) {
        this.type = "pos";
        this.p = p;
        this.direction = 1;
    }
}

export class PositionComponent implements IComponent {
    type: "pos";
    p: IVec;
    v: IVec;
    a: IVec = [0, 0];
    maxA = [10, 10];
    lp: IVec;
    maxSpeed: IVec;
    collisionSensors: CollisionSensors = [null, null, null, null];
    direction: number;
    constructor(p: IVec, v: IVec = [0, 0], maxSpeed: IVec = [200, 200], direction = 1) {
        this.type = "pos";
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
    onUpdate(e: ComponentBaseEntity, delta: number, gs?: GameState): void {
        const { solid } = e.getComponent<BoxColliderComponent>("coll");

        const maxSpeed = this.maxSpeed;
        let {
            p: [x, y],
            v: [vx, vy],
            a: [ax, ay]
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
    type: "coll";
    box: IVec;
    boxPos: IVec;
    posModifiers: IVec = [0, 0];
    trigger: boolean;
    onCollide?: (e: ComponentBaseEntity, c: any) => void;
    onCollideFn?: (e: ComponentBaseEntity, c: any) => void;
    isColliding: boolean;
    collisions: { e: ComponentBaseEntity; c: CollisionSensors }[] = [];
    solid: boolean = true;

    constructor(box: IVec, onCollide?: (e: ComponentBaseEntity, b: CollisionSensors) => void) {
        this.type = "coll";
        this.box = box;
        this.trigger = true;
        this.onCollideFn = onCollide;
        this.isColliding = false;
    }
    onInit(e: ComponentBaseEntity): void {
        this.onCollide = this.onCollideFn?.bind(e) || null;
        this.boxPos = e.getComponent<PositionComponent>("pos").p;
    }

    onUpdate(e: ComponentBaseEntity, delta: number, gs?: GameState): void {
        const [x, y] = e.getComponent<PositionComponent>("pos").p;
        this.boxPos = [x + this.posModifiers[0], y + this.posModifiers[1]];
    }

    // TODO Debug code, remove before release
    // onRender(e: ComponentBaseEntity, delta: number, c: IVec): void {
    //   const [w, h] = this.box;

    //   const [x, y] = this.boxPos;
    //   const ctx = e.stage.ctx;
    //   ctx.beginPath();
    //   ctx.rect(x + c[0], y + c[1], w, h);
    //   ctx.strokeStyle = "lime";
    //   ctx.stroke();
    //   ctx.closePath();
    // }
}

export class SpriteRenderComponent implements IComponent {
    type: ComponentType;
    sprite: Sprite;

    imgPos: IVec = [0, 0];
    stage: IStage;
    time: number;
    currentFrame: number;
    cA: string;
    renderPriority: number;

    constructor(sprite: Sprite, defaultAnimation: string, renderPriority: number = 0) {
        this.type = "rnd";
        this.sprite = sprite;
        this.renderPriority = renderPriority;
        this.sAnim(defaultAnimation);
    }
    onInit(e: ComponentBaseEntity): void {
        this.stage = e.stage;
    }
    sAnim(animationName: string) {
        this.time = 0;
        this.currentFrame = 0;
        this.cA = animationName;
    }
    onRender(e: ComponentBaseEntity, t: number, c: IVec): void {
        const pos = e.getComponent<PositionComponent>("pos").p;
        if (!pos) throw new Error("PositionComponent not found");
        const [x, y] = pos;

        const an = this.sprite[this.cA];
        this.time += t;

        // if (!an) console.error(`Animation ${this.cA} not found`);

        if (this.time > an.changeTime) {
            this.time = 0;
            this.currentFrame = (this.currentFrame + 1) % an.frames.length;
        }
        const ctx = this.stage.ctx;
        ctx.beginPath();
        ctx.drawImage(
            an.frames[this.currentFrame],
            x + c[0] + this.imgPos[0],
            y + c[1] + this.imgPos[1],
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
        this.type = "rnd";
        this.image = image;
        this.renderPriority = renderPriority;
    }
    onInit(e: ComponentBaseEntity): void {
        this.stage = e.stage;
    }

    onRender(e: ComponentBaseEntity, delta: number, c: IVec): void {
        const pos = e.getComponent<PositionComponent>("pos").p;
        this.stage.ctx.drawImage(this.image, pos[0] + c[0], pos[1] + c[1]);
    }
}

export class GravityComponent implements IComponent {
    type: ComponentType;
    gravity: number;
    ev: number;
    active: true;
    constructor(gravity: number = 1, ev: number = null) {
        this.type = "grv";
        this.gravity = gravity * 9.8;
        this.ev = !!ev ? ev : gravity * 100;
    }
    onUpdate(e: ComponentBaseEntity, delta: number): void {
        const pos = e.getComponent<PositionComponent>("pos");

        pos.accelerate([0, this.gravity]);
        // const accV = Math.max(v[1] + mXs(this.gravity, delta), th  is.ev);

        // const accV = v[1] + pXs(this.gravity, delta);
        // (e.getComponent<PositionComponent).v = [v[0], accV]>("pos")
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
    onInit(e: ComponentBaseEntity): void {
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
    onTerminate(): void {
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
    onInit(e: ComponentBaseEntity): void {
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

type EvtListeners = { [k: string]: (e: KeyboardEvent) => void };

export class KeyboardControlComponent implements IComponent {
    type: ComponentType;
    downListener: EvtListeners;
    upListener: EvtListeners;
    constructor(downEvtLst: EvtListeners = {}, upEvtLst: EvtListeners = {}) {
        this.type = "ctl";
        this.downListener = downEvtLst;
        this.upListener = upEvtLst;
    }
    onInit(e: ComponentBaseEntity): void {
        document.addEventListener("keydown", e => {
            for (let k of Object.keys(this.downListener)) {
                if (k === e.key) this.downListener[k](e);
            }
        });
        document.addEventListener("keyup", e => {
            for (let k of Object.keys(this.upListener)) {
                if (k === e.key) this.upListener[k](e);
            }
        });
    }
}

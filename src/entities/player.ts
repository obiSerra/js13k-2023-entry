import {
  BoxColliderComponent,
  GravityComponent,
  HTMLComponent,
  KeyboardControlComponent,
  PositionComponent,
  SpriteRenderComponent,
} from "../lib/components";
import { ComponentType, IComponent, IEntity, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Stage } from "../lib/stage";
import { Throttle, getProgress } from "../lib/utils";
import { Rechargeable } from "../services/rechargeable";
import { MagicBolt } from "./bolt";

export const playerSprite: (images: any) => Sprite = images => {
  const s = images["shaman"];
  return {
    idle: { frames: [s.idle_1, s.idle_1, s.idle_2, s.idle_2, s.idle_1], changeTime: 250 },
    idleLeft: { frames: [s.idle_1_left, s.idle_2_left], changeTime: 500 },
    run: { frames: [s.run_1, s.idle_1], changeTime: 150 },
    runLeft: { frames: [s.run_1_left, s.idle_1_left], changeTime: 150 },
    duck: { frames: [s.roll_1, s.roll_2, s.roll_3, s.roll_4], changeTime: 50 },
    duckLeft: { frames: [s.roll_1_left, s.roll_2_left, s.roll_3_left, s.roll_4_left], changeTime: 50 },
    dmg: { frames: [s.dmg_1, s.idle_1], changeTime: 50 },
    dmgLeft: { frames: [s.dmg_1_left, s.idle_1], changeTime: 50 },
    fire: { frames: [s.fire], changeTime: 200 },
    fireLeft: { frames: [s.fire_left], changeTime: 200 },
  };
};

export const enemySprite: (images: any) => Sprite = images => {
  const s = images["shaman"];
  return {
    idle: { frames: [s.enemy_idle_1, s.enemy_idle_2], changeTime: 500 },
    idleLeft: { frames: [s.enemy_idle_1_left, s.enemy_idle_2_left], changeTime: 500 },
    dmg: { frames: [s.dmg_1, s.enemy_idle_1], changeTime: 50 },
    dmgLeft: { frames: [s.dmg_1_left, s.enemy_idle_1_left], changeTime: 50 },
  };
};

export const demonSprite: (images: any) => Sprite = images => {
  const d = images["demon"];
  return {
    idle: { frames: [d.dem_1, d.dem_2, d.dem_3], changeTime: 300 },
    dmg: { frames: [d.dmg_1, d.dem_1], changeTime: 50 },
    dmgLeft: { frames: [d.dmg_1_left, d.dem_1], changeTime: 50 },
  };
};

class LifeBarComponent extends HTMLComponent {
  onInit(e: ComponentBaseEntity): void {
    super.onInit(e);
    this.show();
  }
  onUpdate(e: ComponentBaseEntity, delta: number, gameState?: GameState): void {
    const life = (e as Player).life;
    const bars = Math.floor(life / 10);
    this.el.innerHTML = "";

    for (let i = 0; i < bars; i++) {
      this.el.innerHTML += `<div class="bar"></div>`;
    }
  }
}

class Progression extends HTMLComponent {
  onInit(e: ComponentBaseEntity): void {
    super.onInit(e);
    this.show();
  }
  onUpdate(e: ComponentBaseEntity, delta: number, gs?: GameState): void {
    const [x, y] = gs.session.pos;
    const progress = getProgress(x);
    this.el.innerHTML = `${progress}`;
    // console.log(gs.session);
  }
}

class ChargeRender implements IComponent {
  type: ComponentType = "render";
  stage: Stage;

  constructor(stage: Stage) {
    this.stage = stage;
  }

  onRender(e: ComponentBaseEntity, t: number, c: IVec): void {
    const { p, direction } = e.getComponent<PositionComponent>("position");
    const charge = (e as Player).fireCharge;

    if (!p) throw new Error("PositionComponent not found");
    const [x, y] = p;

    const ratio = charge.current / charge.max;
    const ctx = this.stage.ctx;
    ctx.beginPath();
    // ctx.rect(x + c[0] + 4, y + c[1] + 50, 40 * ratio, 2);
    if (direction === -1) ctx.rect(x + c[0] - 3, y + c[1] + 40, 3, -30 * ratio);
    else ctx.rect(x + c[0] + 48, y + c[1] + 40, 3, -30 * ratio);
    ctx.fillStyle = "#187194";
    ctx.fill();
    ctx.closePath();
  }
}

const fireThrottle = new Throttle(150);
export class Player extends ComponentBaseEntity {
  gs: GameState;
  status: string = "idle";
  speed: number = 200;
  maxRun: number = 300;
  jumpSpeed: number = -300;
  onTheGround: boolean = false;
  fireCharge: Rechargeable = new Rechargeable(1000, 500);
  jumpCharge: Rechargeable = new Rechargeable(200, 200);
  rollCharge: Rechargeable = new Rechargeable(150, 150);
  rolling: number = 0;
  firing: boolean = false;
  life: number = 100;
  chargeUsage: number = 200;
  eType: string = "Player";
  onEnd: () => void;
  constructor(gs: GameState, sprite: Sprite, pos: IVec, lives: number, onEnd: () => void, zoom: number = 1) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos, [0, 0], [400, 400], -1);
    const renderer = new SpriteRenderComponent(sprite, "idle");

    const downListeners = {
      ArrowLeft: () => {
        this.status = "walk-left";
      },
      ArrowRight: () => {
        this.status = "walk-right";
      },
      ArrowUp: () => {
        this.jump();
      },
      ArrowDown: () => {
        if (this.rollCharge.isFull) {
          this.rolling = 300;
          this.duck();
          this.rollCharge.useAll();
        }
      },
      " ": () => {
        this.firing = true;
      },
    };
    const upListeners = {
      ArrowLeft: () => {
        this.status = "idle";
      },
      ArrowRight: () => {
        this.status = "idle";
      },
      ArrowDown: () => {
        // this._resetBox();
        // this.status = "idle";
      },
      ArrowUp: () => {
        // this.status = "idle";
      },
      " ": () => {
        this.firing = false;
      },
    };

    if (lives === 2) {
      this.chargeUsage = 75;
    }

    const control = new KeyboardControlComponent(downListeners, upListeners);
    const lifeBar = new LifeBarComponent("#life");
    const progression = new Progression("#progression");

    const box = new BoxColliderComponent([36, 48], (b: ComponentBaseEntity, c: any) => {});
    box.posModifiers = [8, 0];
    const gravity = new GravityComponent();
    this.gs = gs;
    this.onEnd = onEnd;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(control);
    this.addComponent(box);
    this.addComponent(gravity);
    this.addComponent(lifeBar);
    this.addComponent(progression);
    this.addComponent(new ChargeRender(stage));
  }

  get invulnerable() {
    return this.rolling > 0;
  }
  update(delta: number, gameState?: GameState): void {
    const pos = this.getComponent<PositionComponent>("position");

    if (pos.p[1] > 800) this.destroy();

    gameState.session.pos = pos.p;

    if (pos.collisionSensors[2]?.d === 0) {
      this.onTheGround = true;
      this.jumpCharge.recharge(delta);
    } else {
      this.onTheGround = false;
    }

    if (this.rolling > 0) {
      this.rolling -= delta;
    } else {
      this.rollCharge.recharge(delta);
      this._resetBox();
      if (this.status === "walk-left") {
        this.walkLeft();
      } else if (this.status === "walk-right") {
        this.walkRight();
      } else if (this.status === "duck") {
        this.duck();
      } else if (this.status === "idle") {
        this.stand();
      }
    }

    if (this.firing) {
      fireThrottle.call(delta, () => this.magicBolt());
    } else {
      fireThrottle.update(delta);
      this.fireCharge.recharge(delta);
    }

    super.update(delta, gameState);
  }
  _resetBox() {
    this.rolling = 0;
    this.getComponent<BoxColliderComponent>("collider").posModifiers = [8, 0];
    this.getComponent<SpriteRenderComponent>("render").imgPos = [0, 0];
    this.getComponent<BoxColliderComponent>("collider").box = [36, 48];
  }
  walkLeft() {
    // this.status = "walk-left";
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.currentAnimation !== "runLeft") rend.setupAnimation("runLeft");
    let accSpeed = -this.speed;

    const exceeding = Math.abs(pos.v[0] - this.speed) - this.maxRun;
    if (exceeding >= 0) accSpeed = -this.speed + exceeding;

    if (this.onTheGround) pos.accelerate([accSpeed, 0]);
    else {
      pos.accelerate([accSpeed, 0]);
    }
    pos.direction = 1;
  }
  walkRight() {
    // this.status = "walk-right";
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.currentAnimation !== "run") rend.setupAnimation("run");
    let accSpeed = this.speed;

    const exceeding = Math.abs(pos.v[0] + this.speed) - this.maxRun;
    if (exceeding >= 0) accSpeed = this.speed - exceeding;

    if (this.onTheGround) pos.accelerate([accSpeed, 0]);
    else {
      pos.accelerate([accSpeed, 0]);
    }
    pos.direction = -1;
  }

  jump() {
    // this.status = "jump";
    const pos = this.getComponent<PositionComponent>("position");
    if (this.jumpCharge.isFull && this.onTheGround) {
      pos.accelerate([0, this.jumpSpeed]);
      this.jumpCharge.useAll();
    }
  }
  stand() {
    // this.status = "idle";
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");

    if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");

    if (this.onTheGround) {
      pos.v = [0, pos.v[1]];
      pos.a = [0, pos.a[1]];
    } else {
      const a = -pos.v[0] * 0.03;
      pos.a = [a, pos.a[1]];
    }
  }
  duck() {
    // this.status = "crouch";
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");
    const d = pos.direction;

    if (d === -1 && rend.currentAnimation !== "duck") rend.setupAnimation("duck");
    else if (d === 1 && rend.currentAnimation !== "duckLeft") rend.setupAnimation("duckLeft");
    pos.v = [0, pos.v[1]];
    pos.a = [300 * -pos.direction, pos.a[1]];

    // this.getComponent<PositionComponent>("position").p = [pos.p[0], pos.p[1] + 4];
    this.getComponent<BoxColliderComponent>("collider").box = [36, 20];
    this.getComponent<BoxColliderComponent>("collider").posModifiers = [0, 28];
    this.getComponent<SpriteRenderComponent>("render").imgPos = [0, 8];
  }

  magicBolt() {
    if (this.fireCharge.current < 75 || this.rolling) return;
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");
    const d = pos.direction * -400;
    const dd = pos.direction;

    if (dd === -1 && rend.currentAnimation !== "fire") rend.setupAnimation("fire");
    else if (dd === 1 && rend.currentAnimation !== "fireLeft") rend.setupAnimation("fireLeft");

    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 25], [d, 0], this.ID);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.use(this.chargeUsage);
  }

  destroy(): void {
    super.destroy();
    this.onEnd();
  }

  takeDamage(damage: number) {
    if (this.invulnerable) return;

    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.currentAnimation !== "dmg") rend.setupAnimation("dmg");
    this.life -= damage;
    if (this.life <= 0) this.destroy();
  }

  render(t: number, ca?: IVec): void {
    super.render(t, ca);
  }
}
const enemyFireThrottle = new Throttle(100);
export type EnemyData = {
  boltCost?: number;
};
export class Enemy extends ComponentBaseEntity {
  gs: GameState;
  fireCharge: Rechargeable = new Rechargeable(1000, 1000);
  firing: boolean = false;
  data: EnemyData = {};
  eType: string = "Enemy";
  energy: number = 50;
  constructor(gs: GameState, sprite: Sprite, pos: IVec, data: EnemyData = {}) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos);
    const renderer = new SpriteRenderComponent(sprite, "idle");
    const box = new BoxColliderComponent([48, 48], (b: ComponentBaseEntity, c: any) => {});
    const gravity = new GravityComponent();
    this.gs = gs;
    this.data = data;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gs: GameState): void {
    this.action(delta, gs);
    this.fireCharge.recharge(delta);
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");

    if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");

    super.update(delta, gs);
  }

  action(delta: number, gs: GameState) {
    const player = gs.scene.getEntities().find(e => e.eType === "Player") as Player;
    if (!player) return;
    const [px, py] = player.getComponent<PositionComponent>("position").p;
    const [pw, ph] = player.getComponent<BoxColliderComponent>("collider").box;
    const pos = this.getComponent<PositionComponent>("position");
    const {
      p: [x, y],
      direction: d,
    } = pos;
    const [w, h] = this.getComponent<BoxColliderComponent>("collider").box;

    const [[cpx, cpy], [cx, cy]] = [
      [px + pw / 2, py + ph / 2],
      [x + w / 2, y + h / 2],
    ];

    const dist = Math.sqrt(Math.pow(cpx - cx, 2) + Math.pow(cpy - cy, 2));
    const vDist = Math.sqrt(Math.pow(cpy - cy, 2));

    // Turn
    if (px < x && d !== 1) pos.direction = 1;
    else if (px > x && d !== -1) pos.direction = -1;

    // Attack - to move

    if (this.fireCharge.current < 350) this.firing = false;
    const startBurst = this.firing || this.fireCharge.isFull;
    // const startBurst = true;

    if (dist < 600 && vDist < 100 && startBurst) {
      this.firing = true;
      enemyFireThrottle.call(delta, () => {
        this.magicBolt();
      });
    } else {
    }
  }

  magicBolt() {
    const boltCost = this?.data?.boltCost || 550;
    if (this.fireCharge.current < boltCost) return;
    const pos = this.getComponent<PositionComponent>("position");
    const d = pos.direction * -400;
    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 25], [d, 0], this.ID);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.use(boltCost);
  }
  takeDamage(dmg: number) {
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.currentAnimation !== "dmg") {
      rend.setupAnimation("dmg");
      setTimeout(() => rend.setupAnimation("idle"), 100);
    }
    this.energy -= dmg;
    if (this.energy <= 0) this.gs.scene.removeEntity(this);
  }
}

export class LittleDemon extends ComponentBaseEntity {
  gs: GameState;
  triggered: boolean = false;
  data: EnemyData = {};
  energy: number = 50;
  speed: number = 100;
  maxDist: number = 500;
  eType: string = "LittleDemon";
  constructor(gs: GameState, sprite: Sprite, pos: IVec, data: any = {}) {
    const { stage } = gs;
    super(stage, []);

    const position = new PositionComponent(pos, [0, 0], [400, 400]);
    // const renderer = new ImgRenderComponent(gs.images["static"].demonRender);

    const renderer = new SpriteRenderComponent(sprite, "idle");
    const box = new BoxColliderComponent([30, 30], (b: ComponentBaseEntity, d: any) => {
      if (b.eType === "Player" && !this.triggered) {
        this.triggered = true;
        gs.scene.removeEntity(this);

        (b as Player)?.takeDamage(50);
      }
    });
    box.posModifiers = [5, 5];
    // box.solid = false;
    const gravity = new GravityComponent();
    this.gs = gs;
    this.speed = data?.speed || this.speed;
    this.maxDist = data?.maxDist || this.maxDist;
    this.data = data;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gs?: GameState): void {
    this.action(delta, gs);

    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");

    // if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    // if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");

    super.update(delta, gs);
  }

  action(delta: number, gs: GameState) {
    const player = gs.scene.getEntities().find(e => e.eType === "Player") as Player;
    if (!player) return;
    const [px, py] = player.getComponent<PositionComponent>("position").p;
    const [pw, ph] = player.getComponent<BoxColliderComponent>("collider").box;
    const pos = this.getComponent<PositionComponent>("position");
    const {
      p: [x, y],
      direction: d,
    } = pos;
    const [w, h] = this.getComponent<BoxColliderComponent>("collider").box;

    const [[cpx, cpy], [cx, cy]] = [
      [px + pw / 2, py + ph / 2],
      [x + w / 2, y + h / 2],
    ];

    const dist = Math.sqrt(Math.pow(cpx - cx, 2) + Math.pow(cpy - cy, 2));
    const vDist = Math.sqrt(Math.pow(cpy - cy, 2));

    if (vDist > 20) return;

    if (px < x && d !== 1) pos.direction = 1;
    else if (px > x && d !== -1) pos.direction = -1;

    if (dist < this.maxDist) {
      pos.accelerate([this.speed * -pos.direction, 0]);
    }
    // console.log(dist, vDist);

    // Turn

    // // Attack - to move

    // if (this.fireCharge.current < 350) this.firing = false;
    // const startBurst = this.firing || this.fireCharge.isFull;
    // // const startBurst = true;

    // if (dist < 600 && vDist < 100 && startBurst) {
    //   this.firing = true;
    //   enemyFireThrottle.call(delta, () => {
    //     this.magicBolt();
    //   });
    // } else {
    // }
  }
  takeDamage(dmg: number) {
    const v = this.getComponent<PositionComponent>("position").v;
    this.getComponent<PositionComponent>("position").accelerate([v[0] * -10, -50]);
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.currentAnimation !== "dmg") {
      rend.setupAnimation("dmg");
      setTimeout(() => rend.setupAnimation("idle"), 100);
    }
    this.energy -= dmg;
    if (this.energy <= 0) this.gs.scene.removeEntity(this);
  }
}

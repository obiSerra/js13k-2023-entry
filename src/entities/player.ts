import { MagicBolt } from "./bolt";
import {
  BoxColliderComponent,
  GravityComponent,
  HTMLComponent,
  KeyboardControlComponent,
  PositionComponent,
  SpriteRenderComponent,
} from "../lib/components";
import { IEntity, IStage, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { Throttle, pXs } from "../lib/utils";
import { Rechargeable } from "../services/rechargeable";

export const playerSprite: (images: any) => Sprite = images => {
  const p = images["player"];
  return {
    idle: { frames: [p.stand_1, p.stand_2], changeTime: 500 },
    idleLeft: { frames: [p.stand_1_left, p.stand_2_left], changeTime: 500 },
    run: { frames: [p.run_1, p.stand_1], changeTime: 150 },
    runLeft: { frames: [p.run_1_left, p.stand_1_left], changeTime: 150 },
    duck: { frames: [p.duck, p.roll_1, p.roll_2, p.roll_3], changeTime: 50 },
    duckLeft: { frames: [p.duck_left, p.roll_1_left, p.roll_2_left, p.roll_3_left], changeTime: 50 },
    dmg: { frames: [p.dmg_1, p.stand_1], changeTime: 50 },
    dmgLeft: { frames: [p.dmg_1_left, p.stand_1_left], changeTime: 50 },
  };
};

export const enemySprite: (images: any) => Sprite = images => {
  const { stand_1, stand_2, stand_1_left, stand_2_left, run_1, run_1_left, duck } = images["enemy"];
  return {
    idle: { frames: [stand_1, stand_2], changeTime: 500 },
    idleLeft: { frames: [stand_1_left, stand_2_left], changeTime: 500 },
    run: { frames: [run_1, stand_1], changeTime: 150 },
    runLeft: { frames: [run_1_left, stand_1_left], changeTime: 150 },
  };
};

class LifeBarComponent extends HTMLComponent {
  onInit(e: IEntity): void {
    super.onInit(e);
    this.show();
  }
  onUpdate(e: IEntity, delta: number, gameState?: GameState): void {
    const life = (e as Player).life;
    const bars = Math.floor(life / 10);
    this.el.innerHTML = "";

    for (let i = 0; i < bars; i++) {
      this.el.innerHTML += `<div class="bar"></div>`;
    }
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
  onEnd: () => void;
  constructor(gs: GameState, sprite: Sprite, lives: number, onEnd: () => void) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent([stage.canvas.width / 2, stage.canvas.height / 2], [0, 0], [400, 400]);
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
        if (this.onTheGround && this.rollCharge.isFull) {
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

    const control = new KeyboardControlComponent(downListeners, upListeners);
    const lifeBar = new LifeBarComponent("#life");
    const box = new BoxColliderComponent([36, 48], (b: IEntity, c: any) => {});
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
  }

  get invulnerable() {
    return this.rolling > 0;
  }
  update(delta: number, gameState?: GameState): void {
    const pos = this.getComponent<PositionComponent>("position");

    if (pos.p[1] > 800) this.destroy();

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
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
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
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
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
    const pos = this.components["position"] as PositionComponent;
    if (this.jumpCharge.isFull && this.onTheGround) {
      pos.accelerate([0, this.jumpSpeed]);
      this.jumpCharge.useAll();
    }
  }
  stand() {
    // this.status = "idle";
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;

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
    const rend = this.components["render"] as SpriteRenderComponent;
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
    const pos = this.components["position"] as PositionComponent;
    const d = pos.direction * -400;
    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 12], [d, 0], this.ID);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.use(75);
  }

  destroy(): void {
    super.destroy();
    this.onEnd();
  }

  takeDamage(damage: number) {
    if (this.invulnerable) return;

    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "dmg") rend.setupAnimation("dmg");
    this.life -= damage;
    if (this.life <= 0) this.destroy();
  }
}
const enemyFireThrottle = new Throttle(100);
export class Enemy extends ComponentBaseEntity {
  gs: GameState;
  fireCharge: Rechargeable = new Rechargeable(1000, 1000);
  firing: boolean = false;
  constructor(gs: GameState, sprite: Sprite, pos: IVec) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos);
    const renderer = new SpriteRenderComponent(sprite, "idle");
    const box = new BoxColliderComponent([48, 48], (b: IEntity, c: any) => {});
    const gravity = new GravityComponent();
    this.gs = gs;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gs: GameState): void {
    this.action(delta, gs);
    this.fireCharge.recharge(delta);
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;

    if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");

    super.update(delta, gs);
  }

  action(delta: number, gs: GameState) {
    const player = gs.scene.getEntities().find(e => e.constructor.name === "Player") as Player;
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
    const boltCost = 550;
    if (this.fireCharge.current < boltCost) return;
    const pos = this.components["position"] as PositionComponent;
    const d = pos.direction * -400;
    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 12], [d, 0], this.ID);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.use(boltCost);
  }
}

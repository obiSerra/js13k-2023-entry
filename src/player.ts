import {
  BoxColliderComponent,
  GravityComponent,
  KeyboardControlComponent,
  PositionComponent,
  SpriteRenderComponent,
} from "./lib/components";
import { IEntity, IStage, IVec, Sprite } from "./lib/contracts";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState, Scene } from "./lib/gameState";
import { pXs } from "./lib/utils";
import { MagicBolt } from "./scenes/testScene";

export const playerSprite: (images: any) => Sprite = images => {
  const { player_stand_1, player_stand_2, player_stand_1_left, player_stand_2_left, player_run_1, player_run_1_left } =
    images;
  return {
    idle: { frames: [player_stand_1, player_stand_2], changeTime: 500 },
    idleLeft: { frames: [player_stand_1_left, player_stand_2_left], changeTime: 500 },
    run: { frames: [player_run_1, player_stand_1], changeTime: 150 },
    runLeft: { frames: [player_run_1_left, player_stand_1_left], changeTime: 150 },
  };
};

export class PlayerControlComponent extends KeyboardControlComponent {
  onUpdate(e: IEntity, delta: number, gameState?: GameState): void {
    const player = e as Player;

    this.downButtons = new Set([...this.downButtons, ...this.clickedDown].filter(x => !this.clickedUp.has(x)));
    let none = true;
    if (this.downButtons.has("ArrowLeft")) {
      none = false;
      player.walkLeft(delta);
    } else if (this.downButtons.has("ArrowRight")) {
      none = false;
      player.walkRight(delta);
    }

    if (this.downButtons.has("ArrowUp")) {
      player.jump();
    }

    if (this.downButtons.has(" ")) {
      player.magicBolt();
    }
    if (none) player.stand();

    this.clickedDown.clear();
    this.clickedUp.clear();
  }
}

class Rechargeable {
  max: number;
  current: number;
  constructor(max: number, current: number) {
    this.max = max;
    this.current = current;
  }
  recharge(delta: number) {
    this.current = Math.min(this.current + delta, this.max);
  }
  use(delta: number) {
    this.current = Math.max(this.current - delta, 0);
  }
  useAll() {
    this.current = 0;
  }
  get isFull() {
    return this.current >= this.max;
  }
  get isEmpty() {
    return this.current < this.max;
  }
}

export class Player extends ComponentBaseEntity {
  gs: GameState;
  speed: number = 100;
  jumpSpeed: number = -300;
  jumpTicks: number = 0;
  jumpMaxTicks: number = 10;
  jumpCharge: number = 200;
  onTheGround: number = 0;
  jumpCharged: boolean = false;
  fireCharge: Rechargeable = new Rechargeable(500, 500);
  constructor(gs: GameState, sprite: Sprite) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent([stage.canvas.width / 2, stage.canvas.height / 2]);
    const renderer = new SpriteRenderComponent(sprite, "idle");
    const control = new PlayerControlComponent();
    const box = new BoxColliderComponent([48, 48], (b: IEntity, c: any) => {
      // console.log(b, c);
    });
    const gravity = new GravityComponent();
    this.gs = gs;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(control);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gameState?: GameState): void {
    this.fireCharge.recharge(delta);
    const pos = this.getComponent<PositionComponent>("position");
    if (pos.collisionSensors[2]?.d === 0) {
      this.onTheGround += delta;
    } else {
      this.onTheGround = 0;
    }

    if (this.jumpTicks > this.jumpMaxTicks) {
      this.jumpCharged = false;
    }
    if (this.onTheGround > this.jumpCharge) {
      this.jumpCharged = true;
      this.jumpTicks = 0;
    }

    super.update(delta, gameState);
  }
  walkLeft(d: number) {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "runLeft") rend.setupAnimation("runLeft");

    if (this.onTheGround > 0) pos.accelerate([-this.speed, 0]);
    else pos.accelerate([-this.speed / 10, 0]);
    pos.direction = 1;
  }
  walkRight(d: number) {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "run") rend.setupAnimation("run");
    if (this.onTheGround > 0) pos.accelerate([this.speed, 0]);
    else pos.accelerate([this.speed / 10, 0]);
    pos.direction = -1;
  }

  jump() {
    const pos = this.components["position"] as PositionComponent;
    if (this.jumpCharged) {
      pos.accelerate([0, this.jumpSpeed]);
      this.jumpTicks++;
    }
  }
  stand() {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;

    if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");
    if (this.onTheGround > 0) {
      pos.v = [0, pos.v[1]];
      pos.a = [0, pos.a[1]];
    }
  }

  magicBolt() {
    if (!this.fireCharge.isFull) return;
    const pos = this.components["position"] as PositionComponent;
    const d = pos.direction * -400;
    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 12], [d, 0]);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.useAll();
  }
}

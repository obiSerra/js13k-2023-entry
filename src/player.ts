import {
  KeyboardControlComponent,
  PositionComponent,
  SpriteRenderComponent,
  BoxColliderComponent,
  GravityComponent,
} from "./lib/components";
import { IEntity, GameStateAPI, IStage, Sprite } from "./lib/contracts";
import { ComponentBaseEntity } from "./lib/entities";

export class PlayerControlComponent extends KeyboardControlComponent {
  onUpdate(e: IEntity, delta: number, gameState?: GameStateAPI): void {
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

    if (none) player.stand();

    this.clickedDown.clear();
    this.clickedUp.clear();
  }
}

export class Player extends ComponentBaseEntity {
  speed: number = 100;
  jumpSpeed: number = -300;
  jumpTicks: number = 0;
  jumpMaxTicks: number = 10;
  jumpCharge: number = 200;
  onTheGround: number = 0;
  jumpCharged: boolean = false;
  constructor(stage: IStage, sprite: Sprite) {
    super(stage, []);
    const position = new PositionComponent([stage.canvas.width / 2, stage.canvas.height / 2]);
    const renderer = new SpriteRenderComponent(sprite, "idle");
    const control = new PlayerControlComponent();
    const box = new BoxColliderComponent([48, 48], (b: IEntity, c: any) => {});
    const gravity = new GravityComponent();

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(control);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gameState?: GameStateAPI): void {
    const pos = this.getComponent<PositionComponent>("position");
    if (pos.maxMove[2] === 0) {
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
}

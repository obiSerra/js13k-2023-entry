import { resolveCollisions } from "../lib/collisions";
import {
  PositionComponent,
  SpriteRenderComponent,
  BoxColliderComponent,
  KeyboardControlComponent,
  ImgRenderComponent,
  GravityComponent,
  StaticPositionComponent,
} from "../lib/components";
import {
  ComponentType,
  GameStateAPI,
  IComponent,
  IEntity,
  IRenderComponent,
  IStage,
  IVec,
  RenderFn,
  Sprite,
} from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { Stage } from "../lib/stage";
import { pXs } from "../lib/utils";

class PlayerControlComponent extends KeyboardControlComponent {
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

class Player extends ComponentBaseEntity {
  speed: number = 100;
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

  render(t: number): void {
    super.render(t);
  }

  update(delta: number, gameState?: GameStateAPI): void {
    const pos = this.getComponent<PositionComponent>("position");
    if (pos.maxMove[2] === 0) {
      this.onTheGround += delta;
    } else {
      this.onTheGround = 0;
    }

    this.jumpCharged = this.onTheGround > 200;
    super.update(delta, gameState);
  }
  walkLeft(d: number) {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");

    if (this.onTheGround > 0) pos.accelerate([-this.speed, 0]);
    else pos.accelerate([-this.speed / 100, 0]);
    pos.direction = 1;
  }
  walkRight(d: number) {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "idle") rend.setupAnimation("idle");
    if (this.onTheGround > 0) pos.accelerate([this.speed, 0]);
    else pos.accelerate([this.speed / 100, 0]);
    pos.direction = -1;
  }

  jump() {
    const pos = this.components["position"] as PositionComponent;
    if (this.jumpCharged) {
      pos.accelerate([0, -300]);
      this.onTheGround = 0;
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

class Ground extends ComponentBaseEntity {
  constructor(gs: GameState, pos: IVec) {
    const { stage } = gs;
    super(stage, []);
    const position = new StaticPositionComponent(pos);

    const renderer = new ImgRenderComponent(gs.images.groundBlock);
    const box = new BoxColliderComponent([32, 32]);

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
  }
}

export const testScene = onEnd => {
  return new Scene((gs: GameState, scene: Scene) => {
    const { gl } = gs;
    const { player_stand_1, player_stand_2, player_stand_1_left, player_stand_2_left } = gs.images;
    const playerSprite: Sprite = {
      idle: { frames: [player_stand_1, player_stand_2], changeTime: 500 },
      idleLeft: { frames: [player_stand_1_left, player_stand_2_left], changeTime: 500 },
    };

    const player = new Player(gs.stage, playerSprite);

    scene.addEntity(player);

    for (let i = 4; i < 20; i++) {
      const ground = new Ground(gs, [i * 32, 400]);
      scene.addEntity(ground);
    }

    scene.addEntity(new Ground(gs, [500, 368]));
    scene.addEntity(new Ground(gs, [500, 336]));

    gl.onUpdate(delta => {
      scene
        .getEntities()
        .filter(e => typeof e.update === "function")
        .forEach(e => e.update(delta));

      const canCollide = scene.getEntities().filter(e => !!e.components["collider"]);
      resolveCollisions(canCollide);
    });

    gl.onRender(t => {
      const toRender = scene.getEntities().filter(e => !!e.components["render"]);
      toRender.sort(
        (a, b) =>
          (b.components["render"] as IRenderComponent).renderPriority -
          (a.components["render"] as IRenderComponent).renderPriority
      );

      toRender.forEach(e => e.render(t));
    });
  }, onEnd);
};

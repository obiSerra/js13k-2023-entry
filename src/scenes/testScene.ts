import { resolveCollisions } from "../lib/collisions";
import {
  PositionComponent,
  SpriteRenderComponent,
  BoxColliderComponent,
  KeyboardControlComponent,
} from "../lib/components";
import { ComponentType, GameStateAPI, IComponent, IEntity, IStage, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { Stage } from "../lib/stage";

class PlayerControlComponent extends KeyboardControlComponent {
  onUpdate(e: IEntity, delta: number, gameState?: GameStateAPI): void {
    const pos = e.components["position"] as PositionComponent;
    const sprite = e.components["render"] as SpriteRenderComponent;
    const player = e as Player;

    this.downButtons = new Set([...this.downButtons, ...this.clickedDown].filter(x => !this.clickedUp.has(x)));
    if (this.downButtons.has("ArrowLeft")) {
      player.walkLeft();
    } else if (this.downButtons.has("ArrowRight")) {
      player.walkRight();
    } else {
      player.stand();
    }

    this.clickedDown.clear();
    this.clickedUp.clear();
  }
}

class Player extends ComponentBaseEntity {
  constructor(stage: IStage, sprite: Sprite) {
    super(stage, []);
    const position = new PositionComponent([stage.canvas.width / 2, stage.canvas.height / 2]);

    const renderer = new SpriteRenderComponent(sprite, "idle");
    const control = new PlayerControlComponent();
    const box = new BoxColliderComponent([48, 48], () => {
      const pos = this.components["position"] as PositionComponent;
      pos.p = [...pos.lp];
    });

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(control);
    this.addComponent(box);
  }
  walkLeft() {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    pos.p[0] -= 10;
    pos.direction = 1;
  }
  walkRight() {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (rend.currentAnimation !== "idle") rend.setupAnimation("idle");
    pos.p[0] += 10;
    pos.direction = -1;
  }
  stand() {
    const pos = this.components["position"] as PositionComponent;
    const rend = this.components["render"] as SpriteRenderComponent;
    if (pos.direction === 1 && rend.currentAnimation !== "idleLeft") rend.setupAnimation("idleLeft");
    if (pos.direction === -1 && rend.currentAnimation !== "idle") rend.setupAnimation("idle");
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

    gl.onUpdate(delta => {
      const canCollide = scene.getEntities().filter(e => !!e.components["collider"]);

      // to update
      resolveCollisions(canCollide);
      scene
        .getEntities()
        .filter(e => typeof e.update === "function")
        .forEach(e => e.update(delta));
    });

    gl.onRender(t => {
      scene
        .getEntities()
        .filter(e => typeof e.render === "function")
        .forEach(e => e.render(t));
    });
  }, onEnd);
};

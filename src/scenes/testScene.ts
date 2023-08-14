import { resolveCollisions } from "../lib/collisions";
import {
  BoxColliderComponent,
  ImgRenderComponent,
  PositionComponent,
  StaticPositionComponent,
} from "../lib/components";
import { IRenderComponent, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { Player } from "../player";

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
    const {
      player_stand_1,
      player_stand_2,
      player_stand_1_left,
      player_stand_2_left,
      player_run_1,
      player_run_1_left,
    } = gs.images;
    const playerSprite: Sprite = {
      idle: { frames: [player_stand_1, player_stand_2], changeTime: 500 },
      idleLeft: { frames: [player_stand_1_left, player_stand_2_left], changeTime: 500 },
      run: { frames: [player_run_1, player_stand_1], changeTime: 150 },
      runLeft: { frames: [player_run_1_left, player_stand_1_left], changeTime: 150 },
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
      const [x, y] = player.getComponent<PositionComponent>("position").p;
      const cx = gs.stage.canvas.width / 2 - x;
      const cy = gs.stage.canvas.height / 2 - y;

      // scene.cameraPos = [cx, cy];

      const toRender = scene.getEntities().filter(e => !!e.components["render"]);
      toRender.sort(
        (a, b) =>
          (b.components["render"] as IRenderComponent).renderPriority -
          (a.components["render"] as IRenderComponent).renderPriority
      );

      toRender.forEach(e => e.render(t, [cx, cy]));
    });
  }, onEnd);
};

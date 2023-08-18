import { resolveCollisions } from "../lib/collisions";
import {
  BoxColliderComponent,
  ImgRenderComponent,
  PositionComponent,
  StaticPositionComponent,
} from "../lib/components";
import { IEntity, IRenderComponent, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { isInView } from "../lib/utils";
import { Enemy, Player, enemySprite, playerSprite } from "../entities/player";
// import { LifeBar } from "../entities/life";

class Ground extends ComponentBaseEntity {
  name: string;
  constructor(gs: GameState, pos: IVec, name: string) {
    const { stage } = gs;
    super(stage, []);
    const position = new StaticPositionComponent(pos);

    const renderer = new ImgRenderComponent(gs.images["static"].groundBlock);
    const box = new BoxColliderComponent([32, 32]);

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.name = name;
  }

  render(t: number, c: IVec) {
    super.render(t, c);
    const [x, y] = this.getComponent<PositionComponent>("position").p;
    const ctx = this.stage.ctx;
    ctx.beginPath();
    ctx.font = "20px serif";
    ctx.fillStyle = "white";
    ctx.fillText(this.name, x + c[0], y + c[1] + 20);
    ctx.closePath();
  }
}

export const testScene = onEnd => {
  return new Scene((gs: GameState, scene: Scene) => {
    const { gl } = gs;

    const player = new Player(gs, playerSprite(gs.images), onEnd);

    scene.addEntity(player);

    // scene.addEntity(new LifeBar(gs.stage));

    // Generate map
    let cnt = 0;
    let v = 400;
    for (let i = -0; i < 1000; i++) {
      if (i > 20) {
        // if (i % 11 === 0) continue;
        // if (i % 11 === 1) continue;
        // if (i % 11 === 2 && Math.random() < 0.5) continue;
        // if (i % 11 === 3 && Math.random() < 0.5) continue;
      }
      if (i % 50 == 0 && i > 99) v -= 64;

      // if (i % 15 === 0) {
      //   scene.addEntity(new Ground(gs, [i * 32, v - 32], cnt.toString()));
      //   cnt++;
      //   if (Math.random() < 0.5) {
      //     scene.addEntity(new Ground(gs, [i * 32, v - 64], cnt.toString()));
      //     cnt++;
      //   }
      // }
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;

      if (i > 50 && i % 17 === 0) {
        scene.addEntity(new Enemy(gs, enemySprite(gs.images), [i * 32, v - 64]));
      }
      // lastBlock = 0;
    }

    gl.onUpdate(delta => {
      const [x, y] = player.getComponent<PositionComponent>("position").p;
      const cx = gs.stage.canvas.width / 2 - x;
      const cy = gs.stage.canvas.height / 2 - y;

      const inView = scene.getEntities().filter(e => isInView(e, [cx, cy], gs.stage.canvas));

      inView.filter(e => typeof e.update === "function").forEach(e => e.update(delta, gs));

      resolveCollisions(inView.filter(e => !!e.components["collider"]));
    });

    gl.onRender(t => {
      const [x, y] = player.getComponent<PositionComponent>("position").p;
      const cx = gs.stage.canvas.width / 2 - x;
      const cy = gs.stage.canvas.height / 2 - y;

      // scene.cameraPos = [cx, cy];
      let toRender = scene.getEntities().filter(e => {
        if (!e.components["render"]) return false;
        return isInView(e, [cx, cy], gs.stage.canvas);
      });

      toRender.sort(
        (a, b) =>
          (b.components["render"] as IRenderComponent).renderPriority -
          (a.components["render"] as IRenderComponent).renderPriority
      );

      toRender.forEach(e => e.render(t, [cx, cy]));
    });
  }, onEnd);
};

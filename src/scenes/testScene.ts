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
import { Enemy, Player, enemySprite, playerSprite } from "../player";

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

export class MagicBolt extends ComponentBaseEntity {
  c: string;
  constructor(gs: GameState, pos: IVec, v: IVec, creatorID: string) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos, v, [600, 600]);

    this.c = creatorID;

    const renderer = new ImgRenderComponent(gs.images["static"].bolt);
    const box = new BoxColliderComponent(
      [12, 12],
      (b: IEntity, d: any) => {
        if (b.constructor.name === "Ground") {
          // gs.scene.removeEntity(this);
          // gs.scene.removeEntity(b);
          
        } else if (b.constructor.name === "Enemy" && b.ID !== this.c) {
          gs.scene.removeEntity(this);
          gs.scene.removeEntity(b);
          
        }
        else if (b.constructor.name === "Player" && b.ID !== this.c) {
          gs.scene.removeEntity(this);
          gs.scene.removeEntity(b);
        }
      },
      false
    );

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
  }

  update(delta: number, gs: GameState): void {
    const pos = this.getComponent<PositionComponent>("position");
    // pos.maxMove[2]

    super.update(delta, gs);
  }
}

export const testScene = onEnd => {
  return new Scene((gs: GameState, scene: Scene) => {
    const { gl } = gs;

    const player = new Player(gs, playerSprite(gs.images), onEnd);

    scene.addEntity(player);

    // Generate map
    let cnt = 0;
    let v = 400;
    for (let i = 3; i < 200; i++) {
      if (i > 20) {
        // if (i % 11 === 0) continue;
        // if (i % 11 === 1) continue;
        // if (i % 11 === 2 && Math.random() < 0.5) continue;
        // if (i % 11 === 3 && Math.random() < 0.5) continue;
      }
      if (i % 50 == 0) v -= 64;

      if (i % 15 === 0) {
        scene.addEntity(new Ground(gs, [i * 32, v - 32], cnt.toString()));
        cnt++;
        if (Math.random() < 0.5) {
          scene.addEntity(new Ground(gs, [i * 32, v - 64], cnt.toString()));
          cnt++;
        }
      }
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;
      // lastBlock = 0;
    }

    const enemy = new Enemy(gs, enemySprite(gs.images));
    scene.addEntity(enemy);

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

import { resolveCollisions } from "../lib/collisions";
import {
  BoxColliderComponent,
  HTMLComponent,
  ImgRenderComponent,
  PositionComponent,
  StaticPositionComponent,
} from "../lib/components";
import { IEntity, IRenderComponent, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { isInView } from "../lib/utils";
import { Enemy, EnemyData, LittleDemon, Player, demonSprite, enemySprite, playerSprite } from "../entities/player";
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
class LivesCountComponent extends HTMLComponent {
  onInit(e: ComponentBaseEntity): void {
    super.onInit(e);
    this.show();
  }
  onUpdate(e: ComponentBaseEntity, delta: number, gameState?: GameState): void {
    this.el.innerHTML = `<span>${gameState?.session?.lives || ""}</span>`;
  }
}

class Lives extends ComponentBaseEntity {
  constructor(gs: GameState) {
    const { stage } = gs;
    super(stage, []);

    const html = new LivesCountComponent("#lives");

    this.addComponent(html);
  }
}

class Map {
  raw: string;
  _parsed: any[];
  constructor(raw: string) {
    this.raw = raw;
    this._parse();
  }

  _expand(s: string) {
    const [l, v] = s.replace(/([0-9]*)(.*)/, "$1 $2").split(" ");

    const e = [];
    for (let i = 0; i < parseInt(l); i++) {
      e.push(v);
    }
    return e;
  }

  _parse() {
    const sections = this.raw.split(",");
    let parsed = [];
    for (let s of sections) {
      parsed = parsed.concat(this._expand(s));
    }
    this._parsed = parsed;
  }

  get length(): number {
    return this._parsed.length;
  }
  tile(n: number): any {
    return this._parsed[n];
  }
}
const generateMap = (gs: GameState, scene: Scene) => {
  // Generate map

  const sections = [
    "30.",
    "3_",
    "15.,1b",
    "10.",
    "3_",
    "10.,2|",
    "20.,1a",
    "10.,2|",
    "5.,3_,5.,5_",
    "5.,3|",
    "20.,2bb,5.",
    "10.,1*,1-,1|,10.,1a",
    "10.1*,1|,10.,1a",
    "3.,2|,3.",
    "10.,3_,5.,1a,1.,5_",
    "3.,3|,3.",
    "5.,3_,2.,3_,5.,1a,1.,5_",
    "20.,3bbb,5.",
    "10.,3|,20.,1aaa",
  ];

  const map = new Map(sections.join(","));
  let cnt = 0;
  let v = Math.floor(gs.stage.canvas.height / 2);
  let enemies = 0;
  const tiles = [];
  console.log("Map length", map.length);
  for (let i = 0; i < map.length; i++) {
    const tile = map.tile(i);

    if (tile === "|") {
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;
      v -= 32;
    }
    if (tile === "-") {
      v -= 32;
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;
      v -= 32;
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;
      v += 64;
    }
    if (tile === "*") {
      v -= 32;
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;

      v += 32;
    }
    if (tile === "b" || tile === "bb" || tile === "bbb") {
      const data: any = {};
      if (tile === "b") data.speed = 10;
      else if (tile === "bb") data.speed = 50;
      else data.speed = 100;
      scene.addEntity(new LittleDemon(gs, demonSprite(gs.images), [i * 32, v - 64], data));
    }
    if (tile === "a" || tile === "aa" || tile === "aaa") {
      const data: EnemyData = {};
      if (tile === "a") data.boltCost = 800;
      else if (tile === "aa") data.boltCost = 550;
      else data.boltCost = 300;
      scene.addEntity(new Enemy(gs, enemySprite(gs.images), [i * 32, v - 64], data));
      enemies++;
    }

    if (tile !== "_") {
      scene.addEntity(new Ground(gs, [i * 32, v], cnt.toString()));
      cnt++;
    }
    // const tile = tilePercentage(tiles, i);

    // if (tile === "raise") v -= 64;
    // if (tile !== "hole")

    // tiles.push(tile);
    // if (tiles.length > 20) tiles.shift();
    // Terrain Increase
    // if (i % 50 == 0 && i > 99) v -= 64;

    // if (i > 50 && i % 17 === 0) {
    //   const data: EnemyData = {};
    //   if (enemies < 2) data.boltCost = 800;
    //   else if (enemies < 5) data.boltCost = 550;
    //   else data.boltCost = 400;
    //   scene.addEntity(new Enemy(gs, enemySprite(gs.images), [i * 32, v - 64], data));
    //   enemies++;
    // }
    // lastBlock = 0;
  }
};

export const mainScene = () => {
  return new Scene(
    async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene }> =>
      new Promise((resolve, reject) => {
        const { gl } = gs;
        const v: IVec = [Math.floor(gs.stage.canvas.height / 2), Math.floor(gs.stage.canvas.width / 2)];
        const player = new Player(gs, playerSprite(gs.images), [400, -10], gs.session.lives, () => {
          resolve({ gs, scene });
        });

        scene.addEntity(player);
        scene.addEntity(new Lives(gs));

        // scene.addEntity(new LifeBar(gs.stage));

        generateMap(gs, scene);

        gl.onUpdate(delta => {
          // console.log(gs.session.pos)
          gs.getEntities()
            .filter(e => typeof e.update === "function")
            .forEach(e => e.update(delta, gs));

          if (gs.status !== "running") return;

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
              b.getComponent<IRenderComponent>("render").renderPriority -
              a.getComponent<IRenderComponent>("render").renderPriority
          );

          toRender.forEach(e => e.render(t, [cx, cy]));
        });
      })
  );
};

import { Enemy, EnemyData, enemySprite } from "../entities/enemy";
import { LittleDemon, demonSprite } from "../entities/littleDemon";
import { Player, playerSprite } from "../entities/player";
import { resolveCollisions } from "../lib/collisions";
import {
  BoxColliderComponent,
  HTMLComponent,
  ImgRenderComponent,
  PositionComponent,
  StaticPositionComponent,
} from "../lib/components";
import { IRenderComponent, IVec } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { isInView } from "../lib/utils";
// import { LifeBar } from "../entities/life";

export class Ground extends ComponentBaseEntity {
  name: string;
  eType: string = "Ground";
  life: number = 100;
  gs: GameState;
  hits: Set<string> = new Set();
  constructor(gs: GameState, pos: IVec) {
    const { stage } = gs;
    super(stage, []);
    this.gs = gs;
    const position = new StaticPositionComponent(pos);

    const renderer = new ImgRenderComponent(gs.images["static"].groundBlock);
    const box = new BoxColliderComponent([32, 32]);

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
  }
  takeDamage(dmg: number, id: string) {
    if (this.hits.has(id)) return;
    this.hits.add(id);

    this.life -= dmg;
    this.replaceComponent(new ImgRenderComponent(this.gs.images["static"].dmgGroundBlock));
    this.getComponent<ImgRenderComponent>("rnd").onInit(this);
    // this.replaceComponent(new ImgRenderComponent(this.gs.images["static"].groundBlock));
    if (this.life <= 0) {
      this.gs.scene.removeEntity(this);
    }
  }
}
class LivesCountComponent extends HTMLComponent {
  img: HTMLImageElement;
  gs: GameState;
  constructor(sel: string, gs: GameState) {
    super(sel);
    this.img = gs.images["life"].life;
    this.gs = gs;
  }
  onInit(e: ComponentBaseEntity): void {
    super.onInit(e);
    this.el.innerHTML = "";
    for (let i = 0; i < this.gs.session.lives; i++) {
      this.el.appendChild(this.img.cloneNode(true));
    }

    this.show();
  }
  onUpdate(e: ComponentBaseEntity, delta: number, gameState?: GameState): void {
    // this.el.innerHTML = `<span>${gameState?.session?.lives || ""}</span>`;
  }
}

class Lives extends ComponentBaseEntity {
  constructor(gs: GameState) {
    const { stage } = gs;
    super(stage, []);

    const html = new LivesCountComponent("#lives", gs);

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
const generateMap = (gs: GameState, scene: Scene, mp: null | Map = null) => {
  // Generate map
  const step = ["4.", "1|", "10."];

  const intro = ["30.", "2_", "1wwwww", ...step];
  const d = ["10.", "1b"];
  const demon = [...d, ...step];
  const demon2 = [...d, ...d, ...d, ...step];
  const e = ["10.", "1a"];
  const enemy = [...e, ...step];
  const enemy2 = [...e, ...e, ...e, ...step];
  const jumps = ["5.", "3_", "10.", "5_", "10.", "10_", "5.", ...step];
  const j = ["5.", "3_", "3.", "3_", "5."];
  const jumps2 = [...j, "10_", "5.", ...j, "15_", "5.", ...step];
  const fight = [
    ...demon,
    ...enemy,
    ...jumps,
    ...demon2,
    ...enemy2,
    ...jumps,
    ...demon2.map(s => s.replace("1b", "2b")),
    ...jumps2,
    ...enemy.map(s => s.replace("1a", "1a,1.,1a")),
    ...jumps2,
  ];

  const sections = [
    ...intro,
    ...fight,
    ...fight.map(s => s.replace(/a/g, "aa").replace(/b/g, "bb")),
    ...fight.map(s => s.replace(/a/g, "aaa").replace(/b/g, "bbb")),
  ];

  const map = !mp ? new Map(sections.join(",")) : new Map(mp.raw + "," + sections.join(","));

  let v = Math.floor(gs.stage.canvas.height / 2);
  let enemies = 0;
  // console.log("Map length", map.length);
  for (let i = 0; i < map.length; i++) {
    const tile = map.tile(i);

    if (tile === "|") {
      scene.addEntity(new Ground(gs, [i * 32, v]));
      v -= 32;
    }

    if (tile === "*") {
      v -= 32;
      scene.addEntity(new Ground(gs, [i * 32, v]));

      v += 32;
    }
    if (tile.startsWith("b")) {
      const data: any = {};
      let t = 0;
      if (tile === "b") {
        data.speed = 10;
      } else if (tile === "bb") {
        data.speed = 50;
        t = 1;
      } else {
        data.speed = 100;
        t = 2;
      }
      scene.addEntity(new LittleDemon(gs, demonSprite(gs.images, t), [i * 32, v - 64], data));
    }
    if (tile.startsWith("a")) {
      const data: EnemyData = {};
      let t = 0;
      if (tile === "a") data.boltCost = 800;
      else if (tile === "aa") {
        data.boltCost = 550;
        t = 1;
      } else {
        data.boltCost = 300;
        t = 2;
      }
      scene.addEntity(new Enemy(gs, enemySprite(gs.images, t), [i * 32, v - 64], data));
      enemies++;
    }

    if (tile !== "_") {
      scene.addEntity(new Ground(gs, [i * 32, v]));
    }
  }
  return map;
};

export const mainScene = (infinite: boolean = false) => {
  return new Scene(
    async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene; win: boolean }> =>
      new Promise(resolve => {
        const { gl } = gs;
        const player = new Player(gs, playerSprite(gs.images), [400, -10], gs.session.lives, () => {
          resolve({ gs, scene, win: false });
        });

        scene.addEntity(player);
        scene.addEntity(new Lives(gs));

        // scene.addEntity(new LifeBar(gs.stage));

        let map = generateMap(gs, scene);

        gl.onUpdate(delta => {
          gs.getEntities()
            .filter(e => typeof e.update === "function")
            .forEach(e => e.update(delta, gs));

          if (gs.status !== "running") return;

          const [x, y] = player.getComponent<PositionComponent>("pos").p;
          const cx = gs.stage.canvas.width / 2 - x;
          const cy = gs.stage.canvas.height / 2 - y;

          const threshold = 4;
          if (!infinite) {
            if (Math.round(x / 32) >= map.length - threshold) {
              resolve({ gs, scene, win: true });
            }
          } else {
            if (Math.round(x / 32) >= map.length - 100) {
              map = generateMap(gs, scene, map);
            }
          }

          const inView = scene.getEntities().filter(e => isInView(e, [cx, cy], gs.stage.canvas));

          inView.filter(e => typeof e.update === "function").forEach(e => e.update(delta, gs));

          resolveCollisions(inView.filter(e => !!e.components["coll"]));
        });

        gl.onRender(t => {
          const [x, y] = player.getComponent<PositionComponent>("pos").p;
          const cx = gs.stage.canvas.width / 2 - x;
          const cy = gs.stage.canvas.height / 2 - y;

          // scene.cameraPos = [cx, cy];
          let toRender = scene.getEntities().filter(e => {
            if (!e.components["rnd"]) return false;
            return isInView(e, [cx, cy], gs.stage.canvas);
          });

          toRender.sort(
            (a, b) =>
              b.getComponent<IRenderComponent>("rnd").renderPriority -
              a.getComponent<IRenderComponent>("rnd").renderPriority
          );

          toRender.forEach(e => e.render(t, [cx, cy]));
        });
      })
  );
};

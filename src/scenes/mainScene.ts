import { Enemy, EnemyData } from "../entities/enemy";
import { LittleDemon, demonSprite } from "../entities/littleDemon";
import { Player, enemySprite, playerSprite } from "../entities/player";
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
  constructor(gs: GameState, pos: IVec, name: string) {
    const { stage } = gs;
    super(stage, []);
    this.gs = gs;
    const position = new StaticPositionComponent(pos);

    const renderer = new ImgRenderComponent(gs.images["static"].groundBlock);
    const box = new BoxColliderComponent([32, 32]);

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.name = name;
  }
  takeDamage(dmg: number, id: string) {
    if (this.hits.has(id)) return;
    this.hits.add(id);

    this.life -= dmg;
    this.replaceComponent(new ImgRenderComponent(this.gs.images["static"].dmgGroundBlock));
    this.getComponent<ImgRenderComponent>("render").onInit(this);
    // this.replaceComponent(new ImgRenderComponent(this.gs.images["static"].groundBlock));
    if (this.life <= 0) {
      this.gs.scene.removeEntity(this);
    }
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
    "1|",
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
  // console.log("Map length", map.length);
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
  }
  return map;
};

export const mainScene = () => {
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

        const map = generateMap(gs, scene);

        gl.onUpdate(delta => {
          gs.getEntities()
            .filter(e => typeof e.update === "function")
            .forEach(e => e.update(delta, gs));

          if (gs.status !== "running") return;

          const [x, y] = player.getComponent<PositionComponent>("position").p;
          const cx = gs.stage.canvas.width / 2 - x;
          const cy = gs.stage.canvas.height / 2 - y;

          const threshold = 4;
          if (Math.round(x / 32) >= map.length - threshold) {
            resolve({ gs, scene, win: true });
          }
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

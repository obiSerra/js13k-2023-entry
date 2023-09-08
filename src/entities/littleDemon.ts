import { PositionComponent, SpriteRenderComponent, BoxColliderComponent, GravityComponent } from "../lib/components";
import { Sprite, IVec } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { EnemyData } from "./enemy";
import { Player } from "./player";

export const demonSprite: (images: any, t: number) => Sprite = (images, t) => {
  let d = images["demon"];
  if (t === 1) d = images["demon2"];
  if (t === 2) d = images["demon3"];

  return {
    idle: { frames: [d.dem_1, d.dem_2, d.dem_3], changeTime: 300 },
    dmg: { frames: [d.dmg_1, d.dem_1], changeTime: 50 },
    dmgL: { frames: [d.dmg_1_left, d.dem_1], changeTime: 50 },
  };
};

export class LittleDemon extends ComponentBaseEntity {
  gs: GameState;
  triggered: boolean = false;
  data: EnemyData = {};
  energy: number = 50;
  speed: number = 100;
  maxDist: number = 500;
  eType: string = "LittleDemon";
  hits: Set<string> = new Set();
  constructor(gs: GameState, sprite: Sprite, pos: IVec, data: any = {}) {
    const { stage } = gs;
    super(stage, []);

    const position = new PositionComponent(pos, [0, 0], [400, 400]);
    // const renderer = new ImgRenderComponent(gs.images["static"].demonRender);

    const renderer = new SpriteRenderComponent(sprite, "idle");
    const box = new BoxColliderComponent([30, 30], (b: ComponentBaseEntity, d: any) => {
      if (b.eType === "Player" && !this.triggered) {
        this.triggered = true;
        gs.scene.removeEntity(this);

        (b as Player)?.takeDamage(50);
      }
    });
    box.posModifiers = [5, 5];
    // box.solid = false;
    const gravity = new GravityComponent();
    this.gs = gs;
    this.speed = data?.speed || this.speed;
    this.maxDist = data?.maxDist || this.maxDist;
    this.data = data;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gs?: GameState): void {
    this.action(delta, gs);

    // const pos = this.getComponent<PositionComponent>("position");
    // const rend = this.getComponent<SpriteRenderComponent>("render");

    // if (pos.direction === 1 && rend.cA !== "idleL") rend.sAnim("idleL");
    // if (pos.direction === -1 && rend.cA !== "idle") rend.sAnim("idle");

    super.update(delta, gs);
  }

  action(delta: number, gs: GameState) {
    const player = gs.scene.getEntities().find(e => e.eType === "Player") as Player;
    if (!player) return;
    const [px, py] = player.getComponent<PositionComponent>("position").p;
    const [pw, ph] = player.getComponent<BoxColliderComponent>("collider").box;
    const pos = this.getComponent<PositionComponent>("position");
    const {
      p: [x, y],
      direction: d,
    } = pos;
    const [w, h] = this.getComponent<BoxColliderComponent>("collider").box;

    const [[cpx, cpy], [cx, cy]] = [
      [px + pw / 2, py + ph / 2],
      [x + w / 2, y + h / 2],
    ];

    const dist = Math.sqrt(Math.pow(cpx - cx, 2) + Math.pow(cpy - cy, 2));
    const vDist = Math.sqrt(Math.pow(cpy - cy, 2));

    if (vDist > 20) return;

    if (px < x && d !== 1) pos.direction = 1;
    else if (px > x && d !== -1) pos.direction = -1;

    if (dist < this.maxDist) {
      pos.accelerate([this.speed * -pos.direction, 0]);
    }
    // console.log(dist, vDist);

    // Turn

    // // Attack - to move

    // if (this.fireCharge.current < 350) this.firing = false;
    // const startBurst = this.firing || this.fireCharge.isFull;
    // // const startBurst = true;

    // if (dist < 600 && vDist < 100 && startBurst) {
    //   this.firing = true;
    //   enemyFireThrottle.call(delta, () => {
    //     this.magicBolt();
    //   });
    // } else {
    // }
  }
  takeDamage(dmg: number, id: string) {
    if (this.hits.has(id)) return;
    this.hits.add(id);
    const v = this.getComponent<PositionComponent>("position").v;
    this.getComponent<PositionComponent>("position").accelerate([v[0] * -10, -50]);
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.cA !== "dmg") {
      rend.sAnim("dmg");
      setTimeout(() => rend.sAnim("idle"), 100);
    }
    this.energy -= dmg;
    if (this.energy <= 0) this.gs.scene.removeEntity(this);
  }
}

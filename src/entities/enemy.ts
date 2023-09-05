import { PositionComponent, SpriteRenderComponent, BoxColliderComponent, GravityComponent } from "../lib/components";
import { Sprite, IVec } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Throttle } from "../lib/utils";
import { Rechargeable } from "../services/rechargeable";
import { MagicBolt } from "./bolt";
import { Player } from "./player";

const enemyFireThrottle = new Throttle(100);
export type EnemyData = {
  boltCost?: number;
};
export class Enemy extends ComponentBaseEntity {
  gs: GameState;
  fireCharge: Rechargeable = new Rechargeable(1000, 1000);
  firing: boolean = false;
  data: EnemyData = {};
  eType: string = "Enemy";
  energy: number = 50;
  constructor(gs: GameState, sprite: Sprite, pos: IVec, data: EnemyData = {}) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos);
    const renderer = new SpriteRenderComponent(sprite, "idle");
    const box = new BoxColliderComponent([48, 48], (b: ComponentBaseEntity, c: any) => {});
    const gravity = new GravityComponent();
    this.gs = gs;
    this.data = data;

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
    this.addComponent(gravity);
  }

  update(delta: number, gs: GameState): void {
    this.action(delta, gs);
    this.fireCharge.recharge(delta);
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");

    if (pos.direction === 1 && rend.cA !== "idleL") rend.sAnim("idleL");
    if (pos.direction === -1 && rend.cA !== "idle") rend.sAnim("idle");

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

    // Turn
    if (px < x && d !== 1) pos.direction = 1;
    else if (px > x && d !== -1) pos.direction = -1;

    // Attack - to move

    if (this.fireCharge.current < 350) this.firing = false;
    const startBurst = this.firing || this.fireCharge.isFull;
    // const startBurst = true;

    if (dist < 600 && vDist < 100 && startBurst) {
      this.firing = true;
      enemyFireThrottle.call(delta, () => {
        this.magicBolt();
      });
    } else {
    }
  }

  magicBolt() {
    const boltCost = this?.data?.boltCost || 550;
    if (this.fireCharge.current < boltCost) return;
    const pos = this.getComponent<PositionComponent>("position");
    const d = pos.direction * -400;
    const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
    const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 25], [d, 0], this.ID);
    this.gs.scene.addEntity(bolt);
    this.fireCharge.use(boltCost);
  }
  takeDamage(dmg: number) {
    const rend = this.getComponent<SpriteRenderComponent>("render");
    if (rend.cA !== "dmg") {
      rend.sAnim("dmg");
      setTimeout(() => rend.sAnim("idle"), 100);
    }
    this.energy -= dmg;
    if (this.energy <= 0) this.gs.scene.removeEntity(this);
  }
}

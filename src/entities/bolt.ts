import { BoxColliderComponent, PositionComponent, SpriteRenderComponent } from "../lib/components";
import { IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Expire } from "../lib/utils";
import { Enemy } from "./enemy";
import { LittleDemon } from "./littleDemon";
import { Player } from "./player";

export type MagicBoltData = {
  dmg?: number;
  exp?: number;
  en?: boolean;
};
const boltSprite: (images: any) => Sprite = images => {
  const s = images["shaman"];
  const b = images["bolt"];
  return {
    bolt: { frames: [s.bolt_1, s.bolt_2], changeTime: 50 },
    boltExplode: { frames: [s.bolt_explode_1, s.bolt_explode_2, s.bolt_explode_3], changeTime: 50 },
    boltLeft: { frames: [s.bolt_1_left, s.bolt_2_left], changeTime: 50 },
    enhBolt: { frames: [b.bolt_1, b.bolt_2], changeTime: 50 },
    enhBoltExplode: { frames: [b.bolt_explode_1, b.bolt_explode_2, b.bolt_explode_3], changeTime: 50 },
    enhBoltLeft: { frames: [b.bolt_1_left, b.bolt_2_left], changeTime: 50 },
  };
};
export class MagicBolt extends ComponentBaseEntity {
  c: string;
  h: string | null = null;
  expire: Expire;
  gs: GameState;
  data: MagicBoltData = { dmg: 10 };
  constructor(gs: GameState, pos: IVec, v: IVec, creatorID: string, data: MagicBoltData = {}) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos, v, [400, 600]);
    position.direction = v[0] > 0 ? -1 : 1;
    const d = position.direction;
    this.gs = gs;
    this.c = creatorID;
    this.data = { ...this.data, ...data };
    this.expire = new Expire(this.data?.exp || 1000, this.endTime.bind(this));

    const renderer = new SpriteRenderComponent(boltSprite(gs.images), "bolt");

    const box = new BoxColliderComponent([8, 8], (b: ComponentBaseEntity, d: any) => {
      if (b.ID === this.c || this.c === (b as MagicBolt)?.c) return;

      if (b.eType === "Ground") {
        // gs.scene.removeEntity(b);
      } else if (b.eType === "Enemy") {
        (b as Enemy).takeDamage(this.data.dmg || 10);
      } else if (b.eType === "LittleDemon") {
        (b as LittleDemon).takeDamage(this.data.dmg || 10);

        // gs.scene.removeEntity(b);
      } else if (b.eType === "Player") {
        if (this.c !== b.ID) {
          this.c = b.ID;
          (b as Player)?.takeDamage(this.data.dmg || 10);
        }
      }
      this.onDestroy();
    });
    box.solid = false;
    box.posModifiers = [2, 2];

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);

    if (this.data?.en) {
      if (d === -1 && renderer.cA !== "enhBolt") renderer.setupAnimation("enhBolt");
      else if (d === 1 && renderer.cA !== "enhBoltLeft") renderer.setupAnimation("enhBoltLeft");
    } else {
      if (d === -1 && renderer.cA !== "bolt") renderer.setupAnimation("bolt");
      else if (d === 1 && renderer.cA !== "boltLeft") renderer.setupAnimation("boltLeft");
    }
  }
  endTime() {
    this.onDestroy();
  }

  update(delta: number, gs: GameState): void {
    this.expire.update(delta);

    super.update(delta, gs);
  }

  render(t: number, ca?: IVec): void {
    // if (rend.cA !== "bolt") rend.setupAnimation("bolt");
    super.render(t, ca);
  }

  onDestroy() {
    const rend = this.getComponent<SpriteRenderComponent>("render");

    if (this.data?.en) {
      if (rend.cA !== "enhBoltExplode") rend.setupAnimation("enhBoltExplode");
    } else {
      if (rend.cA !== "boltExplode") rend.setupAnimation("boltExplode");
    }

    // if (rend.cA !== "boltExplode") rend.setupAnimation("boltExplode");
    this.getComponent<PositionComponent>("position").v = [0, 0];
    this.getComponent<BoxColliderComponent>("collider").onCollide = null;
    setTimeout(() => {
      this.gs.scene.removeEntity(this);
    }, 150);
  }
}

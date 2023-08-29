import { PositionComponent, ImgRenderComponent, BoxColliderComponent, SpriteRenderComponent } from "../lib/components";
import { IVec, IEntity, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Expire } from "../lib/utils";
import { Enemy, LittleDemon, Player } from "./player";

export type MagicBoltData = {
  dmg?: number;
  exp?: number;
};
const boltSprite: (images: any) => Sprite = images => {
  const s = images["shaman"];
  return {
    bolt: { frames: [s.bolt_1, s.bolt_2], changeTime: 50 },
    boltLeft: { frames: [s.bolt_1_left, s.bolt_2_left], changeTime: 50 },
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
    this.gs = gs;
    this.c = creatorID;
    this.data = { ...this.data, ...data };
    this.expire = new Expire(this.data?.exp || 1000, this.endTime.bind(this));

    const renderer = new SpriteRenderComponent(boltSprite(gs.images), "bolt");

    const box = new BoxColliderComponent([8, 8], (b: ComponentBaseEntity, d: any) => {
      if (b.ID === this.c) return;

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
      gs.scene.removeEntity(this);
    });
    box.solid = false;
    box.posModifiers = [2, 2];

    this.addComponent(position);
    this.addComponent(renderer);
    this.addComponent(box);
  }
  endTime() {
    this.gs.scene.removeEntity(this);
  }

  update(delta: number, gs: GameState): void {
    this.expire.update(delta);

    super.update(delta, gs);
  }

  render(t: number, ca?: IVec): void {
    const pos = this.getComponent<PositionComponent>("position");
    const rend = this.getComponent<SpriteRenderComponent>("render");
    const d = pos.v[0] > 0 ? -1 : 1;

    if (d === -1 && rend.currentAnimation !== "bolt") rend.setupAnimation("bolt");
    else if (d === 1 && rend.currentAnimation !== "boltLeft") rend.setupAnimation("boltLeft");
    // if (rend.currentAnimation !== "bolt") rend.setupAnimation("bolt");
    super.render(t, ca);
  }
}

import { player } from "../assets/pxImages";
import { PositionComponent, ImgRenderComponent, BoxColliderComponent } from "../lib/components";
import { IVec, IEntity } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Expire } from "../lib/utils";
import { LittleDemon, Player } from "./player";

export type MagicBoltData = {
  dmg?: number;
  exp?: number;
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

    const renderer = new ImgRenderComponent(gs.images["static"].bolt);
    const box = new BoxColliderComponent([8, 8], (b: IEntity, d: any) => {
      if (b.ID === this.c) return;
      if (b.constructor.name === "Ground") {
        // gs.scene.removeEntity(b);
      } else if (b.constructor.name === "Enemy") {
        gs.scene.removeEntity(b);
      } else if (b.constructor.name === "LittleDemon") {
        (b as LittleDemon).takeDamage(this.data.dmg || 10);

        // gs.scene.removeEntity(b);
      } else if (b.constructor.name === "Player") {
        if (this.c !== b.ID) {
          this.c = b.ID;
          console.log("hit player");
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
}

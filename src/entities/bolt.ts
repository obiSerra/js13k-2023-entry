import { player } from "../assets/pxImages";
import { PositionComponent, ImgRenderComponent, BoxColliderComponent } from "../lib/components";
import { IVec, IEntity } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { Player } from "./player";

export class MagicBolt extends ComponentBaseEntity {
  c: string;
  h: string | null = null;
  constructor(gs: GameState, pos: IVec, v: IVec, creatorID: string) {
    const { stage } = gs;
    super(stage, []);
    const position = new PositionComponent(pos, v, [400, 600]);

    this.c = creatorID;

    const renderer = new ImgRenderComponent(gs.images["static"].bolt);
    const box = new BoxColliderComponent([8, 8], (b: IEntity, d: any) => {
      if (b.constructor.name === "Ground") {
        gs.scene.removeEntity(this);
        // gs.scene.removeEntity(b);
      } else if (b.constructor.name === "Enemy" && b.ID !== this.c) {
        gs.scene.removeEntity(this);
        gs.scene.removeEntity(b);
      } else if (b.constructor.name === "Player" && b.ID !== this.c) {
        gs.scene.removeEntity(this);
        if (this.c !== b.ID) {
          this.c = b.ID;
          console.log("hit player");
          (b as Player)?.takeDamage(50);
        }
      }
    });
    box.solid = false;
    box.posModifiers = [2, 2];

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

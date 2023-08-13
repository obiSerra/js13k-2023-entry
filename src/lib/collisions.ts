import { BoxColliderComponent, PositionComponent } from "./components";
import { IEntity, IVec } from "./contracts";

export const isCollide = (a: IVec, as: IVec, b: IVec, bs: IVec) => {
  const [ax, ay] = a;
  const [aw, ah] = as;
  const [bx, by] = b;
  const [bw, bh] = bs;

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
};

export const resolveCollisions = (
  entities: IEntity[],
  onCollideOverride: (e: IEntity) => void | null = null
) => {
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    let aCollide = false;
    const {
      p: [aX, aY],
      lp: [aXl, aYl],
    } = a.getComponent<PositionComponent>("position");
    let { box: aBox, onCollide } = a.getComponent<BoxColliderComponent>("collider");

    if (onCollideOverride) onCollide = onCollideOverride;

    for (let j = 0; j < entities.length; j++) {
      if (i !== j) {
        const b = entities[j];
        const {
          p: [bX, bY],
          lp: [bXl, bYl],
        } = b.getComponent<PositionComponent>("position");
        const bBox = b.getComponent<BoxColliderComponent>("collider").box;
        const actualCollide = isCollide([aX, aY], aBox, [bX, bY], bBox);
        if (actualCollide && !!onCollide) {
          aCollide = true;
          onCollide(b);
        }
      }
    }

    a.getComponent<BoxColliderComponent>("collider").isColliding = aCollide;
  }
};

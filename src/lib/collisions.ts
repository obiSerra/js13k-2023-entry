import { BoxColliderComponent, PositionComponent } from "./components";
import { IEntity, IVec } from "./contracts";

export const isCollide = (a: IVec, as: IVec, b: IVec, bs: IVec) => {
  const [ax, ay] = a;
  const [aw, ah] = as;
  const [bx, by] = b;
  const [bw, bh] = bs;

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
};

export const resolveCollisions = (entities: IEntity[]) => {
  const triggers = entities.filter(e => !!e.getComponent<BoxColliderComponent>("collider").onCollide);
  for (let i = 0; i < triggers.length; i++) {
    const a = triggers[i];
    const c = a.getComponent<BoxColliderComponent>("collider");
    c.isColliding = false;
    c.collisions = [];

    let {
      p: [aX, aY],
    } = a.getComponent<PositionComponent>("position");

    let { box: aBox, onCollide } = a.getComponent<BoxColliderComponent>("collider");

    let btmCollide: number | null = null;
    let tpCollide: number | null = null;
    let leftCollide: number | null = null;
    let rightCollide: number | null = null;

    for (let j = 0; j < entities.length; j++) {
      if (i !== j) {
        const b = entities[j];
        const {
          p: [bX, bY],
        } = b.getComponent<PositionComponent>("position");
        const bBox = b.getComponent<BoxColliderComponent>("collider").box;

        // const actualCollide = isCollide([aX, aY], aBox, [bX, bY], bBox);

        const dist = 10;

        // Collide bottom
        for (let i = 0; i < dist; i++) {
          if (isCollide([aX, aY + aBox[1] + i], [aBox[0], 1], [bX, bY], bBox)) {
            btmCollide = Math.max(i, btmCollide || 0);
            break;
          }
        }
        // Collide top
        for (let i = 0; i < dist; i++) {
          if (isCollide([aX, aY - i], [aBox[0], 1], [bX, bY], bBox)) {
            tpCollide = Math.min(-i, tpCollide || 0);
            break;
          }
        }

        //collide right
        for (let i = 0; i < dist; i++) {
          if (isCollide([aX + aBox[0] + i, aY], [1, aBox[1]], [bX, bY], bBox)) {
            rightCollide = Math.max(i, rightCollide || 0);
            break;
          }
        }
        //collide left
        for (let i = 0; i < dist; i++) {
          if (isCollide([aX - i, aY], [1, aBox[1]], [bX, bY], bBox)) {
            leftCollide = Math.min(-i, leftCollide || 0);
            break;
          }
        }

        a.getComponent<PositionComponent>("position").maxMove = [tpCollide, rightCollide, btmCollide, leftCollide];
      }
    }
  }
};

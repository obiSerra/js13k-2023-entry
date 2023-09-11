import { BoxColliderComponent, PositionComponent } from "./components";
import { CollisionSensor, IVec } from "./contracts";
import { ComponentBaseEntity } from "./entities";

export const isCollide = (a: IVec, as: IVec, b: IVec, bs: IVec) => {
    const [[ax, ay], [aw, ah], [bx, by], [bw, bh]] = [a, as, b, bs];
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
};

export const resolveCollisions = (entities: ComponentBaseEntity[]) => {
    const triggers = entities.filter(e => !!e.getComponent<BoxColliderComponent>("coll").onCollide);
    for (let i = 0; i < triggers.length; i++) {
        const a = triggers[i];
        const c = a.getComponent<BoxColliderComponent>("coll");
        c.isColliding = false;
        c.collisions = [];

        let {
            box: aBox,
            onCollide,
            boxPos: [aX, aY]
        } = a.getComponent<BoxColliderComponent>("coll");
        a.getComponent<PositionComponent>("pos").collisionSensors = [null, null, null, null];
        let btmCollide: CollisionSensor | null = null;
        let tpCollide: CollisionSensor | null = null;
        let leftCollide: CollisionSensor | null = null;
        let rightCollide: CollisionSensor | null = null;

        for (let j = 0; j < entities.length; j++) {
            const b = entities[j];
            if (b.ID !== a.ID) {
                const t = b.eType;

                const {
                    box: bBox,
                    boxPos: [bX, bY]
                } = b.getComponent<BoxColliderComponent>("coll");
                const dist = 10;

                // Collide bottom
                for (let i = 0; i < dist; i++) {
                    if (isCollide([aX, aY + aBox[1] + i], [aBox[0], 1], [bX, bY], bBox)) {
                        if (i === 0) onCollide(b, "bottom");

                        if (i < (btmCollide?.d || Infinity)) {
                            if (btmCollide === null) btmCollide = { d: 0, t: "" };
                            btmCollide.d = i;
                            btmCollide.t = t;
                            break;
                        }
                    }
                }
                // Collide top
                for (let i = 0; i < dist; i++) {
                    if (isCollide([aX, aY - i - 1], [aBox[0], 1], [bX, bY], bBox)) {
                        if (i === 0) onCollide(b, "top");
                        if (-i < (tpCollide?.d || 0)) {
                            if (tpCollide === null) tpCollide = { d: 0, t: "" };
                            tpCollide.d = i;
                            tpCollide.t = t;
                            break;
                        }
                    }
                }

                //collide right
                for (let i = 0; i < dist; i++) {
                    if (isCollide([aX + aBox[0] + i, aY], [1, aBox[1]], [bX, bY], bBox)) {
                        if (i === 0) onCollide(b, "right");

                        if (i < (rightCollide?.d || Infinity)) {
                            if (rightCollide === null) rightCollide = { d: 0, t: "" };
                            rightCollide.d = i;
                            rightCollide.t = t;
                            break;
                        }
                        break;
                    }
                }
                //collide left
                for (let i = 0; i < dist; i++) {
                    if (isCollide([aX - i - 1, aY], [aBox[0], aBox[1]], [bX, bY], bBox)) {
                        if (i === 0) {
                            onCollide(b, "left");
                        }
                        if (i < (leftCollide?.d || Infinity)) {
                            if (leftCollide === null) leftCollide = { d: 0, t: "" };
                            leftCollide.d = i;
                            leftCollide.t = t;
                            break;
                        }
                    }
                }
            }
        }
        a.getComponent<PositionComponent>("pos").collisionSensors = [tpCollide, rightCollide, btmCollide, leftCollide];
    }
};

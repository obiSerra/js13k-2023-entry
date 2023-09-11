import {
    BoxColliderComponent,
    GravityComponent,
    HTMLComponent,
    KeyboardControlComponent,
    PositionComponent,
    SoundComponent,
    SpriteRenderComponent
} from "../lib/components";
import { ComponentType, IComponent, IVec, Sprite } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState } from "../lib/gameState";
import { genMusicSheet } from "../lib/soundComponent";
import { Stage } from "../lib/stage";
import { Throttle } from "../lib/utils";
import { Rechargeable } from "../services/rechargeable";
import { MagicBolt } from "./bolt";

export const playerSprite: (images: any) => Sprite = images => {
    const s = images["shaman"];
    return {
        idle: { frames: [s.idle_1, s.idle_1, s.idle_2, s.idle_2, s.idle_1], changeTime: 250 },
        idleL: { frames: [s.idle_1_left, s.idle_2_left], changeTime: 500 },
        run: { frames: [s.run_1, s.idle_1], changeTime: 150 },
        runL: { frames: [s.run_1_left, s.idle_1_left], changeTime: 150 },
        duck: { frames: [s.roll_1, s.roll_2, s.roll_3, s.roll_4], changeTime: 50 },
        duckL: { frames: [s.roll_1_left, s.roll_2_left, s.roll_3_left, s.roll_4_left], changeTime: 50 },
        dmg: { frames: [s.dmg_1, s.idle_1], changeTime: 50 },
        dmgL: { frames: [s.dmg_1_left, s.idle_1], changeTime: 50 }
    };
};

class LifeBarComponent extends HTMLComponent {
    onInit(e: ComponentBaseEntity): void {
        super.onInit(e);
        this.show();
    }
    onUpdate(e: ComponentBaseEntity, delta: number, gameState?: GameState): void {
        const life = (e as Player).life;
        const bars = Math.floor(life / 10);
        this.el.innerHTML = "";

        for (let i = 0; i < bars; i++) {
            this.el.innerHTML += `<div class="bar"></div>`;
        }
    }
}

class ChargeRender implements IComponent {
    type: ComponentType = "rnd";
    stage: Stage;
    en: boolean = false;
    constructor(stage: Stage, en: boolean = false) {
        this.stage = stage;
        this.en = en;
    }

    onRender(e: ComponentBaseEntity, t: number, c: IVec): void {
        const { p, direction } = e.getComponent<PositionComponent>("pos");
        const charge = (e as Player).fireCharge;

        if (!p) throw new Error("PositionComponent not found");
        const [x, y] = p;

        const ratio = charge.current / charge.max;
        const ctx = this.stage.ctx;
        ctx.beginPath();
        let h = -30 * ratio;
        let w = 3;
        let color = "#187194";

        if (this.en) {
            h = -40 * ratio;
            w = 5;
            color = "#e31937";
        }

        if (direction === -1)
            // ctx.rect(x + c[0] + 4, y + c[1] + 50, 40 * ratio, 2);
            ctx.rect(x + c[0] - 3, y + c[1] + 40, w, h);
        else ctx.rect(x + c[0] + 48, y + c[1] + 40, w, h);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }
}

const fireThrottle = new Throttle(150);
export class Player extends ComponentBaseEntity {
    gs: GameState;
    status: string = "idle";
    speed: number = 200;
    maxRun: number = 300;
    jumpSpeed: number = -300;
    onTheGround: boolean = false;
    fireCharge: Rechargeable = new Rechargeable(1000, 500);
    rollCharge: Rechargeable = new Rechargeable(150, 150);
    rolling: number = 0;
    firing: boolean = false;
    life: number = 100;
    chargeUsage: number = 200;
    eType: string = "Player";
    lives: number = 3;
    onEnd: () => void;
    jumps: number = 0;
    maxJumps: number = 1;
    jumping: boolean = false;
    constructor(gs: GameState, sprite: Sprite, pos: IVec, lives: number, onEnd: () => void) {
        const { stage } = gs;
        super(stage, []);
        const position = new PositionComponent(pos, [0, 0], [400, 400], -1);
        const renderer = new SpriteRenderComponent(sprite, "idle");

        const downListeners = {
            ArrowLeft: () => {
                this.status = "walk-left";
            },
            ArrowRight: () => {
                this.status = "walk-right";
            },
            ArrowUp: () => {
                if (this.jumping) return;
                this.jumping = true;
                this.jump();
            },
            ArrowDown: () => {
                if (this.rollCharge.isFull) {
                    this.rolling = 300;
                    this.duck();
                    this.rollCharge.useAll();
                }
            },
            Shift: () => {
                this.firing = true;
            }
        };
        const upListeners = {
            ArrowLeft: () => {
                this.status = "idle";
            },
            ArrowRight: () => {
                this.status = "idle";
            },
            ArrowUp: () => {
                this.jumping = false;
            },
            Shift: () => {
                this.firing = false;
            }
        };
        this.lives = lives;
        if (lives <= 2) {
            this.chargeUsage = 75;
        }
        if (lives === 1) {
            this.maxJumps = 3;
        }

        const control = new KeyboardControlComponent(downListeners, upListeners);
        const lifeBar = new LifeBarComponent("#life");

        const sound = new SoundComponent(["triangle", "sawtooth", "square"]);
        sound.volume = 0.1;

        const box = new BoxColliderComponent([36, 48], (b: ComponentBaseEntity, c: any) => {});
        box.posModifiers = [8, 0];
        const gravity = new GravityComponent();
        this.gs = gs;
        this.onEnd = onEnd;

        // this.addComponents([
        //     position,
        //     renderer,
        //     control,
        //     box,
        //     gravity,
        //     lifeBar,
        //     new ChargeRender(stage, lives <= 2),
        //     sound
        // ]);

        this.addComponent(position);
        this.addComponent(renderer);
        this.addComponent(control);
        this.addComponent(box);
        this.addComponent(gravity);
        this.addComponent(lifeBar);
        this.addComponent(new ChargeRender(stage, lives <= 2));
        this.addComponent(sound);
    }

    get invulnerable() {
        return this.rolling > 0;
    }
    update(delta: number, gameState?: GameState): void {
        const pos = this.getComponent<PositionComponent>("pos");

        if (pos.p[1] > 800) this.destroy();

        gameState.session.pos = pos.p;

        if (pos.collisionSensors[2]?.d === 0) {
            this.onTheGround = true;
            this.jumps = this.maxJumps;
        } else {
            this.onTheGround = false;
        }

        if (this.rolling > 0) {
            this.rolling -= delta;
        } else {
            this.rollCharge.recharge(delta);
            this._resetBox();
            if (this.status === "walk-left") {
                this.walkL();
            } else if (this.status === "walk-right") {
                this.walkRight();
            } else if (this.status === "duck") {
                this.duck();
            } else if (this.status === "idle") {
                this.stand();
            }
        }

        if (this.firing) {
            fireThrottle.call(delta, () => this.magicBolt());
        } else {
            fireThrottle.update(delta);
            this.fireCharge.recharge(delta);
        }

        super.update(delta, gameState);
    }
    _resetBox() {
        this.rolling = 0;
        this.getComponent<BoxColliderComponent>("coll").posModifiers = [8, 0];
        this.getComponent<SpriteRenderComponent>("rnd").imgPos = [0, 0];
        this.getComponent<BoxColliderComponent>("coll").box = [36, 48];
    }
    walkL() {
        // this.status = "walk-left";
        const pos = this.getComponent<PositionComponent>("pos");
        const rend = this.getComponent<SpriteRenderComponent>("rnd");
        if (rend.cA !== "runL") rend.sAnim("runL");
        let accSpeed = -this.speed;

        const exceeding = Math.abs(pos.v[0] - this.speed) - this.maxRun;
        if (exceeding >= 0) accSpeed = -this.speed + exceeding;

        if (this.onTheGround) pos.accelerate([accSpeed, 0]);
        else {
            pos.accelerate([accSpeed, 0]);
        }
        pos.direction = 1;
    }
    walkRight() {
        // this.status = "walk-right";
        const pos = this.getComponent<PositionComponent>("pos");
        const rend = this.getComponent<SpriteRenderComponent>("rnd");
        if (rend.cA !== "run") rend.sAnim("run");
        let accSpeed = this.speed;

        const exceeding = Math.abs(pos.v[0] + this.speed) - this.maxRun;
        if (exceeding >= 0) accSpeed = this.speed - exceeding;

        if (this.onTheGround) pos.accelerate([accSpeed, 0]);
        else {
            pos.accelerate([accSpeed, 0]);
        }
        pos.direction = -1;
    }

    jump() {
        // this.status = "jump";
        const pos = this.getComponent<PositionComponent>("pos");
        if (this.jumps > 0) {
            this.jumps--;
            pos.v = [pos.v[0], 0];
            pos.accelerate([0, this.jumpSpeed]);
        }
    }
    stand() {
        // this.status = "idle";
        const pos = this.getComponent<PositionComponent>("pos");
        const rend = this.getComponent<SpriteRenderComponent>("rnd");

        if (pos.direction === 1 && rend.cA !== "idleL") rend.sAnim("idleL");
        if (pos.direction === -1 && rend.cA !== "idle") rend.sAnim("idle");

        if (this.onTheGround) {
            pos.v = [0, pos.v[1]];
            pos.a = [0, pos.a[1]];
        } else {
            const a = -pos.v[0] * 0.03;
            pos.a = [a, pos.a[1]];
        }
    }
    duck() {
        // this.status = "crouch";
        const pos = this.getComponent<PositionComponent>("pos");
        const rend = this.getComponent<SpriteRenderComponent>("rnd");
        const d = pos.direction;

        if (d === -1 && rend.cA !== "duck") rend.sAnim("duck");
        else if (d === 1 && rend.cA !== "duckL") rend.sAnim("duckL");
        pos.v = [0, pos.v[1]];
        pos.a = [300 * -pos.direction, pos.a[1]];

        // this.getComponent<PositionComponent>("pos").p = [pos.p[0], pos.p[1] + 4];
        this.getComponent<BoxColliderComponent>("coll").box = [36, 20];
        this.getComponent<BoxColliderComponent>("coll").posModifiers = [0, 28];
        this.getComponent<SpriteRenderComponent>("rnd").imgPos = [0, 8];
    }

    magicBolt() {
        if (this.fireCharge.current < 75 || this.rolling) return;
        const pos = this.getComponent<PositionComponent>("pos");
        const d = pos.direction * -400;

        const start: number = pos.direction === 1 ? pos.p[0] - 5 : pos.p[0] + 32;
        const en = this.lives <= 2;
        const bolt = new MagicBolt(this.gs, [start, pos.p[1] + 25], [d, 0], this.ID, {
            en,
            player: true,
            dmg: en ? 50 : 25
        });
        this.gs.scene.addEntity(bolt);
        this.fireCharge.use(this.chargeUsage);
    }

    destroy(): void {
        super.destroy();
        this.onEnd();
    }

    takeDamage(damage: number) {
        if (this.invulnerable) return;

        const rend = this.getComponent<SpriteRenderComponent>("rnd");
        if (rend.cA !== "dmg") rend.sAnim("dmg");
        this.life -= damage;
        if (this.life <= 0) this.destroy();
        else {
            const music = genMusicSheet(100, [{ n: "G2", d: 2, c: 2 }]);

            this.getComponent<SoundComponent>("snd").play(music);
        }
    }

    // render(t: number, ca?: IVec): void {
    //   super.render(t, ca);
    // }
}

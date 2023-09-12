import "./assets/main.scss";
import { HTMLComponent, MenuComponent } from "./lib/components";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState } from "./lib/gameState";
import { loadingScene } from "./scenes/loadingScene";
import { menuScene } from "./scenes/menuScene";
import { mainScene } from "./scenes/mainScene";
import { getProgress } from "./lib/utils";
import { blu2 } from "./assets/pxImages";

const commands = (gs: GameState) => `<table>
<tr><td>Mana</td><td><img style="border-left:4px solid ${blu2}; display: inline" src="${gs.images["shaman"]["idle_1"].src}" /></td></tr>
<tr><td>Jump</td><td>↑</td></tr>
<tr><td>Double Jump</td><td>↑↑</td></tr>
<tr><td>Move</td><td>← →</td></tr>
<tr><td>Roll</td><td>↓</td></tr>
<tr><td>Magic Bolt</td><td>Shift</td></tr>
<tr><td>Pause</td><td>Esc</td></tr>
</table>`;

class PauseEntity extends ComponentBaseEntity {
    gs: GameState;
    constructor(gs: GameState) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;
        const html = new MenuComponent("#main-menu");

        this.addComponent(html);
    }

    init() {
        const c = [];
        c.push({ class: "menu-item", text: "continue", id: "continue" });
        const comp = this.getComponent<MenuComponent>("menu");
        comp.el.querySelector("ul").innerHTML = c
            .map(c => `<li><button class="${c.class}" id="${c.id}">${c.text}</button></li>`)
            .join("");

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                comp.show();
                this.gs.status = "paused";
                this.gs.stage.canvas.classList.add("paused");
            }
        });

        comp.addListener("#continue", () => {
            this.gs.stage.canvas.classList.remove("paused");
            comp.hide();
            this.gs.status = "running";
        });

        super.init();
        comp.hide();
    }

    btnClick(sel: string, cb: () => void) {
        this.getComponent<MenuComponent>("menu").addListener(sel, cb);
    }
}

const storyContent = (gs: GameState) => {
    return `<div>
<div class="tip_container">
<div class="col_1">
<p>
Year <span class='hl-1'>1215 CE</span>,
the Great Khan lies in front of you, mortally would by an enemy arrow. 
</p>
<p>
Only you, his shaman, can save him from the land of the spirits.
</p>

</div>
<div class="col_2">
${commands(gs)}
</div>
</div>
<div class="tip_container">
<button id="skip">Continue</button>
</div>
</div>`;
};

const endGame = gs => `<div>
<p>
You failed to save the Great Khan after ${getProgress(gs?.session?.pos[0])} steps.
</p>
<p>

<button id="skip">Play Again</button>
</div>`;

const winGame = gs => `<div>
<p>
You completed the journey and saved the Great Khan.
</p>
<p>

<button id="skip">Play Again</button>
</div>`;

const lostLife = (gs: GameState) => {
    const lives = gs.session.lives;
    let msg = "";
    if (lives > 1)
        msg = `The spirits will grant you another chance, gifting you with <span class="hl-1"> increased Magic Power<span>.`;
    else if (lives === 1)
        msg = `The spirits may grant you one last chance, gifting you with <span class="hl-1"> supernatural jump<span>.`;

    return `<div>
  <div class="tip_container fd">
  <p>
  Your journey ended after <span class="hl-1">${getProgress(gs?.session?.pos[0])} steps</span>.
  </p>
  <p>
  ${msg}
  </p>
  </div>
  <div class="tip_container">
  <button id="skip">continue</button>
  </div>
  </div>`;
};

class TutorialEntity extends ComponentBaseEntity {
    gs: GameState;
    onSkip: () => void;
    constructor(gs: GameState, onSkip: () => void) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;
        this.onSkip = onSkip;
        const html = new MenuComponent("#ingame-msg");

        this.addComponent(html);
    }
    setContent(content: string) {
        const comp = this.getComponent<MenuComponent>("menu");
        comp.el.innerHTML = content;
    }

    init() {
        // const c = [];
        // c.push({ class: "menu-item", text: "continue", id: "continue" });
        const comp = this.getComponent<MenuComponent>("menu");
        // comp.el.innerHTML = storyContent;

        comp.addListener("#skip", () => {
            this.gs.stage.canvas.classList.remove("paused");
            comp.hide();
            this.gs.status = "running";
            this.onSkip();
        });

        super.init();

        comp.show();
        this.gs.status = "paused";
        this.gs.stage.canvas.classList.add("paused");
    }

    btnClick(sel: string, cb: () => void) {
        this.getComponent<MenuComponent>("menu").addListener(sel, cb);
    }
}

class Background extends ComponentBaseEntity {
    gs: GameState;

    constructor(gs: GameState) {
        const { stage } = gs;
        super(stage, []);
        this.gs = gs;

        const html = new HTMLComponent("#stage");

        this.addComponent(html);
    }

    update(_: number, gs?: GameState): void {
        gs.stage.canvas.style.backgroundImage = `linear-gradient(0deg, #141729, #313866 30%, #505ba5`;
    }
}

const displayMsg = async (gs: GameState, msgFnc: (gs: GameState) => string, onSkip = () => {}) =>
    new Promise(resolve => {
        const tutorial = new TutorialEntity(gs, () => {
            resolve(null);
            onSkip();
        });

        tutorial.setContent(msgFnc(gs));
        gs.addEntity(tutorial);
    });

(async () => {
    const gs = new GameState();
    gs.session.lives = 3;

    gs.addEntity(new Background(gs));

    gs.scene = loadingScene();
    await gs.runScene();
    gs.scene = menuScene();
    const clicked: string = await gs.runScene();

    gs.status = "running";
    const pause = new PauseEntity(gs);
    gs.addEntity(pause);
    let showTutorial = clicked === "new-game";
    let win = false;
    gs.session.lives = clicked === "infinite-game" ? 1 : 3;

    while (gs.session.lives > 0) {
        gs.scene = mainScene(clicked === "infinite-game");
        setTimeout(async () => {
            if (showTutorial) {
                await displayMsg(gs, storyContent);
                showTutorial = false;
            }
        }, 300);

        const result: any = await gs.runScene();
        if (result?.win) {
            win = true;
            break;
        }
        gs.session.lives--;
        displayMsg(gs, lostLife);
    }
    displayMsg(gs, win ? winGame : endGame, () => window.location.reload());
})();

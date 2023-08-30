import "./assets/main.scss";
import { HTMLComponent, MenuComponent } from "./lib/components";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState } from "./lib/gameState";
import { loadingScene } from "./scenes/loadingScene";
import { menuScene } from "./scenes/menuScene";
import { mainScene } from "./scenes/mainScene";
import { getProgress } from "./lib/utils";

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
  console.log(gs.images["shaman"]);
  return `<div>
<div class="tip_container">
<div class="col_1">
<p>
In the 13th Century, Genghis Khan created the largest contiguous empire in history.
</p>
<p>
Year 1215 CE,<br>
the Great Khan lies mortally would by an enemy arrow. <br> Only you, his shaman, can save him, rescuing his soul from the land of the spirits.
</p>
<p>
</div>
<div class="col_2">




<table>
<tr><td>Magic Energy</td><td><img style="border-left:4px solid #187194; display: inline" src="${gs.images["shaman"]["idle_1"].src}" /></td></tr>
<tr><td>Jump</td><td>↑</td></tr>
<tr><td>Move</td><td>← →</td></tr>
<tr><td>Roll</td><td>↓</td></tr>
<tr><td>Magic Bolt</td><td>Shift</td></tr>
</table>
</p>
</div>
</div>
<div class="tip_container">
<button id="skip">Continue</button>
</div>
</div>`;
};

const endGame = `<div>
<p>
You failed to save the Great Khan.
</p>
<p>

<button id="skip">Play Again</button>
</div>`;

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

class EndgameEntity extends ComponentBaseEntity {
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
      location.reload();
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

  update(delta: number, gs?: GameState): void {
    const [x, y] = gs?.session?.pos || [0, 0];

    // const bgs = [
    //   [800, ["#1520A6", "#0A1172"]],
    //   [400, ["#3944BC", "#1520A6"]],
    //   [0, ["#0492C2", "#3944BC"]],
    //   [-10000, ["#63C5DA", "#0492C2"]],
    // ];

    // bgs.sort((a, b) => (b[0] as number) - (a[0] as number));

    let c1 = ["#141729"];
    // for (let k of bgs) {
    //   const v = k[0] as number;

    //   if (v < y) {
    //     c1 = k[1] as string[];
    //     break;
    //   }
    // }

    // const color = `linear-gradient(${c1.join(",")})`;
    // const color = `liner-gradient(#974ec3, #141729 10%, #313866)`;
    const color = `linear-gradient(0deg, #141729, #313866 30%, #505ba5)`;
    gs.stage.canvas.style.backgroundImage = color;
    // console.log(gs.session);
  }
}

const displayTutorial = async (gs: GameState) =>
  new Promise(resolve => {
    const tutorial = new TutorialEntity(gs, () => {
      resolve(null);
      // gs.removeEntity(tutorial);
    });
    tutorial.setContent(storyContent(gs));
    gs.addEntity(tutorial);
  });

const displayMsg = async (gs: GameState) =>
  new Promise(resolve => {
    const tutorial = new TutorialEntity(gs, () => {
      resolve(null);
      // gs.removeEntity(tutorial);
    });
    const lostLife = `<div>
<p>
You moved ${getProgress(gs.session.pos[0])} steps.
<br>The spirits may help you once more.
</p>
<p>

<button id="skip">continue</button>
</div>`;
    tutorial.setContent(lostLife);
    gs.addEntity(tutorial);
  });

const displayEndGame = async (gs: GameState) =>
  new Promise(resolve => {
    const tutorial = new EndgameEntity(gs, () => {
      resolve(null);
      gs.removeEntity(tutorial);
    });
    tutorial.setContent(endGame);
    gs.addEntity(tutorial);
  });

(async () => {
  const gameState = new GameState();
  gameState.session.lives = 3;

  gameState.addEntity(new Background(gameState));

  gameState.scene = loadingScene();
  await gameState.runScene();

  // await displayTutorial(gameState);

  gameState.scene = menuScene();
  const clicked: string = await gameState.runScene();

  gameState.status = "running";
  const pause = new PauseEntity(gameState);
  gameState.addEntity(pause);
  let showTutorial = clicked === "new-game";

  while (gameState.session.lives > 0) {
    console.log("Running main scene");
    gameState.scene = mainScene();
    setTimeout(async () => {
      if (showTutorial) {
        await displayTutorial(gameState);
        showTutorial = false;
      }
    }, 300);

    await gameState.runScene();
    displayMsg(gameState);
    gameState.session.lives--;
  }
  displayEndGame(gameState);
})();

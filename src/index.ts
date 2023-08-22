import "./assets/main.scss";
import { HTMLComponent, MenuComponent } from "./lib/components";
import { ComponentBaseEntity } from "./lib/entities";
import { GameState } from "./lib/gameState";
import { loadingScene } from "./scenes/loadingScene";
import { menuScene } from "./scenes/menuScene";
import { mainScene } from "./scenes/mainScene";

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

const storyContent = `<div>
<p>
In the 13th Century, Genghis Khan created the largest contiguous empire in history.
</p>
<p>
Year 1215 CE,<br>
the Great Khan lies mortally would by an enemy arrow. <br> Only you, his shaman, can save him, rescuing his soul from the land of the spirits.
</p>
<p>
<strong>Controls</strong>
<ul>
<li>Jump: ↑</li>
<li>move: ← →</li>
<li>roll: ↓</li>
<li>fire: Space</li>
</ul>


</p>
<button id="skip">skip</button>
</div>`;

const lostLife = `<div>
<p>
The spirits may help you once more.
</p>
<p>

<button id="skip">continue</button>
</div>`;

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

const displayTutorial = async (gs: GameState) =>
  new Promise(resolve => {
    const tutorial = new TutorialEntity(gs, () => {
      resolve(null);
      // gs.removeEntity(tutorial);
    });
    tutorial.setContent(storyContent);
    gs.addEntity(tutorial);
  });

const displayMsg = async (gs: GameState) =>
  new Promise(resolve => {
    const tutorial = new TutorialEntity(gs, () => {
      resolve(null);
      // gs.removeEntity(tutorial);
    });
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

  gameState.scene = loadingScene();
  await gameState.runScene();

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

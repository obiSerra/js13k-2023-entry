import { HTMLComponent, MenuComponent } from "../lib/components";
import { IEntity } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";

class Intro extends ComponentBaseEntity {
  constructor(gs: GameState) {
    const { stage } = gs;
    super(stage, []);

    const html = new HTMLComponent("#ingame-msg");

    this.addComponent(html);
  }

  init() {
    const c = [];
    c.push({ class: "menu-item", text: "Start Game", id: "new-game" });
    this.getComponent<MenuComponent>("menu").el.querySelector("ul").innerHTML = c
      .map(c => `<li><button class="${c.class}" id="${c.id}">${c.text}</button></li>`)
      .join("");

    super.init();
  }

  btnClick(sel: string, cb: () => void) {
    this.getComponent<MenuComponent>("menu").addListener(sel, cb);
  }
}

export const introScene = () => {
  return new Scene(
    async (gs: GameState, scene): Promise<any> =>
      new Promise((resolve, reject) => {
        const { stage, gl } = gs;

        const menu = new Intro(gs);

        menu.btnClick("#new-game", () => {
          menu.destroy();
          resolve("new-game");
        });
        scene.addEntity(menu);
      })
  );
};

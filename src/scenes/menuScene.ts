import { MenuComponent } from "../lib/components";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";

class MainMenu extends ComponentBaseEntity {
  constructor(gs: GameState) {
    const { stage } = gs;
    super(stage, []);

    const html = new MenuComponent("#main-menu");

    // this.el.querySelector("#new-game").addEventListener("click", () => {});

    this.addComponent(html);
  }

  init() {
    const c = [
      { class: "menu-item", text: "Story Mode", id: "new-game" },
      { class: "menu-item", text: "Quick Game", id: "quick-game" },
      { class: "menu-item", text: "Infinite Mode", id: "infinite-game" },
    ];

    this.getComponent<MenuComponent>("menu").el.querySelector("ul").innerHTML = c
      .map(c => `<li><button class="${c.class}" id="${c.id}">${c.text}</button></li>`)
      .join("");

    super.init();
  }

  btnClick(sel: string, cb: () => void) {
    this.getComponent<MenuComponent>("menu").addListener(sel, cb);
  }
}

export const menuScene = () => {
  return new Scene(
    async (gs: GameState, scene): Promise<string> =>
      new Promise(resolve => {
        const menu = new MainMenu(gs);
        const els = ["new-game", "quick-game", "infinite-game"];
        els.forEach(e => {
          menu.btnClick(`#${e}`, () => {
            menu.destroy();
            resolve(e);
          });
        });

        scene.addEntity(menu);
      })
  );
};

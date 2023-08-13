import { player } from "../assets/pxImages";
import { HTMLComponent } from "../lib/components";
import { ImagePxsRawMap } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { flipImage, genDrawCharacter, hydrateImage, preRender } from "../lib/rendering";
import { Stage } from "../lib/stage";

const pxImages = [player];

class loadingBar extends ComponentBaseEntity {
  loadedImages: { [key: string]: HTMLImageElement } = {};
  constructor(stage: Stage) {
    const loadingEl = new HTMLComponent("#loading");
    super(stage, [loadingEl]);
  }

  init() {
    super.init();
    const html = this.getComponent<HTMLComponent>("html");
    html.el.innerHTML = "Loading...";
    html.show();
    this.loadedImages = this.loadImages(pxImages);
  }

  loadImages(pxImages: ImagePxsRawMap[]) {
    const images = {};
    const z = 2;
    for (const pxImage of pxImages) {
      for (const img of Object.keys(pxImage)) {
        if (img === "colors") continue;
        const imgR = hydrateImage(pxImage, img);
        const imgL = flipImage(imgR);

        const preR = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgR, z));
        const preL = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgL, z));
        images[img] = preR;
        images[img + "_left"] = preL;
      }
    }
    return images;
  }
  destroy(): void {
    super.destroy();
    const html = this.getComponent<HTMLComponent>("html");
    html.hide();
  }
}

export const loadingScene = onEnd => {
  return new Scene((gs: GameState, scene) => {
    const { stage, gl } = gs;

    const loading = new loadingBar(stage);
    scene.addEntity(loading);

    setTimeout(() => {
      gs.images = loading.loadedImages;

      loading.destroy();
      scene.endScene();
    }, 1000);

    gl.start();
  }, onEnd);
};

import { HTMLComponent } from "../lib/components";
import { ImagePxsRawMap, ImgFnMap } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { GameState, Scene } from "../lib/gameState";
import { flipImage, genDrawCharacter, hydrateImage, preRender } from "../lib/rendering";
import { Stage } from "../lib/stage";
import { multiplyVecScalar } from "../lib/utils";
import { pxImages, staticImages } from "../services/loading";

class LoadingBar extends ComponentBaseEntity {
  loadedImages: { [key: string]: { [key: string]: HTMLImageElement } } = { static: {} };
  constructor(stage: Stage) {
    const loadingEl = new HTMLComponent("#loading");
    super(stage, [loadingEl]);
  }

  init() {
    super.init();
    const html = this.getComponent<HTMLComponent>("html");
    html.el.innerHTML = "Loading...";
    html.show();
    this.loadPxImages(pxImages);
    this.loadImages(staticImages);
  }
  loadImages(imageFnMap: ImgFnMap) {
    const z = 2;
    for (const img of Object.keys(imageFnMap)) {
      const pre = preRender(multiplyVecScalar(imageFnMap[img].d, z), imageFnMap[img].f);
      this.loadedImages["static"][img] = pre;
    }
  }
  loadPxImages(pxImages: [string, number, ImagePxsRawMap][]) {
    for (const r of pxImages) {
      const [name, z, pxImage] = r;

      for (const img of Object.keys(pxImage)) {
        if (img === "colors") continue;
        const imgR = hydrateImage(pxImage, img);
        const imgL = flipImage(imgR);

        const preR = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgR, z));
        const preL = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgL, z));
        if (!this.loadedImages[name]) this.loadedImages[name] = {};
        this.loadedImages[name][img] = preR;
        this.loadedImages[name][img + "_left"] = preL;
      }
    }
  }
  destroy(): void {
    super.destroy();
    const html = this.getComponent<HTMLComponent>("html");
    html.hide();
  }
}

export const loadingScene = () => {
  return new Scene(
    async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene }> =>
      new Promise(resolve => {
        const { stage, gl } = gs;

        const loading = new LoadingBar(stage);
        scene.addEntity(loading);

        setTimeout(() => {
          gs.images = loading.loadedImages;

          loading.destroy();
          resolve({ gs, scene });
        }, 1000);

        gl.start();
      })
  );
};

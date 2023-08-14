import { player } from "../assets/pxImages";
import { HTMLComponent } from "../lib/components";
import { IVec, ImagePxsRawMap, RenderFn } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { flipImage, genDrawCharacter, hydrateImage, preRender } from "../lib/rendering";
import { Stage } from "../lib/stage";
import { multiplyVecScalar } from "../lib/utils";

const pxImages = [player];

const groundBlock: RenderFn = (ctx, pos) => {
  let [x, y] = pos;
  x = Math.round(x);
  y = Math.round(y);
  const w = 32;
  const h = 32;

  ctx.beginPath();
  ctx.rect(x - w, y - h, w, h);
  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.closePath();
};

type ImgFnMap = { [key: string]: { d: IVec; f: RenderFn } };

const staticImages: ImgFnMap = { groundBlock: { d: [32, 32], f: groundBlock } };

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
    this.loadPxImages(pxImages);
    this.loadImages(staticImages);
  }
  loadImages(imageFn: ImgFnMap) {
    const z = 2;
    for (const img of Object.keys(imageFn)) {
      const pre = preRender(multiplyVecScalar(imageFn[img].d, z), imageFn[img].f);
      this.loadedImages[img] = pre;
    }
  }
  loadPxImages(pxImages: ImagePxsRawMap[]) {
    const z = 2;
    for (const pxImage of pxImages) {
      for (const img of Object.keys(pxImage)) {
        if (img === "colors") continue;
        const imgR = hydrateImage(pxImage, img);
        const imgL = flipImage(imgR);

        const preR = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgR, z));
        const preL = preRender([imgR.length * z, imgR[0].length * z], genDrawCharacter(imgL, z));
        this.loadedImages[img] = preR;
        this.loadedImages[img + "_left"] = preL;
      }
    }
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

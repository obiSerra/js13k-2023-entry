import { player } from "../assets/pxImages";
import { HTMLComponent } from "../lib/components";
import { IVec, ImagePxsRawMap, RenderFn } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { colorizeImages, flipImage, genDrawCharacter, hydrateImage, preRender } from "../lib/rendering";
import { Stage } from "../lib/stage";
import { multiplyVecScalar } from "../lib/utils";

const basicEnemyColors = {
  "#2a2203": "white",
  "#f9c4b4": "lightgrey",
  "#1d7ba7": "black",
  "#c22828": "lightgrey",
};

// "#2a2203", "#f9c4b4", "#000000", "#0f0c00", "#1d7ba7", "#c22828", "#4a4a4a"
const pxImages: [string, ImagePxsRawMap][] = [
  ["player", player],
  ["enemy", colorizeImages(basicEnemyColors, player)],
];

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

const bolt: RenderFn = (ctx, pos) => {
  let [x, y] = pos;
  x = Math.round(x);
  y = Math.round(y);
  const w = 6;

  ctx.beginPath();
  ctx.arc(x - w, y - w, w, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
};

type ImgFnMap = { [key: string]: { d: IVec; f: RenderFn } };

const staticImages: ImgFnMap = { groundBlock: { d: [32, 32], f: groundBlock }, bolt: { d: [12, 12], f: bolt } };

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
  loadPxImages(pxImages: [string, ImagePxsRawMap][]) {
    const z = 2;
    for (const r of pxImages) {
      const [name, pxImage] = r;

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

export const loadingScene = onEnd => {
  return new Scene((gs: GameState, scene) => {
    const { stage, gl } = gs;

    const loading = new LoadingBar(stage);
    scene.addEntity(loading);

    setTimeout(() => {
      gs.images = loading.loadedImages;

      loading.destroy();
      scene.endScene();
    }, 1000);

    gl.start();
  }, onEnd);
};

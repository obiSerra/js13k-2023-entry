import { player } from "../assets/pxImages";
import { HTMLComponent } from "../lib/components";
import { IVec, ImagePxsRawMap, RenderFn } from "../lib/contracts";
import { ComponentBaseEntity } from "../lib/entities";
import { Scene, GameState } from "../lib/gameState";
import { colorizeImages, flipImage, genDrawCharacter, hydrateImage, preRender } from "../lib/rendering";
import { Stage } from "../lib/stage";
import { multiplyVecScalar } from "../lib/utils";

const basicEnemyColors = {
  white: ["#2a2203"],
  lightgrey: ["#f9c4b4", "#c22828"],
  black: ["#1d7ba7"],
};

const damagedColors = {
  red: ["#2a2203", "#f9c4b4", "#1d7ba7", "#c22828"],
};

function rotate90Clockwise(a: number[][]) {
  const N = a.length;
  for (let i = 0; i < Math.round(N / 2); i++) {
    for (let j = i; j < N - i - 1; j++) {
      var temp = a[i][j];
      a[i][j] = a[N - 1 - j][i];
      a[N - 1 - j][i] = a[N - 1 - i][N - 1 - j];
      a[N - 1 - i][N - 1 - j] = a[j][N - 1 - i];
      a[j][N - 1 - i] = temp;
    }
  }
}

const rollImage = (img: number[][], t = 1) => {
  const newImg = JSON.parse(JSON.stringify(img));
  for (let i = 0; i < t; i++) rotate90Clockwise(newImg);

  return newImg;
};

const colorizedPlayer = colorizeImages(damagedColors, player);

// "#2a2203", "#f9c4b4", "#000000", "#0f0c00", "#1d7ba7", "#c22828", "#4a4a4a"
const pxImages: [string, ImagePxsRawMap][] = [
  [
    "player",
    {
      ...player,
      roll_1: rollImage(player["duck"], 1),
      roll_2: rollImage(player["duck"], 2),
      roll_3: rollImage(player["duck"], 3),
      dmg_1: colorizedPlayer["stand_1"],
      colors: colorizedPlayer["colors"] as string[],
    },
  ],
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

export const loadingScene = () => {
  return new Scene(
    async (gs: GameState, scene): Promise<{ gs: GameState; scene: Scene }> =>
      new Promise((resolve, reject) => {
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

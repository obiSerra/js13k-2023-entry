import { littleDemonPx, shaman } from "../assets/pxImages";
import { ImagePxsRawMap, RenderFn, ImgFnMap } from "../lib/contracts";
import { colorizeImages } from "../lib/rendering";

const damagedColors = {
  red: [
    "#642209",
    "#e31937",
    "#000000",
    "#f6f4f1",
    "#006f46",
    "#ffe417",
    "#ffffff",
    "#f9f7f5",
    "#3098c1",
    "#187194",
    "#aad1e7",
    "#974ec3",
    "#606060",
    "#313866",
  ],
};

const dmgDemonCol = { red: ["#000000", "#f6f4f1"] };

const boltColor = { red: ["#187194"], pink: ["#aad1e7"], purple: ["#3098c1"] };

const damagedDemon = colorizeImages(dmgDemonCol, littleDemonPx);
const enhancedBolt = colorizeImages(boltColor, shaman);
const damagedShaman = colorizeImages(damagedColors, shaman);

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

// "#2a2203", "#f9c4b4", "#000000", "#0f0c00", "#1d7ba7", "#c22828", "#4a4a4a"

const groundBlock: (c?: string) => RenderFn =
  (color = "#DFA878") =>
  (ctx, pos) => {
    let [x, y] = pos;
    x = Math.round(x);
    y = Math.round(y);
    const w = 32;
    const h = 32;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x - w, y - h, w, 10);
    ctx.rect(x - w, y - 10, w, 10);

    ctx.rect(x - w, y - h, 10, h);
    ctx.rect(x, y - h, 10, h);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
  };

// const background: RenderFn = (ctx, pos) => {
//   ctx.beginPath();
//   for (let i = 0; i < 1000; i += 100) {
//     ctx.rect(0, i, 1000, 100);
//     // ctx.fillStyle = i  200 "#000";
//   }
// }

export const staticImages: ImgFnMap = {
  groundBlock: { d: [32, 32], f: groundBlock() },
  dmgGroundBlock: { d: [32, 32], f: groundBlock("#3e250f") },
};
export const pxImages: [string, number, ImagePxsRawMap][] = [
  ["demon", 2, { ...littleDemonPx, dmg_1: damagedDemon["dem_1"], colors: damagedDemon["colors"] as string[] }],
  [
    "shaman",
    1.5,
    {
      ...shaman,
      dmg_1: damagedShaman["idle_1"],
      roll_2: rollImage(shaman["roll_1"], 1),
      roll_3: rollImage(shaman["roll_1"], 2),
      roll_4: rollImage(shaman["roll_1"], 3),
      colors: damagedShaman["colors"] as string[],
    },
  ],
  [
    "bolt",
    2,
    {
      ...enhancedBolt,
    },
  ],
];

import { blu1, blu2, brown, dmn1, dmn2, rawImgs, white } from "../assets/pxImages";
import { ImagePxsRawMap, RenderFn, ImgFnMap } from "../lib/contracts";
import { colorizeImages } from "../lib/rendering";

const damagedColors = {
    red: [
        brown,
        "#e31937",
        "#000000",
        white,
        "#006f46",
        "#ffe417",
        "#ffffff",
        "#f9f7f5",
        "#3098c1",
        blu2,
        "#aad1e7",
        dmn1,
        "#606060",
        "#313866"
    ]
};

const dmgDemonCol = { red: [white] };

const boltColor = { red: [blu2], pink: ["#aad1e7"], purple: ["#3098c1"] };

const damagedDemon = colorizeImages(dmgDemonCol, rawImgs);
const enhancedBolt = colorizeImages(boltColor, rawImgs);
const damagedShaman = colorizeImages(damagedColors, rawImgs);

let ep = {};
ep[white] = [dmn1];
const enhancedEnemy = colorizeImages(ep, rawImgs);
const enhancedEnemyDmg = colorizeImages(damagedColors, enhancedEnemy);

ep = {};
ep[dmn2] = [dmn1];
const enhancedEnemy2 = colorizeImages(ep, rawImgs);
const enhancedEnemyDmg2 = colorizeImages(damagedColors, enhancedEnemy2);

const a = {};
a[dmn1] = [white];
const b = {};
b[dmn2] = [white];
const enhancedDemon = colorizeImages(a, rawImgs);
const enhancedDemonDmg = colorizeImages({ red: [dmn1] }, enhancedDemon);

const enhancedDemon2 = colorizeImages(b, rawImgs);
const enhancedDemonDmg2 = colorizeImages({ red: [dmn2] }, enhancedDemon2);

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

const endImage: RenderFn = (ctx, pos) => {
    let [x, y] = pos;
    x = Math.round(x);
    y = Math.round(y);
    const w = 32;
    const h = 64;
    ctx.fillStyle = blu1;
    ctx.beginPath();
    ctx.rect(x - w, y - h, w, h);
    ctx.closePath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = blu2;
    ctx.fill();
    ctx.stroke();
};

export const staticImages: ImgFnMap = {
    groundBlock: { d: [32, 32], f: groundBlock() },
    endBlock: { d: [32, 64], f: endImage },
    dmgGroundBlock: { d: [32, 32], f: groundBlock("#3e250f") }
};
export const pxImages: [string, number, ImagePxsRawMap][] = [
    [
        "enemy",
        1.5,
        { ...enhancedEnemy, dmg_1: enhancedEnemyDmg["en_idle_1"], colors: enhancedEnemyDmg["colors"] as string[] }
    ],
    ["enemy2", 1.5, { ...rawImgs, dmg_1: damagedShaman["en_idle_1"], colors: damagedShaman["colors"] as string[] }],
    [
        "enemy3",
        1.5,
        { ...enhancedEnemy2, dmg_1: enhancedEnemyDmg2["en_idle_1"], colors: enhancedEnemyDmg2["colors"] as string[] }
    ],
    ["demon", 1.5, { ...rawImgs, dmg_1: damagedDemon["dem_1"], colors: damagedDemon["colors"] as string[] }],
    [
        "demon2",
        1.5,
        { ...enhancedDemon, dmg_1: enhancedDemonDmg["dem_1"], colors: enhancedDemonDmg["colors"] as string[] }
    ],
    [
        "demon3",
        1.5,
        { ...enhancedDemon2, dmg_1: enhancedDemonDmg2["dem_1"], colors: enhancedDemonDmg2["colors"] as string[] }
    ],
    [
        "shaman",
        1.5,
        {
            ...rawImgs,
            dmg_1: damagedShaman["idle_1"],
            roll_2: rollImage(rawImgs["roll_1"], 1),
            roll_3: rollImage(rawImgs["roll_1"], 2),
            roll_4: rollImage(rawImgs["roll_1"], 3),
            colors: damagedShaman["colors"] as string[]
        }
    ],
    [
        "bolt",
        2,
        {
            ...enhancedBolt
        }
    ],
    ["life", 1, { ...rawImgs, colors: rawImgs["colors"] as string[] }]
];

import { Stage } from "./lib/stage";
import { GameLoop } from "./lib/gameLoop";

import { GameState, Scene } from "./lib/gameState";
import { ComponentBaseEntity } from "./lib/entities";
import { HTMLComponent, MenuComponent } from "./lib/components";
import { loadingScene } from "./scenes/loadingScene";
import { Sprite } from "./lib/contracts";
import { testScene } from "./scenes/testScene";
import "./assets/main.scss";

const gameState = new GameState();

const mainScene = () =>
  testScene(() => {
    alert("Game over");
    gameState.scene = mainScene();
    console.log("Running main scene");
    gameState.runScene();
  });

gameState.scene = loadingScene(() => {
  gameState.scene = mainScene();
  console.log("Running main scene");
  gameState.runScene();
});
mainScene();
console.log("Running main scene");
gameState.runScene();

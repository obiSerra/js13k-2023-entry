import { Stage } from "./lib/stage";
import { GameLoop } from "./lib/gameLoop";
import "./assets/main.scss";
import { GameState, Scene } from "./lib/gameState";
import { ComponentBaseEntity } from "./lib/entities";
import { HTMLComponent, MenuComponent } from "./lib/components";
import { loadingScene } from "./scenes/loadingScene";
import { Sprite } from "./lib/contracts";
import { testScene } from "./scenes/testScene";

const gameState = new GameState();

gameState.scene = loadingScene(() => {
  gameState.scene = testScene(() => {
    console.log("game over");
  });
  console.log("Running main scene");
  gameState.runScene();
});

gameState.runScene();

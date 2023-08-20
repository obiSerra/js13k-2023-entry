import "./assets/main.scss";
import { w } from "./lib/dom";
import { GameState } from "./lib/gameState";
import { loadingScene } from "./scenes/loadingScene";
import { testScene } from "./scenes/testScene";



(async () => {
  const gameState = new GameState();
  gameState.session.lives = 3;

  gameState.scene = loadingScene();
  await gameState.runScene();

  while (gameState.session.lives > 0) {
    console.log("Running main scene");
    gameState.scene = testScene();
    await gameState.runScene();
    gameState.session.lives--;
  }
  alert("Game over");
  location.reload();
})();

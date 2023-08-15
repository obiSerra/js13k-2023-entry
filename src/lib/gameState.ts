import { IEntity, IVec } from "./contracts";
import { GameLoop } from "./gameLoop";
import { Stage } from "./stage";

type SceneContent = (gs: GameState, scene: Scene) => void;

export class Scene {
  content: SceneContent;
  _entities: IEntity[] = [];
  endScene: () => void;

  cameraPos: IVec = [0, 0];

  constructor(content: SceneContent, endScene: () => void) {
    this.content = content;
    this.endScene = endScene;
  }

  run(gameState: GameState) {
    this.content(gameState, this);
  }

  addEntity(e: IEntity) {
    this._entities[e.ID] = e;
    this._entities[e.ID].init();
  }
  removeEntity(e: IEntity) {
    this._entities[e.ID]?.destroy();
    delete this._entities[e.ID];
  }
  getEntities() {
    return Object.values(this._entities);
  }
}

export class GameState {
  stage: Stage;
  gl: GameLoop;
  images: { [key: string]: HTMLImageElement } = {};

  scene: Scene | null = null;

  constructor() {
    this.stage = new Stage();
    this.gl = new GameLoop(this.stage);
  }

  runScene() {
    this.scene?.run(this);
  }
  getImg(key: string) {
    if (!this.images[key]) {
      throw new Error(`Image ${key} not found`);
    }
    return this.images[key];
  }
}

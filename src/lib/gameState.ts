import { IEntity, IVec } from "./contracts";
import { GameLoop } from "./gameLoop";
import { Stage } from "./stage";

type SceneContent = (gs: GameState, scene: Scene) => void;

export class Scene {
  content: SceneContent;
  _entities: IEntity[] = [];

  cameraPos: IVec = [0, 0];

  constructor(content: SceneContent) {
    this.content = content;
  }

  async run(gameState: GameState) {
    return await this.content(gameState, this);
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
  images: { [key: string]: { [key: string]: HTMLImageElement } } = {};
  session: { [key: string]: any } = {};

  scene: Scene | null = null;

  constructor() {
    this.stage = new Stage();
    this.gl = new GameLoop(this.stage);
  }

  runScene() {
    return this.scene?.run(this);
  }
  getImg(key: string) {
    if (!this.images[key]) {
      throw new Error(`Image ${key} not found`);
    }
    return this.images[key];
  }
}

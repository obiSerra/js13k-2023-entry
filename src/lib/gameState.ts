import { IVec } from "./contracts";
import { ComponentBaseEntity } from "./entities";
import { GameLoop } from "./gameLoop";
import { Stage } from "./stage";

type SceneContent = (gs: GameState, scene: Scene) => void;

export class Scene {
  content: SceneContent;
  _entities: ComponentBaseEntity[] = [];

  cameraPos: IVec = [0, 0];

  constructor(content: SceneContent) {
    this.content = content;
  }

  async run<T>(gameState: GameState): Promise<T> {
    return (await this.content(gameState, this)) as T;
  }

  addEntity(e: ComponentBaseEntity) {
    this._entities[e.ID] = e;
    this._entities[e.ID].init();
  }
  removeEntity(e: ComponentBaseEntity) {
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
  status: string = "init";
  _glbEntities: ComponentBaseEntity[] = [];
  scene: Scene | null = null;

  constructor() {
    this.stage = new Stage();
    this.gl = new GameLoop(this.stage);
  }

  async runScene<T>(): Promise<T> {
    return this.scene?.run(this);
  }
  getImg(key: string) {
    if (!this.images[key]) {
      throw new Error(`Image ${key} not found`);
    }
    return this.images[key];
  }

  addEntity(e: ComponentBaseEntity) {
    this._glbEntities[e.ID] = e;
    this._glbEntities[e.ID].init();
  }
  removeEntity(e: ComponentBaseEntity) {
    this._glbEntities[e.ID]?.destroy();
    delete this._glbEntities[e.ID];
  }
  getEntities() {
    return Object.values(this._glbEntities);
  }
}

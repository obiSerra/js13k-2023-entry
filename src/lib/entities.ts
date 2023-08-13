import { GameStateAPI, IComponent, IEntity, IStage, IVec } from "./contracts";

export class ComponentBaseEntity implements IEntity {
  ID: string;
  stage: IStage;
  components: { [key: string]: IComponent };
  hasRender: boolean;

  lastMv: IVec;
  isColliding: boolean;

  constructor(stage: IStage, components: IComponent[]) {
    this.ID = Math.random().toString(36).substr(2, 9);
    this.stage = stage;
    this.components = components.reduce((acc, c) => ({ ...acc, [c.type]: c }), {});
  }

  initComponent(name: string) {
    if (this.components[name].onInit) this.components[name].onInit(this);
  }
  componentList() {
    return Object.keys(this.components).map(k => this.components[k]);
  }
  getComponent<T extends IComponent>(name: string): T {
    return (this.components[name] as T) || null;
  }

  addComponent(c: IComponent) {
    this.components[c.type] = c;
  }

  render(t: number): void {
    this.componentList().forEach(c => {
      if (c.onRender) c.onRender(this, t);
    });
  }
  onUpdateStart?(delta: number, gameState?: GameStateAPI): void {}
  onUpdateEnd?(delta: number, gameState?: GameStateAPI): void {}
  update?(delta: number, gameState?: GameStateAPI): void {
    this?.onUpdateStart(delta, gameState);
    this.componentList().forEach(c => {
      if (c.onUpdate) c.onUpdate(this, delta, gameState);
    });
    this?.onUpdateStart(delta, gameState);
  }
  onCollide(e: IEntity): void {
    throw new Error("Method not implemented.");
  }
  destroy() {
    this.componentList().forEach(c => {
      c?.onTerminate && c?.onTerminate(this);
    });
  }
  init() {
    this.componentList().forEach(c => this.initComponent(c.type));
  }
}

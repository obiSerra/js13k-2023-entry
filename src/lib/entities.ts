import { IComponent, IEntity, IStage, IVec } from "./contracts";
import { GameState } from "./gameState";

export class ComponentBaseEntity implements ComponentBaseEntity {
  ID: string;
  stage: IStage;
  components: { [key: string]: IComponent[] };
  hasRender: boolean;
  eType: string = "";
  lastMv: IVec;
  isColliding: boolean;

  constructor(stage: IStage, components: IComponent[]) {
    this.ID = Math.random().toString(36).substr(2, 9);
    this.stage = stage;
    this.components = components.reduce((acc, c) => ({ ...acc, [c.type]: [c] }), {});
  }

  initComponent(name: string) {
    const self = this;
    this.components[name].forEach(c => {
      if (c.onInit) c.onInit(self);
    });

    // if (this.components[name].onInit) this.components[name].onInit(this);
  }
  componentList() {
    return Object.keys(this.components).map(k => this.components[k]);
  }
  getComponent<T extends IComponent>(name: string): T {
    return (this.components[name] as T[])?.[0] || null;
  }

  addComponent(c: IComponent) {
    if (!this.components[c.type]) this.components[c.type] = [];
    this.components[c.type].push(c);
  }

  render(t: number, ca: IVec = [0, 0]): void {
    this.componentList().forEach(cs => cs.forEach(c => (c.onRender ? c.onRender(this, t, ca) : null)));
  }
  onUpdateStart?(delta: number, gs: GameState): void {}
  onUpdateEnd?(delta: number, gs?: GameState): void {}
  update?(delta: number, gameState?: GameState): void {
    this?.onUpdateStart(delta, gameState);
    this.componentList().forEach(cs => {
      cs.forEach(c => (c.onUpdate ? c.onUpdate(this, delta, gameState) : null));
    });
    this?.onUpdateStart(delta, gameState);
  }
  onCollide(e: ComponentBaseEntity): void {
    throw new Error("Method not implemented.");
  }
  destroy() {
    this.componentList().forEach(cs => cs.forEach(c => c?.onTerminate && c?.onTerminate(this)));
  }
  init() {
    this.componentList().forEach(cs => cs.forEach(c => this.initComponent(c.type)));
  }
}

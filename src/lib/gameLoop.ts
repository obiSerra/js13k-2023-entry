import { IStage } from "./contracts";
import { ra, d } from "./dom";

export type UpdateCb = (delta: number) => void;

export const INIT_ST = "init";
export const RUNNING_ST = "running";
export const PAUSED_ST = "paused";

export class GameLoop {
  uFps = 1000 / 30;

  debugInfo: HTMLElement;
  stage: IStage;
  updateCb: UpdateCb;
  renderCb: UpdateCb;
  startCb: () => void;
  pauseCb: () => void;
  resumeCb: () => void;

  lastRenderCall: number;
  lastUpdateCall: number;
  renderFps: number;
  updateFps: number;
  state: string;
  constructor(stage: IStage) {
    this.state = INIT_ST;
    this.stage = stage;
    this.lastRenderCall = 0;
    this.lastUpdateCall = 0;
    this.renderFps = 0;
    this.updateFps = 0;
    this.debugInfoCreate();
  }
  onStart(startCb: () => void) {
    this.startCb = startCb;
  }
  onPause(pauseCb: () => void) {
    this.pauseCb = pauseCb;
  }
  onResume(resumeCb: () => void) {
    this.resumeCb = resumeCb;
  }

  onUpdate(updateCb: UpdateCb) {
    if (updateCb) this.updateCb = updateCb;
  }

  onRender(onRenderCb: UpdateCb) {
    if (onRenderCb) this.renderCb = onRenderCb;
  }
  start() {
    this.state = RUNNING_ST;
    if (this.startCb) this.startCb();
    this.mainLoop();
  }

  pause() {
    this.state = PAUSED_ST;
    if (this.pauseCb) this.pauseCb();
  }

  resume() {
    this.state = RUNNING_ST;
    if (this.resumeCb) this.resumeCb();
  }

  renderLoop() {
    ra((time: number) => {
      const s = this.stage;
      s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
      const delta = time - this.lastRenderCall;
      this.renderFps = Math.floor(1000 / delta);
      this.renderDebug();
      this.lastRenderCall = time;

      if (this.renderCb) this.renderCb(delta);
      this.renderLoop();
    });
  }

  updateLoop() {
    setTimeout(() => {
      if (this.state === RUNNING_ST) {
        const now = +new Date();

        const delta = now - this.lastUpdateCall;
        this.updateFps = Math.floor(1000 / delta);
        this.lastUpdateCall = now;
        if (this.updateCb) this.updateCb(delta);
      }

      this.updateLoop();
    }, this.uFps);
  }
  mainLoop() {
    this.lastUpdateCall = +new Date();
    this.updateLoop();
    this.renderLoop();
  }

  renderDebug() {
    const dEl = document.querySelector(".debug-info");
    let debugString = this.renderFps.toString() + " rFPS";
    debugString += " /" + this.updateFps.toString() + " uFPS";
    debugString += " (" + (+new Date()).toString() + ")";
    dEl.innerHTML = debugString;
  }

  debugInfoCreate() {
    const debugInfo = d.createElement("div");
    debugInfo.className = "debug-info";
    debugInfo.innerHTML = "Game loop not started yet!";
    d.body.append(debugInfo);
  }
}

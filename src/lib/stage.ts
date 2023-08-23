import { IStage } from "./contracts";
import { d } from "./dom";

export class Stage implements IStage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor() {
    this.canvas = d.querySelector("#stage");

    this.ctx = this.canvas.getContext("2d");

    this.canvas.width = 1200;
    this.canvas.height = 800;
  }
}

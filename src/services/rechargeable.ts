export class Rechargeable {
  max: number;
  current: number;
  constructor(max: number, current: number) {
    this.max = max;
    this.current = current;
  }
  recharge(delta: number) {
    this.current = Math.min(this.current + delta, this.max);
  }
  use(delta: number) {
    this.current = Math.max(this.current - delta, 0);
  }
  useAll() {
    this.current = 0;
  }
  get isFull() {
    return this.current >= this.max;
  }
  get isEmpty() {
    return this.current < this.max;
  }
}

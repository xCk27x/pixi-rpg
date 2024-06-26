import type { Overworld } from './overworld';

type Key = { x: number, y: number };
type Keys = {[key: string]: Key};

export const keyMap = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyD: 'right',
  ArrowRight: 'right',
};
/**
 * Controller class to handle user input
 * ```typescript
 * import { Controller } from 'pixi-ncr-jsr';
 * 
 * const controller = new Controller(world);
 * ```
 * @param world - The Overworld instance to control
 */  
export class Controller {
  world: Overworld;
  keys: Keys = {
    up: { x: 0, y: -1},
    left: { x: -1, y: 0},
    down: { x: 0, y: 1},
    right: { x: 1, y: 0},
  }
  private direction: string = 'down';
  private nextDirection: string[] = [];
  private movingProgressRemaining: number = 0;
  
  constructor(world: Overworld) {
    this.world = world;
    window.addEventListener('keydown', (event) => this.keydownHandler(event), { passive: false });
    window.addEventListener('keyup', (event) => this.keyupHandler(event));
    this.world.app.ticker.add(() => this.tickerHandler());
  }

  tickerHandler() {
    if (this.nextDirection[0] !== undefined && this.movingProgressRemaining <= 0) {
      // spriteSheet direction update
      if (this.nextDirection[0] !== this.direction) {
        this.direction = this.nextDirection[0];
        console.log(this.direction);
        this.world.focusCharacter!.changeAnime(this.direction);
        this.world.focusCharacter!.anim.play();
        // if next step is wall
        const nextStep = this.world.getCharacterNextStep(this.keys[this.direction]);
        if (this.world.walls.has(nextStep)) {
          this.nextDirection.shift();
          return;
        }
      }
      this.movingProgressRemaining = 16;
    }
    
    if (this.movingProgressRemaining > 0) { 
      const dire = this.keys[this.direction];
      this.world.move(dire);
      this.movingProgressRemaining -= 1;
    } else {
      this.direction = 'none';
      this.world.focusCharacter!.anim.gotoAndStop(0);
    }
  }

  keydownHandler(event: KeyboardEvent) {
    console.log('keydown', event.code);
    if (event.repeat) return;
    const key = keyMap[event.code as keyof typeof keyMap];
    if (key && this.nextDirection.indexOf(key) === -1) {
      this.nextDirection.unshift(key);
    }
  }

  keyupHandler(event: KeyboardEvent) {
    console.log('keyup', event.code);
    if (this.nextDirection.length === 0) return;
    const key = keyMap[event.code as keyof typeof keyMap];
    const index = this.nextDirection.indexOf(key);
    if (index === -1) return;
    this.nextDirection.splice(index, 1);
  }

  updatePosition() {
    
  }
}
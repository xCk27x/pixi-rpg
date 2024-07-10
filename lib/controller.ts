import type { Overworld } from './overworld';
import {eventBus} from './eventBus'; // 新增這行

type Key = { x: number, y: number };
type Keys = {[key: string]: Key};

export const keyMap = {
  KeyW: 'up',
  ArrowUp: 'up',
  ScreenUp: 'up',
  KeyA: 'left',
  ArrowLeft: 'left',
  ScreenLeft: 'left',
  KeyS: 'down',
  ArrowDown: 'down',
  ScreenDown: 'down',
  KeyD: 'right',
  ArrowRight: 'right',
  ScreenRight: 'right',
};
// test

// test

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

  private runTimer: number | null = null;
  private isRunning: boolean = false;

  constructor(world: Overworld) {
    this.world = world;
    window.addEventListener('keydown', (event) => this.keydownHandler(event), { passive: false });
    window.addEventListener('keyup', (event) => this.keyupHandler(event));
    // window.addEventListener('click', (event) => this.handleScreenClick(event)); // 新增這行
    eventBus.on('move-start', (direction) => this.startMove(direction));
    eventBus.on('move-stop', (direction) => this.stopMove(direction));

    this.world.app.ticker.add(() => this.tickerHandler());
  }



  
  tickerHandler() {
    if (this.nextDirection[0] !== undefined && this.movingProgressRemaining <= 0) {
      if (this.nextDirection[0] !== this.direction) {
        this.direction = this.nextDirection[0];
        this.world.focusCharacter!.changeAnime(this.direction);
        this.world.focusCharacter!.anim.play();
      }
  
      const nextStep = this.world.getCharacterNextStep(this.keys[this.direction]);
  
      if (this.world.walls.has(nextStep)) {
        console.log('Collision detected at step:', nextStep);
        this.nextDirection.shift();
        return;
      }
  
      this.movingProgressRemaining = 16; 
    }
  
    if (this.movingProgressRemaining > 0) {
      const dire = this.keys[this.direction];
      const stepSize = this.isRunning ? 2 : 1;
      for (let i = 0; i < stepSize; i++) {
        if (this.movingProgressRemaining > 0) {
          this.world.move(dire, 1);
          this.movingProgressRemaining -= 1;
        }
      }
  
      console.log('Current position after move:', Math.floor(this.world.focusCharacterX / this.world.gridSize), Math.floor(this.world.focusCharacterY / this.world.gridSize));
  
      const trigger = this.world.checkTrigger();
      if (trigger) {
        console.log('Trigger activated:', trigger.dialogText);
        eventBus.emit('trigger-dialog', trigger.dialogText);
        trigger.actions.forEach(action => action());
      }
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
      this.startRunTimer();
    }
  }

  keyupHandler(event: KeyboardEvent) {
    console.log('keyup', event.code);
    if (this.nextDirection.length === 0) return;
    const key = keyMap[event.code as keyof typeof keyMap];
    const index = this.nextDirection.indexOf(key);
    if (index === -1) return;
    this.nextDirection.splice(index, 1);
    this.stopRunTimer();
  }

  startMove(direction: string) {
    if (this.nextDirection.indexOf(direction) === -1) {
      this.nextDirection.unshift(direction);
      this.startRunTimer();
    }
  }
  
  stopMove(direction: string) {
    const index = this.nextDirection.indexOf(direction);
    if (index !== -1) {
      this.nextDirection.splice(index, 1);
      this.stopRunTimer();
    }
  }
  

  updatePosition() {
    
  }

  startRunTimer() {
    this.stopRunTimer(); // 确保之前的计时器被清除
    this.runTimer = window.setTimeout(() => {
      this.isRunning = true;
    }, 500);
  }

  stopRunTimer() {
    if (this.runTimer !== null) {
      window.clearTimeout(this.runTimer);
      this.runTimer = null;
    }
    this.isRunning = false;
  }
}

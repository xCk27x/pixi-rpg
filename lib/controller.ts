import type { Overworld } from './overworld';
import eventBus from './eventBus'; // 新增這行

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
  
  constructor(world: Overworld) {
    this.world = world;
    window.addEventListener('keydown', (event) => this.keydownHandler(event), { passive: false });
    window.addEventListener('keyup', (event) => this.keyupHandler(event));
    // window.addEventListener('click', (event) => this.handleScreenClick(event)); // 新增這行
    eventBus.on('move-start', (direction) => this.startMove(direction));
eventBus.on('move-stop', (direction) => this.stopMove(direction));

    this.world.app.ticker.add(() => this.tickerHandler());
  }

  // handleScreenClick(event: MouseEvent) {
  //   const rect = (event.target as HTMLElement).getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;
  //   if (x < rect.width / 3) {
  //     this.move('left');
  //   } else if (x > rect.width * 2 / 3) {
  //     this.move('right');
  //   } else if (y < rect.height / 3) {
  //     this.move('up');
  //   } else if (y > rect.height * 2 / 3) {
  //     this.move('down');
  //   }
  // }
  
  tickerHandler() {
    if (this.nextDirection[0] !== undefined && this.movingProgressRemaining <= 0) {
      // spriteSheet direction update
      if (this.nextDirection[0] !== this.direction) {
        this.direction = this.nextDirection[0];
        this.world.focusCharacter!.changeAnime(this.direction);
        this.world.focusCharacter!.anim.play();
      }
  
      const nextStep = this.world.getCharacterNextStep(this.keys[this.direction]);
      // console.log('Next step:', nextStep);
      // console.log('Current position before move:', this.world.focusCharacterX, this.world.focusCharacterY);
      // console.log('Direction:', this.direction);
      // console.log('Next direction:', this.nextDirection);
  
      if (this.world.walls.has(nextStep)) {
        console.log('Collision detected at step:', nextStep);
        this.nextDirection.shift();
        return;
      }
  
      this.movingProgressRemaining = 16;
    }
  
    if (this.movingProgressRemaining > 0) {
      const dire = this.keys[this.direction];
      this.world.move(dire);
      this.movingProgressRemaining -= 1;
      // 打印当前角色位置
      console.log('Current position after move:', Math.floor(this.world.focusCharacterX / this.world.gridSize), Math.floor(this.world.focusCharacterY / this.world.gridSize));

      // 检查触发器
    const triggerDialog = this.world.checkTrigger();
    if (triggerDialog) {
      console.log('Trigger activated:', triggerDialog);
      // 处理触发对话框
      eventBus.emit('trigger-dialog', triggerDialog); // 使用事件總線發射事件
      this.world.lastTriggerPosition = {
        x: Math.floor(this.world.focusCharacterX / this.world.gridSize),
        y: Math.floor(this.world.focusCharacterY / this.world.gridSize)
      };
    }else{
      this.world.checkDistanceFromLastTrigger();
    }
    } else {
      this.direction = 'none';
      // eventBus.emit('leave-trigger-area');
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

  startMove(direction: string) {
    if (this.nextDirection.indexOf(direction) === -1) {
      this.nextDirection.unshift(direction);
    }
  }
  
  stopMove(direction: string) {
    const index = this.nextDirection.indexOf(direction);
    if (index !== -1) {
      this.nextDirection.splice(index, 1);
    }
  }
  

  updatePosition() {
    
  }
}

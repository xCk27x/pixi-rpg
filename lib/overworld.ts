import { Application, Assets, Sprite, Container } from 'pixi.js@^8.1.5';
import { AnimatedSpritesheet } from './animated_spritesheet';
import wallFormat from './wallformat';
import {eventBus} from './eventBus'; // 导入事件总线

////test
// type Trigger = {
//   dialogText: string | string[];
//   route?: string;
// };

type Trigger = {
  dialogText: string | string[];
  actions: Function[];
};




export class Overworld {
  app!: Application;
  gridSize: number = 16;
  canvas_height: number;
  canvas_width: number;
  lowerMapSprite: Sprite | undefined;
  upperMapSprite: Sprite | undefined;
  characters: AnimatedSpritesheet[] = [];
  focusCharacter: AnimatedSpritesheet | undefined;
  focusCharacterX: number = 0;
  focusCharacterY: number = 0;
  walls: Set<number> = new Set<number>();
  images: Map<number, Sprite> = new Map<number, Sprite>(); // 新增此屬性
  private canvas_id: string;
  private mapContainer!: Container;
  private characterContainer!: Container;
  private mapUpperContainer!: Container;

// 在类定义顶部添加触发器的属性
triggers: Map<number, Trigger> = new Map(); // 管理触发器
lastTriggerPosition: number = 0 // 新增此屬性記錄上次觸發的位置
isDialogActive: boolean = false;



addTrigger(x: number, y: number, dialogText: string | string[], ...actions: Function[]): void {
  const removeTriggerAction = () => this.removeTrigger(x, y);
  // this.triggers.set(wallFormat(x, y), { dialogText, actions: [...actions, removeTriggerAction] });
  this.triggers.set(wallFormat(x, y), { dialogText, actions: [...actions ]});
}

checkTrigger(): { dialogText: string | string[], actions: Function[] } | null {
  const currentPosKey = wallFormat(
    Math.floor(this.focusCharacterX / this.gridSize),
    Math.floor(this.focusCharacterY / this.gridSize)
  );

  if (this.lastTriggerPosition === currentPosKey) return null;  // 如果位置相同，則不觸發對話

  this.lastTriggerPosition = currentPosKey; // 更新最後觸發的位置
  return this.triggers.get(currentPosKey) || null;
}

removeTrigger(x: number, y: number): void {
  const triggerKey = wallFormat(x, y);
  this.triggers.delete(triggerKey);
}




  // constructor(id: string = 'canvas-container', height: number = 240, width: number = 440) {
  //   this.canvas_id = id;
  //   this.canvas_height = height;
  //   this.canvas_width = width;
  //   this.mapContainer = new Container();
  //   this.mapUpperContainer = new Container();
  //   this.canvasInit();
  // }
  constructor(id: string = 'canvas-container', height: number = 160, width: number = 300) {
    this.canvas_id = id;
    this.canvas_height = height;
    this.canvas_width = width;
    this.mapContainer = new Container();
    this.mapUpperContainer = new Container();
    this.canvasInit();
  }

  async canvasInit() {
    const app = new Application();
    this.app = app;
    await app.init({width: this.canvas_width, height: this.canvas_height, backgroundColor: 0xffffff});
    const canvasContainer = document.getElementById(this.canvas_id);
    if (canvasContainer) {
      const canvasEntity = app.canvas;
      canvasEntity.classList.add('canvas-entity');
      canvasContainer.appendChild(canvasEntity);
    } else {
      console.error('Canvas container not found');
      return;
    }
    this.characterContainer = new Container();
    app.stage.addChild(this.mapContainer, this.characterContainer,this.mapUpperContainer);

    this.mapUpperContainer.zIndex = 100000000;

    this.app.stage.sortChildren();
    console.log('Canvas initialized');
  }

  async loadLowerMap(lowerMap: string, pivotX: number = 0, pivotY: number = 0): Promise<Sprite> {
    const texture = await Assets.load(lowerMap);
    this.lowerMapSprite = Sprite.from(texture);
    this.lowerMapSprite.anchor.set(0);
    this.lowerMapSprite.position.set(pivotX * 16, pivotY * 16);
    this.mapContainer.addChild(this.lowerMapSprite);
    console.log('Lower map loaded');
    return this.lowerMapSprite;
  }
  
  async loadUpperMap(upperMap: string, pivotX: number = 0, pivotY: number = 0): Promise<Sprite> {
    const texture = await Assets.load(upperMap);
    this.upperMapSprite = Sprite.from(texture);
    this.upperMapSprite.anchor.set(0);
    this.upperMapSprite.position.set(pivotX * 16, pivotY * 16);
    this.upperMapSprite.zIndex = 100000000;
    this.app.stage.sortChildren();
    this.mapUpperContainer.addChild(this.upperMapSprite);
    this.upperMapSprite.zIndex = 100000000;
    this.app.stage.sortChildren();

    console.log('Upper map loaded');
    return this.upperMapSprite;
  }


  async sortChildren() {
    this.app.stage.sortChildren();
  }

  /**
   * Load a sprite from a json file and add it to the character container
   * 
   * @param sprite - The path to the sprite json file
   * @param focus - Whether the sprite should be focused or not, default is false
   * @param pivotX - The x position of the pivot point, default is the center of the canvas
   * @param pivotY - The y position of the pivot point, default is the center of the canvas
   * 
   * @returns The AnimatedSpritesheet object
   */
  // async loadSprite(sprite: string, focus: boolean = false, pivotX: number = this.canvas_width / 32, pivotY: number = this.canvas_height / 32): Promise<AnimatedSpritesheet> {      
  //   return fetch(sprite)
  //   .then(response => response.json())
  //   .then(async jsonObject => {
  //     const animSprShe = new AnimatedSpritesheet(sprite, jsonObject);
  //     this.characters.push(animSprShe);
  //     if (!pivotX || !pivotY) {
  //       pivotX = 0;
  //       pivotY = 0;
  //     }
  //     await animSprShe.loadAnimSpriteSheet(this.gridSize / 2 + pivotX * 16, pivotY * 16);
  //     if (animSprShe.anim) {
  //       if (focus) {
  //         if (!this.focusCharacter) 
  //           this.app.stage.addChild(animSprShe.anim);
  //         this.focusCharacterX = pivotX;
  //         this.focusCharacterY = pivotY;
  //         this.focusCharacter = animSprShe;
  //       } else {
  //         this.characterContainer.addChild(animSprShe.anim);
  //       }
  //       console.log('Sprite loaded');
  //     }
  //     return animSprShe;
  //   })
  // }

  async loadSprite(sprite: string, focus: boolean = false, pivotX: number = this.canvas_width / 32, pivotY: number = this.canvas_height / 32): Promise<AnimatedSpritesheet> {      
    return fetch(sprite)
      .then(response => response.json())
      .then(async jsonObject => {
        const animSprShe = new AnimatedSpritesheet(sprite, jsonObject);
        this.characters.push(animSprShe);
        if (!pivotX || !pivotY) {
          pivotX = 0;
          pivotY = 0;
        }
        if (focus) {
          // 主角角色，位置设为主角的初始位置
          await animSprShe.loadAnimSpriteSheet(this.gridSize / 2 + pivotX * 16, pivotY * 16);
          if (animSprShe.anim) {
            if (!this.focusCharacter) 
              this.app.stage.addChild(animSprShe.anim);
            this.focusCharacterX = pivotX;
            this.focusCharacterY = pivotY;
            this.focusCharacter = animSprShe;
          }
        } else {
          // 非主角角色，相对于主角位置进行调整
          const adjustedX = this.focusCharacterX + pivotX;
          const adjustedY = this.focusCharacterY + pivotY;
          await animSprShe.loadAnimSpriteSheet(this.gridSize / 2 + adjustedX * 16, adjustedY * 16);
          if (animSprShe.anim) {
            this.characterContainer.addChild(animSprShe.anim);
          }
        }
        console.log('Sprite loaded');
        return animSprShe;
      })
  }
  

  async addImage(imageUrl: string, x: number, y: number): Promise<void> {
    const texture = await Assets.load(imageUrl);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0);
    sprite.position.set((this.focusCharacterX + x) * this.gridSize, (this.focusCharacterY + y) * this.gridSize);
    this.mapContainer.addChild(sprite);
    const positionKey = wallFormat(x, y);
    this.images.set(positionKey, sprite);
    console.log(`Image added at (${x}, ${y})`);
  }

  removeImage(x: number, y: number): void {
    const positionKey = wallFormat(x, y);
    const sprite = this.images.get(positionKey);
    if (sprite) {
      console.log(`Removing image at (${x}, ${y}) with sprite:`, sprite);
      this.mapContainer.removeChild(sprite);
      this.images.delete(positionKey);
      console.log(`Image removed at (${x}, ${y})`);
    } else {
      console.log(`No Image found at (${x}, ${y})`);
    }
  }
  


  move(key: { x: number, y: number }, stepSize: number = 1): void {
    if (this.isDialogActive) {
      // Align the character to the grid before returning
      this.focusCharacterX = Math.floor(this.focusCharacterX / this.gridSize) * this.gridSize;
      this.focusCharacterY = Math.floor(this.focusCharacterY / this.gridSize) * this.gridSize;
      this.mapContainer.x = -this.focusCharacterX;
      this.mapContainer.y = -this.focusCharacterY;
      this.mapUpperContainer.x = -this.focusCharacterX;
      this.mapUpperContainer.y = -this.focusCharacterY;
      this.characterContainer.x = -this.focusCharacterX;
      this.characterContainer.y = -this.focusCharacterY;
      return;
    }
  
    console.log('Moving direction:', key);
    for (let i = 0; i < stepSize; i++) {
      const nextX = this.focusCharacterX + key.x;
      const nextY = this.focusCharacterY + key.y;
      const nextStep = wallFormat(Math.floor(nextX / this.gridSize), Math.floor(nextY / this.gridSize));
  
      if (this.walls.has(nextStep)) {
        console.log('Collision detected at step:', nextStep);
        return;
      }
  
      this.mapContainer.x -= key.x;
      this.mapContainer.y -= key.y;
      this.mapUpperContainer.x -= key.x;
      this.mapUpperContainer.y -= key.y;
      this.characterContainer.x -= key.x;
      this.characterContainer.y -= key.y;
      this.focusCharacterX = nextX;
      this.focusCharacterY = nextY;
    }
    console.log('Current position:', this.focusCharacterX, this.focusCharacterY);
  
    if (!this.isDialogActive) { // 僅在對話框未激活時檢查觸發器
      const trigger = this.checkTrigger();
      if (trigger) {
        console.log('Trigger activated:', trigger.dialogText);
        this.isDialogActive = true;
        eventBus.emit('trigger-dialog', trigger.dialogText);
  
        // 執行所有動作
        trigger.actions.forEach(action => action());
      }
    }
  }
  

  endDialog() {
    this.isDialogActive = false;
  }

  

  /**
   * Add a wall to the overworld
   * 
   * @param x - The x position of the wall
   * @param y - The y position of the wall
   */
  addWall(x:number, y: number): void;
  
  /**
   * Add region of walls to the overworld
   * 
   * @param XYLeftTop - the left top grid of the wall
   * @param XYRightBottom - the right bottom grid of the wall
   */
  addWall(XYLeftTop: [number, number], XYRightBottom: [number, number]): void;
  addWall(XY1: number | [number, number], XY2?: number | [number, number]): void {
    if (typeof XY1 === 'number' && typeof XY2 === 'number') {
      this.walls.add(wallFormat(XY1, XY2));
    } else if (Array.isArray(XY1) && Array.isArray(XY2)) {
      for (let x = XY1[0]; x <= XY2[0]; x++) {
        for (let y = XY1[1]; y <= XY2[1]; y++) {
          console.log(wallFormat(x, y));
          this.walls.add(wallFormat(x, y));
        }
      }
    }
  }

  /**
   * Get the next step of the character
   * 
   * @param key - The key of the direction
   * @returns The next step of the character
   */

  // getCharacterNextStep(key: {x: number, y: number}): number {
  //   const nextStep = wallFormat(this.focusCharacterX / 16 + key.x, this.focusCharacterY / 16 + key.y);
  //   console.log(nextStep);
  //   return nextStep;
  // }

  getCharacterNextStep(key: {x: number, y: number}): number {
    const nextStepX = Math.floor(this.focusCharacterX / this.gridSize) + key.x;
    const nextStepY = Math.floor(this.focusCharacterY / this.gridSize) + key.y;
    const nextStep = wallFormat(nextStepX, nextStepY);
    // console.log(Next step calculated: (${nextStepX}, ${nextStepY}) -> ${nextStep});
    return nextStep;
  }

  moveCharacter(character: AnimatedSpritesheet, deltaX: number, deltaY: number, direction: string) {
    // character.anim.play();
    character.changeAnime(direction);

    const targetX = character.anim.x + deltaX * this.gridSize;
    const targetY = character.anim.y + deltaY * this.gridSize;
    const steps = 16;
    let step = 0;

    const interval = setInterval(() => {
      character.anim.x += deltaX * this.gridSize / steps;
      character.anim.y += deltaY * this.gridSize / steps;
      step += 1;

      if (step === steps) {
        clearInterval(interval);
        // character.anim.stop(); // 停止动画
      }
    }, 1000 / 60); // 60 FPS for smooth animation
  }

  resetLastTriggerPosition() {
    this.lastTriggerPosition = 0;
  }
  // overworld.ts
}

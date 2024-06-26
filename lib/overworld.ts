import { Application, Assets, Sprite, Container, AnimatedSprite } from 'pixi.js';
import { AnimatedSpritesheet } from './animated_spritesheet';
import wallFormat from './wallformat';
import { eventBus } from './eventBus'; // 导入事件总线

type Trigger = {
  dialogText: string;
  route?: string;
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
  private canvas_id: string;
  private mapContainer!: Container;
  private characterContainer!: Container;
  private mapUpperContainer!: Container;

// 在类定义顶部添加触发器的属性
triggers: Map<number, string> = new Map(); // 管理触发器
lastTriggerPosition: { x: number; y: number } | null = null; // 新增此屬性記錄上次觸發的位置




addTrigger(x: number, y: number, dialogText: string): void {
  const triggerKey = wallFormat(x, y);
  this.triggers.set(triggerKey, dialogText);
}

checkTrigger(): string | null {
  const currentPosKey = wallFormat(
    Math.floor(this.focusCharacterX / this.gridSize),
    Math.floor(this.focusCharacterY / this.gridSize)
  );
  return this.triggers.get(currentPosKey) || null;
}


checkDistanceFromLastTrigger() {
  if (!this.lastTriggerPosition) return;

  const currentX = Math.floor(this.focusCharacterX / this.gridSize);
  const currentY = Math.floor(this.focusCharacterY / this.gridSize);
  const distanceX = Math.abs(currentX - this.lastTriggerPosition.x);
  const distanceY = Math.abs(currentY - this.lastTriggerPosition.y);

  if (distanceX > 1 || distanceY > 1) {
    eventBus.emit('leave-trigger-area');
  }
}


  constructor(id: string = 'canvas-container', height: number = 192, width: number = 352) {
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
      await animSprShe.loadAnimSpriteSheet(this.gridSize / 2 + pivotX * 16, pivotY * 16);
      if (animSprShe.anim) {
        if (focus) {
          if (!this.focusCharacter) 
            this.app.stage.addChild(animSprShe.anim);
          this.focusCharacterX = pivotX;
          this.focusCharacterY = pivotY;
          this.focusCharacter = animSprShe;
        } else {
          this.characterContainer.addChild(animSprShe.anim);
        }
        console.log('Sprite loaded');
      }
      return animSprShe;
    })
  }


  move(key: {x: number, y: number}): void {
    console.log('Moving direction:', key);
    this.mapContainer.x -= key.x;
    this.mapContainer.y -= key.y;
    this.mapUpperContainer.x -= key.x;
    this.mapUpperContainer.y -= key.y;
    this.characterContainer.x -= key.x;
    this.characterContainer.y -= key.y;
    this.focusCharacterX += key.x;
    this.focusCharacterY += key.y;
    // 打印当前角色位置
    console.log('Current position after move:', this.focusCharacterX, this.focusCharacterY);

    // 检查触发器
  const triggerDialog = this.checkTrigger();
  if (triggerDialog) {
    console.log('Trigger activated:', triggerDialog);
    eventBus.emit('trigger-dialog', triggerDialog); // 使用事件总线发射事件
  }
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

  // overworld.ts
}

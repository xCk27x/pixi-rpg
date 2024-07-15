// import { Application, Assets, Sprite, Container } from 'npm:pixi.js@^8.1.5';
import { Application, Assets, Sprite, Container } from 'pixi.js';
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
  type: string;
  area?: { x1: number, y1: number, x2: number, y2: number };
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
  
  centerX: number = 0;
  centerY: number = 0;
  walls: Set<number> = new Set<number>();
  images: Map<number, Sprite> = new Map<number, Sprite>(); // 新增此屬性
  canvas_id: string;
  mapContainer!: Container;
  characterContainer!: Container;
  mapUpperContainer!: Container;
  savePositionKey = 'character-position';
// 在类定义顶部添加触发器的属性
  triggers: Map<number, Trigger> = new Map(); // 管理触发器
lastTriggerPosition: number = 0 // 新增此屬性記錄上次觸發的位置
isDialogActive: boolean = false;
currentTriggerType: string | null = null; // 新增此屬性記錄當前觸發的類型


addTrigger(x: number, y: number, type: string, dialogText: string | string[], ...actions: Function[]): void {
  if (!dialogText || (Array.isArray(dialogText) && dialogText.length === 0)) {
    dialogText = [];
  }
  this.triggers.set(wallFormat(x, y), { dialogText, actions, type });
}

addAreaTrigger(x1: number, y1: number, x2: number, y2: number, type: string, dialogText: string | string[], ...actions: Function[]): void {
  const triggerActions = actions;
  if (!dialogText || (Array.isArray(dialogText) && dialogText.length === 0)) {
    dialogText = [];
  }
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      this.triggers.set(wallFormat(x, y), { dialogText, actions: triggerActions, type, area: { x1, y1, x2, y2 } });
    }
  }
}

checkTrigger(): { dialogText: string | string[], actions: Function[], type: string } | null {
  const currentPosKey = wallFormat(
    Math.floor(this.focusCharacterX / this.gridSize),
    Math.floor(this.focusCharacterY / this.gridSize)
  );

  console.log('Current trigger type:', this.currentTriggerType);
  console.log('currentPosKey:', currentPosKey)
  
  const trigger = this.triggers.get(currentPosKey);
 
  if (trigger) {
    console.log('Trigger found:', trigger.type);
    if (trigger.dialogText.length === 0) {
      return { dialogText: [], actions: trigger.actions, type: trigger.type }; // 如果对话框为空或空数组，返回空的对话文本
    }
  }
  
  if (!trigger || (this.lastTriggerPosition === currentPosKey) || (this.currentTriggerType === trigger.type)) {
    // 檢查鄰近格子
    const neighbors = [
      wallFormat(Math.floor(this.focusCharacterX / this.gridSize) + 1, Math.floor(this.focusCharacterY / this.gridSize)),
      wallFormat(Math.floor(this.focusCharacterX / this.gridSize) - 1, Math.floor(this.focusCharacterY / this.gridSize)),
      wallFormat(Math.floor(this.focusCharacterX / this.gridSize), Math.floor(this.focusCharacterY / this.gridSize) + 1),
      wallFormat(Math.floor(this.focusCharacterX / this.gridSize), Math.floor(this.focusCharacterY / this.gridSize) - 1)
    ];
    
    const hasNeighborTrigger = neighbors.some(key => this.triggers.has(key));
    
    if (!hasNeighborTrigger) {
      this.currentTriggerType = null; // 如果周圍沒有觸發器，重置 currentTriggerType
    }
    
    return null;  // 如果位置相同且類型相同，則不觸發對話
  }

  this.lastTriggerPosition = currentPosKey; // 更新最後觸發的位置
  this.currentTriggerType = trigger.type; // 更新當前觸發的類型
  
  return trigger;
}

removeTrigger(x: number, y: number): void {
  const triggerKey = wallFormat(x, y);
  this.triggers.delete(triggerKey);
}

removeTriggersByType(type: string): void {
  const keysToRemove: number[] = [];
  this.triggers.forEach((trigger, key) => {
    if (trigger.type === type) {
      keysToRemove.push(key);
    }
  });
  keysToRemove.forEach((key) => {
    this.triggers.delete(key);
  });
}


  constructor(id: string = 'canvas-container', mapName: string, height: number = 160, width: number = 300) {
    this.canvas_id = id;
    this.canvas_height = height;
    this.canvas_width = width;
    this.mapContainer = new Container();
    this.mapUpperContainer = new Container();
    this.savePositionKey = `character-position-${mapName}`; // Use map name to differentiate keys
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
        if (focus) {
          // 主角角色，位置设为主角的初始位置
          this.centerX = pivotX;
          this.centerY = pivotY;
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
    sprite.position.set((this.centerX + x) * this.gridSize, (this.centerY + y) * this.gridSize);
    // sprite.position.set((x) * this.gridSize, (y) * this.gridSize);

    this.mapContainer.addChild(sprite);
    const positionKey = wallFormat(x, y);
    this.images.set(positionKey, sprite);

    // console.log('Images:',(x) * this.gridSize, (y) * this.gridSize) ;
    // console.log('gridSize:', this.gridSize);

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
        if (trigger.dialogText.length > 0) {
          console.log('Trigger activated:', trigger.dialogText);
          this.isDialogActive = true;
          eventBus.emit('trigger-dialog', trigger.dialogText);
        }
        // 執行所有動作
        trigger.actions.forEach(action => action());
      }
    }
    this.saveCharacterPosition();
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
    return nextStep;
  }

  // moveCharacter(character: AnimatedSpritesheet, deltaX: number, deltaY: number, direction: string) {
  //   // character.anim.play();
  //   character.changeAnime(direction);

  //   const targetX = character.anim.x + deltaX * this.gridSize;
  //   const targetY = character.anim.y + deltaY * this.gridSize;
  //   const steps = 16;
  //   let step = 0;

  //   const interval = setInterval(() => {
  //     character.anim.x += deltaX * this.gridSize / steps;
  //     character.anim.y += deltaY * this.gridSize / steps;
  //     step += 1;

  //     if (step === steps) {
  //       clearInterval(interval);
  //     }
  //   }, 1000 / 60); // 60 FPS for smooth animation
  // }

  moveCharacter(
    character: AnimatedSpritesheet,
    deltaX: number,
    deltaY: number,
    direction: string,
    speed: number = 1
  ) {
    // character.anim.play();
    character.changeAnime(direction);

    const targetX = character.anim.x + deltaX * this.gridSize;
    const targetY = character.anim.y + deltaY * this.gridSize;
    const steps = 16 * speed;
    let step = 0;

    const interval = setInterval(() => {
      character.anim.x += (deltaX * this.gridSize) / steps;
      character.anim.y += (deltaY * this.gridSize) / steps;
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

  teleportCharacter(x: number, y: number): void {
    this.focusCharacterX = x * this.gridSize;
    this.focusCharacterY = y * this.gridSize;
    this.mapContainer.x = -this.focusCharacterX;
    this.mapContainer.y = -this.focusCharacterY;
    this.mapUpperContainer.x = -this.focusCharacterX;
    this.mapUpperContainer.y = -this.focusCharacterY;
    this.characterContainer.x = -this.focusCharacterX;
    this.characterContainer.y = -this.focusCharacterY;
    this.saveCharacterPosition(); // Save the new position
  }

  moveCamera(x: number, y: number): void {
    this.mapContainer.x -= x;
    this.mapContainer.y -= y;
    this.mapUpperContainer.x -= x;
    this.mapUpperContainer.y -= y;
    this.characterContainer.x -= x;
    this.characterContainer.y -= y;
  }
    // Method to save character position to localStorage
    saveCharacterPosition() {
      const position = {
        x: this.focusCharacterX,
        y: this.focusCharacterY
      };
      localStorage.setItem(this.savePositionKey, JSON.stringify(position));
    }
  
    // Method to load character position from localStorage
    loadCharacterPosition() {
      const position = localStorage.getItem(this.savePositionKey);
      if (position) {
        const { x, y } = JSON.parse(position);
        this.focusCharacterX = x;
        this.focusCharacterY = y;
        this.mapContainer.x = -x;
        this.mapContainer.y = -y;
        this.mapUpperContainer.x = -x;
        this.mapUpperContainer.y = -y;
        this.characterContainer.x = -x;
        this.characterContainer.y = -y;
      }
    }

    restorePositionOnLoad() {
      this.loadCharacterPosition();
    }
}

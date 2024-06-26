import { Application, Assets, Sprite, Texture, Container, Spritesheet, AnimatedSprite } from 'pixi.js';

export class AnimatedSpritesheet {
  private jsonUrl: string;
  private pngUrl: string;
  private jsonObject: any;
  private spriteSheet: Spritesheet | undefined;
  private focus: boolean = false;
  
  anim!: AnimatedSprite;

  constructor(sprite: string, jsonObject: any) {
    this.jsonUrl = sprite;
    this.pngUrl = this.jsonUrl.replace('.json', '.png');
    this.jsonObject = jsonObject;
  }

  async loadAnimSpriteSheet(pivotX: number = 0, pivotY: number = 0) {
    await Assets.load(this.pngUrl);
    
    this.spriteSheet = new Spritesheet(
      Texture.from(this.pngUrl),
      this.jsonObject
    );
    
    await this.spriteSheet.parse();
    
    this.anim = new AnimatedSprite(this.spriteSheet.animations['down']);
    this.anim.animationSpeed = 0.1666;
    this.anim.anchor.set(0.5);
    this.anim.position.set(pivotX, pivotY);
  }

  changeAnime(animeName: string) {
    const newAnimeList = this.spriteSheet?.animations[animeName];
    if (newAnimeList && this.anim) {
      this.anim.textures = newAnimeList;
      this.anim.play();
    } else {
      console.error(`Animation ${animeName} not found`);
    }
  }
}
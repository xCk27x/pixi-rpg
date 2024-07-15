// dialog.ts
// import { ref } from 'npm:vue@^3.4.21';


// dialog.ts
// dialog.ts
import { ref } from 'vue';

// dialog.ts
// import { ref } from 'vue';

export class Dialog {
  private dialogText = ref<string>('');
  private fullTexts: string[] = []; // 用来保存所有页的文本
  private currentIndex: number = 0; // 当前显示的页索引
  private typingTimeout: any = null; // 用来保存打字效果的定时器
  private isTyping: boolean = false; // 指示当前文字是否正在输出中
  constructor(initialText: string = '') {
    this.dialogText.value = initialText;
  }

  setText(newTexts: string | string[]) {
    if (typeof newTexts === 'string') {
      this.fullTexts = [newTexts];
    } else {
      this.fullTexts = newTexts;
    }
    this.dialogText.value = '';
    this.currentIndex = 0;
    this.stopTyping(); // 确保在开始新的打字效果前，取消任何现有的打字效果
    if (this.fullTexts.length > 0) {
      this.startTyping();
    }
  }

  startTyping() {
    if (this.fullTexts.length === 0) return;

    let index = 0;
    this.isTyping = true;
    const typeNextCharacter = () => {
      if (index < this.fullTexts[this.currentIndex].length) {
        this.dialogText.value += this.fullTexts[this.currentIndex][index];
        index++;
        const randomDelay = Math.floor(Math.random() * 51) + 50; // 随机生成50到100之间的延迟
        this.typingTimeout = setTimeout(typeNextCharacter, randomDelay);
      } else {
        this.stopTyping(); // 确保在打字效果完成后清除定时器
      }
    };
    typeNextCharacter();
  }

  completeTyping() {
    this.stopTyping();
    if (this.fullTexts.length > 0) {
      this.dialogText.value = this.fullTexts[this.currentIndex];
    }
    this.isTyping = false;
  }

  nextPage(): boolean {
    if (this.currentIndex < this.fullTexts.length - 1) {
      this.currentIndex++;
      this.dialogText.value = '';
      this.startTyping();
      return true; // 表示有下一页
    } else {
      this.dialogText.value = ''; // 清空对话框内容
      return false; // 表示没有下一页了
    }
  }

  getText(): string {
    return this.dialogText.value;
  }

  stopTyping(): void {
    clearTimeout(this.typingTimeout);
    this.isTyping = false;
  }

  isTextFullyDisplayed(): boolean {
    return !this.isTyping;
  }

  checkDialog(): boolean {
    console.log("this length",this.fullTexts.length);
    return this.fullTexts.length > 0;
  }
}

export const useDialog: (initialText?: string) => Dialog = (initialText: string = '') => {
  const dialog = new Dialog(initialText);
  return dialog;
};

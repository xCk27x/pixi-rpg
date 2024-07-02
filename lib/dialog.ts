// import { ref } from 'vue';
import { ref } from 'vue';

export class Dialog {
  private dialogText = ref<string>('');
  private fullText = ''; // 用来保存完整文本
  private typingTimeout: any = null; // 用来保存打字效果的定时器

  constructor(initialText: string = '') {
    this.dialogText.value = initialText;
  }

  setText(newText: string) {
    this.fullText = newText;
    this.dialogText.value = '';
    this.stopTyping(); // 确保在开始新的打字效果前，取消任何现有的打字效果
    this.startTyping();
  }

  startTyping() {
    let index = 0;
    const typeNextCharacter = () => {
      if (index < this.fullText.length) {
        this.dialogText.value += this.fullText[index];
        index++;
        const randomDelay = Math.floor(Math.random() * 51) + 50; // 隨機生成50到100之間的延遲
        this.typingTimeout = setTimeout(typeNextCharacter, randomDelay);
      } else {
        this.stopTyping(); // 确保在打字效果完成后清除定时器
      }
    };
    typeNextCharacter();
  }

  getText(): string {
    return this.dialogText.value;
  }

  stopTyping(): void {
    clearTimeout(this.typingTimeout);
  }
}

export const useDialog: (initialText?: string) => Dialog = (initialText: string = '') => {
  const dialog = new Dialog(initialText);
  return dialog;
};




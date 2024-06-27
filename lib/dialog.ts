// lib/dialog.ts
import { ref } from 'vue';

export class Dialog {
  private dialogText = ref<string>('');

  constructor(initialText: string = '') {
    this.dialogText.value = initialText;
  }

  setText(newText: string) {
    this.dialogText.value = newText;
  }

  getText() {
    return this.dialogText.value;
  }
}

export const useDialog = (initialText: string = '') => {
  const dialog = new Dialog(initialText);
  return dialog;
};

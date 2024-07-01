// eventBus.ts
import mitt from 'mitt';
import type { Emitter } from 'mitt';

type Events = {
  'trigger-dialog': string;
  'leave-trigger-area': void; // 添加新的事件類型
  'move-start': string;
  'move-stop': string;
};

export const eventBus: Emitter<Events> = mitt<Events>();

// export default eventBus;

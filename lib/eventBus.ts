// eventBus.ts
import mitt from 'mitt';

type Events = {
  'trigger-dialog': string;
  'leave-trigger-area': void; // 添加新的事件類型
  'move-start': string;
  'move-stop': string;
  'navigate': string;   
};

export const eventBus = mitt<Events>();

// export default eventBus;

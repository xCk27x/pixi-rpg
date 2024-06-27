// eventBus.ts
import mitt from 'mitt';

type Events = {
  'trigger-dialog': string;
//   'leave-trigger-area': void; // 添加新的事件類型
};

const eventBus = mitt<Events>();

export default eventBus;

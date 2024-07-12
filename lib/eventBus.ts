// eventBus.ts
// import mitt from 'npm:mitt@^3.0.1';
// import type { Emitter } from 'npm:mitt@^3.0.1';
import mitt from 'mitt';
import type { Emitter } from 'mitt';


type Events = {
  'trigger-dialog': string | string[];
  'leave-trigger-area': void; // 添加新的事件類型
  'move-start': string;
  'move-stop': string;
  'navigate': string;  

};

export const eventBus: Emitter<Events> = mitt<Events>();

// export default eventBus;

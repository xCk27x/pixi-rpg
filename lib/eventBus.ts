// eventBus.ts
import mitt from 'mitt';

type Events = {
  'trigger-dialog': string;
};

const eventBus = mitt<Events>();

export default eventBus;

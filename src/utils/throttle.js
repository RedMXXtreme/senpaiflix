// throttle.js
import PQueue from 'p-queue';

const proxyQueue = new PQueue({ interval: 1000, intervalCap: 3 }); // max 3 per second
const jikanQueue = new PQueue({ interval: 1000, intervalCap: 2 }); // Jikan's safe threshold

export const useProxyQueue = (fn) => proxyQueue.add(fn);
export const useJikanQueue = (fn) => jikanQueue.add(fn);

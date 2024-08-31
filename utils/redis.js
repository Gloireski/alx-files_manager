import { createClient } from 'redis';
import { promisify } from 'util';


class RedisClient {
  constructor() {
    this._client = createClient();
    this.isClientConnected = true;
    this._client.on('error', (err) => {
      console.log('Redis Client Error', err);
      this.isClientConnected = false;
    });
    this._client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  isAlive() {
    this.isClientConnected;
  }

  async get(k) {
    return await promisify(this._client.get).bind(this._client)(k);
  }

  async set(k, v, dur) {
    await promisify(this._client.setEx).bind(this._client)(k, v, dur);
  }

  async get(k) {
    await promisify(this._client.del).bind(this._client)(k);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
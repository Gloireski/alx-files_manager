import { promisify } from 'util';
import { createClient } from 'redis';

/**
 * Represents a Redis client.
 */
class RedisClient {
  /**
   * Creates a new RedisClient instance.m
   */
  constructor() {
    this.client = createClient({legacyMode: true});

    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.log('Redis Client Error', err.message || err.toString());
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if this client's connection to the Redis server is active.
   * @returns {boolean}
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the value of a given key.
   * @param {String} key The key of the item to retrieve.
   * @returns {String | Object}
   */
  async get(k) {
    return promisify(this.client.GET).bind(this.client)(k);
  }

  /**
   * Stores a key and its value along with an expiration time.
   * @param {String} key The key of the item to store.
   * @param {String | Number | Boolean} value The item to store.
   * @param {Number} duration The expiration time of the item in seconds.
   * @returns {Promise<void>}
   */
  async set(k, v, dur) {
    await promisify(this.client.SETEX)
    .bind(this.client)(k, dur, v);
  }

  /**
   * Removes the value of a given key.
   * @param {String} key The key of the item to remove.
   * @returns {Promise<void>}
   */
  async del(k) {
    await promisify(this.client.DEL).bind(this.client)(k);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;

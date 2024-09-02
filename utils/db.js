// eslint-disable-next-line import/no-import-module-exports
import { MongoClient } from 'mongodb';
// const { MongoClient } = require('mongodb');

/**
 * Represents a mongoDb client
 */
class DBClient {
  /**
   * creates new mongodb instance
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect();
  }

  /**
   * checks if the client conn to mongo is active
   * @returns {boolean}
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   *  returns the number of docs in the collection users
   *  @returns {integer}
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * returns the numbers of docs in the collections files
   * @returns {integer}
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }
}
const dbClient = new DBClient();
module.exports = dbClient;

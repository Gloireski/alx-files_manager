import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Contains the miscellaneous route handlers.
 */
class AppController {
  /**
     * returns if Redis is alive and if the DB is alive using the 2 utils
     * created previously: { "redis": true, "db": true } with a status code 200
     * @param {*} request
     * @param {*} response
     */
  static getStatus(request, response) {
    response.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  /**
   * return the number of users and files in DB: { "users": 12, "files": 1231 }
   * with a status code 200
   * @param {*} request
   * @param {*} response
   */
  static getStats(request, response) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([coutUsers, countFiles]) => {
        response.status(200).json({ users: coutUsers, files: countFiles });
      });
  }
}

export default AppController;
module.exports = AppController;

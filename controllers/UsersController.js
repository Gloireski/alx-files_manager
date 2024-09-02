/* eslint-disable import/no-import-module-exports */
import sha1 from 'sha1';
import dbClient from '../utils/db';

/**
 * Contains the users route handlers.
 */
class UsersController {
  /**
     * should create a new user in DB
     * @param {*} request
     * @param {*} response
     */
  static async postNew(request, response) {
    const email = request.body ? request.body.email : null;
    const password = request.body ? request.body.password : null;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      console.log(request.body);
      return;
    }
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await (await dbClient.client.db().collection('users'))
      .findOne({ email });
    if (user) {
      response.status(400).json({ error: 'Already exist' });
      return;
    }
    const insertInfo = await (await dbClient.client.db().collection('users'))
      .insertOne({ email, password: sha1(password) });
    const userId = insertInfo.insertedId.toString();
    response.status(200).json({ email, id: userId });
  }
}

export default UsersController;
module.exports = UsersController;

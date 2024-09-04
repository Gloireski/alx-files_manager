import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('email sending');

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
      return;
    }
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await (await dbClient.usersCollection()).findOne({ email });

    if (user) {
      response.status(400).json({ error: 'Already exist' });
      return;
    }
    const insertInfo = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    const userId = insertInfo.insertedId.toString();
    userQueue.add({ userId });

    response.status(201).json({ email, id: userId });
  }

  static async getMe(request, response) {
    const token = request.headers['x-token'];

    if (!token) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await (await dbClient.usersCollection())
      .findOne({ _id: new ObjectId(userId) });
    if (!user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    response.status(200).json({ email: user.email, id: user._id.toString() });
  }
}

export default UsersController;

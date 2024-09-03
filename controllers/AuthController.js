import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Contains auth route handlers.
 */
class AuthController {
  /**
   * sign-in the user by generating a new authentication token:
   * @param {*} request
   * @param {*} response
   */
  static async getConnect(request, response) {
    // const { user } = request;
    const authorization = request.headers.authorization || null;
    if (!authorization) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // grab the encoded value
    const encoded = authorization.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString();
    const email = decoded.split(':')[0];
    const password = decoded.split(':')[1];
    const user = await (await dbClient.usersCollection()).findOne({ email });
    if (!user || sha1(password) !== user.password) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    response.status(200).json({ token });
  }

  static async getDisconnect(request, response) {
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
    await redisClient.del(`auth_${token}`);
    response.status(204).send();
  }
}

export default AuthController;

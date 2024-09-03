import { ObjectId } from 'mongodb';
import {
  writeFile, mkdir,
} from 'fs';
import { tmpdir } from 'os';
import { join as joinPath } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const VALID_FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const ROOT_FOLDER_ID = 0;
const DEFAULT_ROOT_FOLDER = 'files_manager';
const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const isValidId = (id) => {
  try {
    ObjectId(id);
  } catch (err) {
    return false;
  }
  return true;
};

/**
 * contains files routes handlers
 */
class FilesController {
  static async postUpload(request, response) {
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
    }

    const name = request.body ? request.body.name : null;
    const type = request.body ? request.body.type : null;
    const parentId = request.body && request.body.parentId ? request.body.parentId : ROOT_FOLDER_ID;
    const isPublic = request.body && request.body.isPublic ? request.body.isPublic : false;
    const data = request.body ? request.body.data : null;
    const base64Data = request.body && request.body.data ? request.body.data : '';

    if (!name) {
      response.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || !Object.values(VALID_FILE_TYPES).includes(type)) {
      response.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== VALID_FILE_TYPES.folder) {
      response.status(400).json({ error: 'Missing data' });
      return;
    }
    if ((parentId !== ROOT_FOLDER_ID) && (parentId !== ROOT_FOLDER_ID.toString())) {
      const file = await (await dbClient.filesCollection())
        .findOne({ _id: new ObjectId(isValidId(parentId) ? parentId : '0') });
      console.log(parentId);

      if (!file) {
        response.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== VALID_FILE_TYPES) {
        response.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);
    // default baseDir == '/tmp/files_manager'
    // or (on Windows) '%USERPROFILE%/AppData/Local/Temp/files_manager';
    const newFile = {
      userId: new ObjectId(user._id),
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? '0'
        : new ObjectId(parentId),
    };
    await mkDirAsync(baseDir, { recursive: true });
    if (type !== VALID_FILE_TYPES.folder) {
      const localPath = joinPath(baseDir, uuidv4());
      await writeFileAsync(localPath, Buffer.from(base64Data, 'base64'));
      newFile.localPath = localPath;
    }
    const insertionInfo = await (await dbClient.filesCollection())
      .insertOne(newFile);
    const fileId = insertionInfo.insertedId.toString();
    response.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? 0
        : parentId,
    });
  }
}
export default FilesController;

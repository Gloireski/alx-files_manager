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
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const isValidId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [48, 57], // 0 - 9
    [97, 102], // a - f
    [65, 70], // A - F
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);

    if (!charRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
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
        .findOne({ _id: new ObjectId(isValidId(parentId) ? parentId : NULL_ID) });

      if (!file) {
        response.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== VALID_FILE_TYPES.folder) {
        response.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);
    // default baseDir == '/tmp/files_manager'
    // or (on Windows) '%USERPROFILE%/AppData/Local/Temp/files_manager';
    // console.log(isPublic);
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

  static async getShow(request, response) {
    const id = request.params ? request.params.id : NULL_ID;
    // console.log('getShow');
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
    const file = await (await dbClient.filesCollection())
      .findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(user._id),
      });
    if (!file) {
      response.status(400).json({ error: 'Not found' });
      return;
    }
    response.status(200).json({
      id,
      userId: user._id,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId === '0'
        ? 0
        : file.parentId.toString(),
    });
  }

  static async getIndex(request, response) {
    // console.log('getIndex');
    const parentId = request.query.parentId || ROOT_FOLDER_ID.toString();
    const page = /\d+/.test((request.query.page || '').toString())
      ? Number.parseInt(request.query.page, 10)
      : 0;

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
    // console.log(parentId);
    const filesFilter = {
      userId: user._id,
      parentId: parentId === ROOT_FOLDER_ID.toString()
        ? parentId
        : new ObjectId(isValidId(parentId) ? parentId : NULL_ID),
    };
    // let files = [];
    const fileList = [];
    const files = await (await dbClient.filesCollection())
      .aggregate([
        { $match: filesFilter },
        { $sort: { _id: -1 } },
        { $skip: page * 20 },
        { $limit: 20 },
        // {
        //   $project: {
        //     _id: 0,
        //     id: '$_id',
        //     userId: '$userId',
        //     name: '$name',
        //     type: '$type',
        //     isPublic: '$isPublic',
        //     parentId: '$parentId',
        //   },
        // },
      ]);
    await files.forEach((doc) => {
      const document = { id: doc._id, ...doc };
      delete document.localPath;
      delete document._id;
      fileList.push(document);
    });

    response.status(200).json(fileList);
  }
}
export default FilesController;

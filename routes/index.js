import UsersController from '../controllers/UsersController';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

/**
 * Binds the routes to the appropriate handler in the
 * given Express application.
 * @param {Express} app The Express application.
 */
const injectRoutes = (server) => {
  server.get('/status', AppController.getStatus);
  server.get('/stats', AppController.getStats);

  server.post('/users', UsersController.postNew);
  server.get('/users/me', UsersController.getMe);

  server.get('/connect', AuthController.getConnect);
  server.get('/disconnect', AuthController.getDisconnect);

  server.post('/files', FilesController.postUpload);
  // server.get('/files/:id', (req, res) => {
  //   console.log(req.params.id);
  // });
  server.get('/files/:id', FilesController.getShow);
  server.get('/files/', FilesController.getIndex);
};

export default injectRoutes;

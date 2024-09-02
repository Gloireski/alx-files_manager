/* eslint-disable import/no-import-module-exports */
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

/**
 * Binds the routes to the appropriate handler in the
 * given Express application.
 * @param {Express} app The Express application.
 */
const mapRoutes = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  app.post('/users', UsersController.postNew);
};

export default mapRoutes;
module.exports = mapRoutes;

import AppController from '../controllers/AppController';

/**
 * Binds the routes to the appropriate handler in the
 * given Express application.
 * @param {Express} app The Express application.
 */
const mapRoutes = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
};

export default mapRoutes;
module.exports = mapRoutes;

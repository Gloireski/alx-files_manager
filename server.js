import injectRoutes from './routes';

const express = require('express');

/**
 * create an express server
 */
const server = express();
const router = express.Router();
const port = process.env.PORT || 5000;
server.use(express.json());
server.use(router);

injectRoutes(server);
server.listen(port, () => {
  console.log(`Server listening on PORT ${port}`);
});

export default server;

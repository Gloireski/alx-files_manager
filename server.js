// eslint-disable-next-line import/no-import-module-exports
import mapRoutes from './routes';

const express = require('express');

/**
 * create an express server
 */
const app = express();
app.use(express.json({ limit: '200mb' }));
const port = process.env.PORT || 5000;

mapRoutes(app);
app.listen(port, () => {
  console.log(`Server listening on PORT ${port}`);
});

export default app;
module.exports = app;

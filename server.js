import mapRoutes from './routes';

const express = require('express');

/**
 * create an express server
 */
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

mapRoutes(app);
app.listen(port, () => {
  console.log(`Server listening on PORT ${port}`);
});

export default app;
module.exports = app;

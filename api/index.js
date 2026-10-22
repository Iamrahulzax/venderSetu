const { app } = require('../server/dist/index.js');

module.exports = (req, res) => {
  return app(req, res);
};

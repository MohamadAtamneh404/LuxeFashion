const app = require('../backend/dist/server').default;

module.exports = (req, res) => {
  // Ensure the request path has /api prefix for Express route matching
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};

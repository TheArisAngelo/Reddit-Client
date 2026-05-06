const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};

// Export both the middleware AND the cache store
cacheMiddleware.del = (key) => cache.del(key);
cacheMiddleware.flush = () => cache.flushAll();

module.exports = cacheMiddleware;

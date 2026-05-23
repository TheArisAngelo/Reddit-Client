const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

const cacheMiddleware = (req, res, next) => {
  // ✅ Scope cache key per user — never share data between accounts
  const userId = req.user?.userId || "anonymous";
  const key = `${userId}:${req.originalUrl}`;

  const cached = cache.get(key);
  if (cached) return res.json(cached);

  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};

cacheMiddleware.del = (key) => cache.del(key);
cacheMiddleware.flush = () => cache.flushAll();

module.exports = cacheMiddleware;

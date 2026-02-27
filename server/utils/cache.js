const NodeCache = require('node-cache');

// TTL = 60 seconds, check period = 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

module.exports = cache;

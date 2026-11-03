// Évite les try/catch répétitifs : toute erreur async est transmise à errorHandler
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

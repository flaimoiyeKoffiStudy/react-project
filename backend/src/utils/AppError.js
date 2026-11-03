// Erreur "métier" : porte un code HTTP et un message affichable au client
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}
module.exports = AppError;

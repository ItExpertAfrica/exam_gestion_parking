/**
 * Middleware centralisé de gestion des erreurs
 * Mappe les erreurs métier vers les codes HTTP correspondants (400, 404, 409, 500)
 */

const { BusinessError } = require('../../metier');

function errorHandler(err, req, res, next) {
  // Erreurs métier héritant de BusinessError
  if (err instanceof BusinessError) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
      type: err.name
    });
  }

  // Erreur de parsing JSON dans Express
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Format JSON invalide dans le corps de la requête.',
      type: 'INVALID_JSON'
    });
  }

  // Autres erreurs inattendues
  console.error('[Erreur Serveur]', err);
  return res.status(500).json({
    success: false,
    error: 'Une erreur interne est survenue sur le serveur.',
    type: 'INTERNAL_SERVER_ERROR'
  });
}

module.exports = {
  errorHandler
};

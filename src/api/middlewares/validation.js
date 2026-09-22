/**
 * Middlewares de validation des requêtes HTTP
 */

const { CATEGORIES } = require('../../metier');

const CATEGORIES_VALIDEES = Object.values(CATEGORIES);

/**
 * Valide les paramètres du body pour une entrée de véhicule : { plaque, categorie }
 */
function validerEntree(req, res, next) {
  const { plaque, categorie } = req.body || {};

  if (!plaque || typeof plaque !== 'string' || plaque.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Le champ "plaque" est obligatoire et ne doit pas être vide.',
      type: 'VALIDATION_ERROR'
    });
  }

  if (!categorie || typeof categorie !== 'string') {
    return res.status(400).json({
      success: false,
      error: `Le champ "categorie" est obligatoire. Valeurs autorisées : ${CATEGORIES_VALIDEES.join(', ')}.`,
      type: 'VALIDATION_ERROR'
    });
  }

  const categorieUpper = categorie.trim().toUpperCase();
  if (!CATEGORIES_VALIDEES.includes(categorieUpper)) {
    return res.status(400).json({
      success: false,
      error: `Catégorie "${categorie}" invalide. Veuillez choisir parmi : ${CATEGORIES_VALIDEES.join(', ')}.`,
      type: 'VALIDATION_ERROR'
    });
  }

  // Normalisation
  req.body.plaque = plaque.trim().toUpperCase();
  req.body.categorie = categorieUpper;

  next();
}

/**
 * Valide les paramètres du body pour une sortie de véhicule : { plaque }
 */
function validerSortie(req, res, next) {
  const { plaque } = req.body || {};

  if (!plaque || typeof plaque !== 'string' || plaque.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Le champ "plaque" est obligatoire pour enregistrer une sortie.',
      type: 'VALIDATION_ERROR'
    });
  }

  req.body.plaque = plaque.trim().toUpperCase();
  next();
}

module.exports = {
  validerEntree,
  validerSortie
};

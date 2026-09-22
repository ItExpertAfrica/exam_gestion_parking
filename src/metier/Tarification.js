/**
 * Module de calcul de tarification du parking ParkEasy
 */

const { ValidationError } = require('./errors');
const { CATEGORIES } = require('./Place');

const TARIFS_HORAIRES = {
  [CATEGORIES.VOITURE]: 500,
  [CATEGORIES.MOTO]: 250,
  [CATEGORIES.PMR]: 500
};

/**
 * Calcule le montant dû pour un stationnement
 * @param {string} categorie - 'VOITURE' | 'MOTO' | 'PMR'
 * @param {Date|string} dateEntree
 * @param {Date|string} dateSortie
 * @returns {number} Montant en Francs CFA (entier)
 */
function calculerTarif(categorie, dateEntree, dateSortie) {
  const tarifHoraire = TARIFS_HORAIRES[categorie];
  if (tarifHoraire === undefined) {
    throw new ValidationError(`Catégorie invalide pour la tarification : ${categorie}`);
  }

  const dEntree = dateEntree instanceof Date ? dateEntree : new Date(dateEntree);
  const dSortie = dateSortie instanceof Date ? dateSortie : new Date(dateSortie);

  if (isNaN(dEntree.getTime()) || isNaN(dSortie.getTime())) {
    throw new ValidationError('Dates d\'entrée ou de sortie invalides.');
  }

  const dureeMs = dSortie.getTime() - dEntree.getTime();
  if (dureeMs < 0) {
    throw new ValidationError('La date de sortie ne peut pas être antérieure à la date d\'entrée.');
  }

  const dureeMinutes = dureeMs / (1000 * 60);

  // Règle 1 : La première demi-heure (<= 30 minutes) est gratuite pour toutes les catégories
  if (dureeMinutes <= 30) {
    return 0;
  }

  // Règle 2 : Au-delà, toute heure entamée est due en totalité (arrondi supérieur)
  const heuresFacturees = Math.ceil(dureeMs / (1000 * 60 * 60));
  const montant = heuresFacturees * tarifHoraire;

  // Montant en F CFA (toujours entier)
  return Math.round(montant);
}

module.exports = {
  TARIFS_HORAIRES,
  calculerTarif
};

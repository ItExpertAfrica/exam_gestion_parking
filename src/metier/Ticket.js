/**
 * Classe représentant un ticket de stationnement
 */

const crypto = require('crypto');

class Ticket {
  /**
   * @param {Object} params
   * @param {string} [params.id] - Identifiant unique du ticket
   * @param {string} params.plaque - Plaque d'immatriculation
   * @param {string} params.categorie - Catégorie du véhicule ('VOITURE', 'MOTO', 'PMR')
   * @param {string} params.placeId - Identifiant de la place attribuée
   * @param {Date|string} [params.dateEntree] - Date et heure d'entrée
   * @param {Date|string|null} [params.dateSortie] - Date et heure de sortie (nullable)
   * @param {number|null} [params.montant] - Montant réglé en F CFA (nullable)
   */
  constructor({
    id = null,
    plaque,
    categorie,
    placeId,
    dateEntree = new Date(),
    dateSortie = null,
    montant = null
  }) {
    this.id = id || `TKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    this.plaque = plaque.trim().toUpperCase();
    this.categorie = categorie;
    this.placeId = placeId;
    this.dateEntree = dateEntree instanceof Date ? dateEntree : new Date(dateEntree);
    this.dateSortie = dateSortie ? (dateSortie instanceof Date ? dateSortie : new Date(dateSortie)) : null;
    this.montant = montant !== null ? Math.round(montant) : null;
  }

  estActif() {
    return this.dateSortie === null;
  }

  cloturer(dateSortie, montant) {
    this.dateSortie = dateSortie instanceof Date ? dateSortie : new Date(dateSortie);
    this.montant = Math.round(montant);
  }

  /**
   * Permet l'évaluation numérique directe du ticket vers son montant si besoin
   */
  valueOf() {
    return this.montant !== null ? this.montant : 0;
  }

  toJSON() {
    return {
      id: this.id,
      plaque: this.plaque,
      categorie: this.categorie,
      placeId: this.placeId,
      dateEntree: this.dateEntree.toISOString(),
      dateSortie: this.dateSortie ? this.dateSortie.toISOString() : null,
      montant: this.montant
    };
  }
}

module.exports = {
  Ticket
};

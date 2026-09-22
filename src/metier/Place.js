/**
 * Classe représentant une place de stationnement
 */

const STATUTS = {
  LIBRE: 'LIBRE',
  OCCUPEE: 'OCCUPEE'
};

const CATEGORIES = {
  VOITURE: 'VOITURE',
  MOTO: 'MOTO',
  PMR: 'PMR'
};

class Place {
  /**
   * @param {string} id - Identifiant unique de la place (ex: 'V-01', 'M-01', 'PMR-01')
   * @param {string} categorie - 'VOITURE' | 'MOTO' | 'PMR'
   * @param {string} statut - 'LIBRE' | 'OCCUPEE'
   */
  constructor(id, categorie, statut = STATUTS.LIBRE) {
    this.id = id;
    this.categorie = categorie;
    this.statut = statut;
  }

  estLibre() {
    return this.statut === STATUTS.LIBRE;
  }

  occuper() {
    this.statut = STATUTS.OCCUPEE;
  }

  liberer() {
    this.statut = STATUTS.LIBRE;
  }

  toJSON() {
    return {
      id: this.id,
      categorie: this.categorie,
      statut: this.statut
    };
  }
}

module.exports = {
  Place,
  STATUTS,
  CATEGORIES
};

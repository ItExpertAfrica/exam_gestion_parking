/**
 * Classe principale gérant la logique du parking ParkEasy
 */

const { Place, STATUTS, CATEGORIES } = require('./Place');
const { Ticket } = require('./Ticket');
const { calculerTarif } = require('./Tarification');
const {
  PlaceIndisponibleError,
  VehiculeDejaPresentError,
  VehiculeNonTrouveError,
  ValidationError
} = require('./errors');

class Parking {
  /**
   * @param {Object} [repository=null] - Mécanisme de persistance injecté
   */
  constructor(repository = null) {
    this.repository = repository;
    this.places = [];
    this.tickets = [];

    this._initialiser();
  }

  /**
   * Initialise ou recharge l'état du parking
   * @private
   */
  _initialiser() {
    if (this.repository) {
      const placesStockees = this.repository.chargerPlaces();
      const ticketsStockes = this.repository.chargerTickets();

      if (placesStockees && placesStockees.length > 0) {
        this.places = placesStockees.map(
          p => new Place(p.id, p.categorie, p.statut)
        );
      } else {
        this._creerPlacesParDefaut();
        this.repository.sauvegarderPlaces(this.places);
      }

      if (ticketsStockes && ticketsStockes.length > 0) {
        this.tickets = ticketsStockes.map(t => new Ticket(t));
      }
    } else {
      this._creerPlacesParDefaut();
    }
  }

  /**
   * Crée la répartition des 50 places imposée par le sujet :
   * - 35 VOITURE
   * - 10 MOTO
   * - 5 PMR
   * @private
   */
  _creerPlacesParDefaut() {
    this.places = [];

    // 35 places VOITURE (V-01 à V-35)
    for (let i = 1; i <= 35; i++) {
      const id = `V-${String(i).padStart(2, '0')}`;
      this.places.push(new Place(id, CATEGORIES.VOITURE, STATUTS.LIBRE));
    }

    // 10 places MOTO (M-01 à M-10)
    for (let i = 1; i <= 10; i++) {
      const id = `M-${String(i).padStart(2, '0')}`;
      this.places.push(new Place(id, CATEGORIES.MOTO, STATUTS.LIBRE));
    }

    // 5 places PMR (PMR-01 à PMR-05)
    for (let i = 1; i <= 5; i++) {
      const id = `PMR-${String(i).padStart(2, '0')}`;
      this.places.push(new Place(id, CATEGORIES.PMR, STATUTS.LIBRE));
    }
  }

  /**
   * Enregistre l'entrée d'un véhicule dans le parking
   * @param {string} plaque - Plaque d'immatriculation
   * @param {string} categorie - 'VOITURE' | 'MOTO' | 'PMR'
   * @param {Date|string} [dateEntree=new Date()]
   * @returns {Ticket}
   */
  entrerVehicule(plaque, categorie, dateEntree = new Date()) {
    if (!plaque || typeof plaque !== 'string' || plaque.trim() === '') {
      throw new ValidationError('La plaque d\'immatriculation est obligatoire.');
    }

    const categorieUpper = (categorie || '').trim().toUpperCase();
    if (![CATEGORIES.VOITURE, CATEGORIES.MOTO, CATEGORIES.PMR].includes(categorieUpper)) {
      throw new ValidationError(`Catégorie invalide : ${categorie}. Valeurs autorisées : VOITURE, MOTO, PMR.`);
    }

    const plaqueNorm = plaque.trim().toUpperCase();

    // Règle 1 : Aucun doublon de plaque active
    const ticketActifExistant = this.tickets.find(
      t => t.plaque === plaqueNorm && t.estActif()
    );
    if (ticketActifExistant) {
      throw new VehiculeDejaPresentError(plaqueNorm);
    }

    // Règle 2 : Disponibilité d'une place dans la catégorie
    const placeLibre = this.places.find(
      p => p.categorie === categorieUpper && p.estLibre()
    );
    if (!placeLibre) {
      throw new PlaceIndisponibleError(categorieUpper);
    }

    // Attribution de la place et génération du ticket
    placeLibre.occuper();

    const dEntree = dateEntree instanceof Date ? dateEntree : new Date(dateEntree);
    const ticket = new Ticket({
      plaque: plaqueNorm,
      categorie: categorieUpper,
      placeId: placeLibre.id,
      dateEntree: dEntree
    });

    this.tickets.push(ticket);

    // Persistance immédiate
    if (this.repository) {
      this.repository.sauvegarderTicket(ticket);
      this.repository.sauvegarderPlaces(this.places);
    }

    return ticket;
  }

  /**
   * Clôture le ticket actif d'un véhicule, libère la place et calcule le tarif
   * @param {string} plaque - Plaque d'immatriculation
   * @param {Date|string} [dateSortie=new Date()]
   * @returns {Ticket}
   */
  sortirVehicule(plaque, dateSortie = new Date()) {
    if (!plaque || typeof plaque !== 'string' || plaque.trim() === '') {
      throw new ValidationError('La plaque d\'immatriculation est obligatoire.');
    }

    const plaqueNorm = plaque.trim().toUpperCase();

    // Recherche du ticket actif
    const ticketActif = this.tickets.find(
      t => t.plaque === plaqueNorm && t.estActif()
    );
    if (!ticketActif) {
      throw new VehiculeNonTrouveError(plaqueNorm);
    }

    const dSortie = dateSortie instanceof Date ? dateSortie : new Date(dateSortie);
    const montant = this.calculerTarif(ticketActif.categorie, ticketActif.dateEntree, dSortie);

    ticketActif.cloturer(dSortie, montant);

    // Libération de la place
    const place = this.places.find(p => p.id === ticketActif.placeId);
    if (place) {
      place.liberer();
    }

    // Persistance immédiate
    if (this.repository) {
      this.repository.mettreAJourTicket(ticketActif);
      this.repository.sauvegarderPlaces(this.places);
    }

    return ticketActif;
  }

  /**
   * Calcule le tarif selon la catégorie et la durée
   * @param {string} categorie
   * @param {Date|string} dateEntree
   * @param {Date|string} dateSortie
   * @returns {number} Montant en F CFA (entier)
   */
  calculerTarif(categorie, dateEntree, dateSortie) {
    return calculerTarif(categorie, dateEntree, dateSortie);
  }

  /**
   * Renvoie le nombre de places libres (globalement ou par catégorie)
   * @param {string|null} [categorie=null]
   * @returns {number}
   */
  placesDisponibles(categorie = null) {
    if (categorie) {
      const catUpper = categorie.trim().toUpperCase();
      return this.places.filter(p => p.categorie === catUpper && p.estLibre()).length;
    }
    return this.places.filter(p => p.estLibre()).length;
  }

  /**
   * Renvoie l'historique complet des tickets pour une plaque donnée
   * @param {string} plaque
   * @returns {Ticket[]}
   */
  historiqueVehicule(plaque) {
    if (!plaque || typeof plaque !== 'string') {
      return [];
    }
    const plaqueNorm = plaque.trim().toUpperCase();
    return this.tickets
      .filter(t => t.plaque === plaqueNorm)
      .sort((a, b) => new Date(b.dateEntree) - new Date(a.dateEntree));
  }

  /**
   * Récupère une place par son identifiant
   * @param {string} id
   * @returns {Place|null}
   */
  obtenirPlace(id) {
    return this.places.find(p => p.id === id) || null;
  }

  /**
   * Récupère un ticket par son identifiant
   * @param {string} id
   * @returns {Ticket|null}
   */
  obtenirTicket(id) {
    return this.tickets.find(t => t.id === id) || null;
  }

  /**
   * Renvoie la liste des places (avec filtre optionnel par catégorie)
   * @param {string|null} [categorie=null]
   * @returns {Place[]}
   */
  obtenirPlaces(categorie = null) {
    if (categorie) {
      const catUpper = categorie.trim().toUpperCase();
      return this.places.filter(p => p.categorie === catUpper);
    }
    return [...this.places];
  }

  /**
   * Renvoie les statistiques détaillées du parking pour le dashboard
   */
  statistiques() {
    const stats = {
      totalPlaces: this.places.length,
      totalLibres: this.placesDisponibles(),
      totalOccupees: this.places.length - this.placesDisponibles(),
      categories: {
        VOITURE: {
          total: 35,
          libres: this.placesDisponibles(CATEGORIES.VOITURE),
          occupees: 35 - this.placesDisponibles(CATEGORIES.VOITURE),
          tarifHoraire: 500
        },
        MOTO: {
          total: 10,
          libres: this.placesDisponibles(CATEGORIES.MOTO),
          occupees: 10 - this.placesDisponibles(CATEGORIES.MOTO),
          tarifHoraire: 250
        },
        PMR: {
          total: 5,
          libres: this.placesDisponibles(CATEGORIES.PMR),
          occupees: 5 - this.placesDisponibles(CATEGORIES.PMR),
          tarifHoraire: 500
        }
      }
    };
    return stats;
  }
}

module.exports = {
  Parking
};

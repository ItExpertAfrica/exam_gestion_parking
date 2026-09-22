/**
 * Interface / Classe abstraite définissant le contrat de persistance pour Parking
 */

class ParkingRepositoryInterface {
  /**
   * Sauvegarde la liste complète des places
   * @param {Array<Object>} places
   */
  sauvegarderPlaces(places) {
    throw new Error('La méthode sauvegarderPlaces() doit être implémentée.');
  }

  /**
   * Charge la liste des places persistées
   * @returns {Array<Object>|null}
   */
  chargerPlaces() {
    throw new Error('La méthode chargerPlaces() doit être implémentée.');
  }

  /**
   * Sauvegarde un nouveau ticket
   * @param {Object} ticket
   */
  sauvegarderTicket(ticket) {
    throw new Error('La méthode sauvegarderTicket() doit être implémentée.');
  }

  /**
   * Charge la liste complète des tickets
   * @returns {Array<Object>}
   */
  chargerTickets() {
    throw new Error('La méthode chargerTickets() doit être implémentée.');
  }

  /**
   * Met à jour un ticket existant
   * @param {Object} ticket
   */
  mettreAJourTicket(ticket) {
    throw new Error('La méthode mettreAJourTicket() doit être implémentée.');
  }
}

module.exports = {
  ParkingRepositoryInterface
};

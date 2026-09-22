/**
 * Implémentation en mémoire du repository de parking
 * Idéal pour les tests unitaires (rapide, isolé, sans écriture disque)
 */

const { ParkingRepositoryInterface } = require('./ParkingRepositoryInterface');

class MemoryParkingRepository extends ParkingRepositoryInterface {
  constructor() {
    super();
    this.places = [];
    this.tickets = [];
  }

  sauvegarderPlaces(places) {
    this.places = places.map(p => (typeof p.toJSON === 'function' ? p.toJSON() : { ...p }));
  }

  chargerPlaces() {
    return this.places.map(p => ({ ...p }));
  }

  sauvegarderTicket(ticket) {
    const data = typeof ticket.toJSON === 'function' ? ticket.toJSON() : { ...ticket };
    const index = this.tickets.findIndex(t => t.id === data.id);
    if (index >= 0) {
      this.tickets[index] = data;
    } else {
      this.tickets.push(data);
    }
  }

  chargerTickets() {
    return this.tickets.map(t => ({ ...t }));
  }

  mettreAJourTicket(ticket) {
    this.sauvegarderTicket(ticket);
  }

  reinitialiser() {
    this.places = [];
    this.tickets = [];
  }
}

module.exports = {
  MemoryParkingRepository
};

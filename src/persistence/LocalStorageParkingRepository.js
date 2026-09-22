/**
 * Implémentation du repository avec node-localstorage (Option A du sujet)
 * Persiste les données du parking sous forme de fichiers JSON sur disque
 */

const path = require('path');
const fs = require('fs');
const { LocalStorage } = require('node-localstorage');
const { ParkingRepositoryInterface } = require('./ParkingRepositoryInterface');

const KEY_PLACES = 'parkeasy_places';
const KEY_TICKETS = 'parkeasy_tickets';

class LocalStorageParkingRepository extends ParkingRepositoryInterface {
  /**
   * @param {string} [storagePath] - Chemin du dossier de stockage persistant
   */
  constructor(storagePath = null) {
    super();
    const resolvedPath = storagePath || path.join(__dirname, '../../data/storage');

    // S'assurer que le dossier parent existe
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    this.storage = new LocalStorage(resolvedPath);
  }

  /**
   * Sauvegarde l'ensemble des places en JSON
   * @param {Array<Object>} places
   */
  sauvegarderPlaces(places) {
    const data = places.map(p => (typeof p.toJSON === 'function' ? p.toJSON() : p));
    this.storage.setItem(KEY_PLACES, JSON.stringify(data));
  }

  /**
   * Charge la liste des places persistées
   * @returns {Array<Object>|null}
   */
  chargerPlaces() {
    const raw = this.storage.getItem(KEY_PLACES);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Sauvegarde un nouveau ticket ou le met à jour
   * @param {Object} ticket
   */
  sauvegarderTicket(ticket) {
    const tickets = this.chargerTickets() || [];
    const ticketData = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket;

    const index = tickets.findIndex(t => t.id === ticketData.id);
    if (index >= 0) {
      tickets[index] = ticketData;
    } else {
      tickets.push(ticketData);
    }

    this.storage.setItem(KEY_TICKETS, JSON.stringify(tickets));
  }

  /**
   * Charge l'historique complet des tickets
   * @returns {Array<Object>}
   */
  chargerTickets() {
    const raw = this.storage.getItem(KEY_TICKETS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Met à jour un ticket existant
   * @param {Object} ticket
   */
  mettreAJourTicket(ticket) {
    this.sauvegarderTicket(ticket);
  }

  /**
   * Nettoie le stockage (utile pour réinitialisation manuelle)
   */
  vider() {
    this.storage.removeItem(KEY_PLACES);
    this.storage.removeItem(KEY_TICKETS);
  }
}

module.exports = {
  LocalStorageParkingRepository
};

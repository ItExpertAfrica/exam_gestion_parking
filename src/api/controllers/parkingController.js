/**
 * Contrôleur REST pour la gestion du parking
 * Fait le pont entre les requêtes HTTP et le service métier Parking
 */

const { BusinessError } = require('../../metier');

function createParkingController(parking) {
  return {
    /**
     * POST /api/entrees
     * Enregistre l'entrée d'un véhicule
     */
    enregistrerEntree(req, res, next) {
      try {
        const { plaque, categorie, dateEntree } = req.body;
        const dEntree = dateEntree ? new Date(dateEntree) : undefined;
        const ticket = parking.entrerVehicule(plaque, categorie, dEntree);

        return res.status(201).json({
          success: true,
          message: 'Véhicule enregistré avec succès.',
          ticket: ticket.toJSON()
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/sorties
     * Enregistre la sortie d'un véhicule et renvoie le ticket avec le montant dû
     */
    enregistrerSortie(req, res, next) {
      try {
        const { plaque, dateSortie } = req.body;
        const dSortie = dateSortie ? new Date(dateSortie) : undefined;
        const ticket = parking.sortirVehicule(plaque, dSortie);

        return res.status(200).json({
          success: true,
          message: 'Sortie validée. Ticket clôturé.',
          ticket: ticket.toJSON(),
          montantDu: ticket.montant,
          devise: 'F CFA'
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/places
     * Renvoie l'état des places (filtrable par ?categorie=)
     */
    obtenirEtatPlaces(req, res, next) {
      try {
        const { categorie } = req.query;
        let catFiltre = null;

        if (categorie) {
          catFiltre = categorie.trim().toUpperCase();
        }

        const places = parking.obtenirPlaces(catFiltre);
        const disponibles = parking.placesDisponibles(catFiltre);
        const occupees = places.length - disponibles;

        return res.status(200).json({
          success: true,
          categorieFiltre: catFiltre || 'TOUTES',
          totalPlaces: places.length,
          placesLibres: disponibles,
          placesOccupees: occupees,
          places: places.map(p => p.toJSON())
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/tickets/:id
     * Renvoie le détail d'un ticket par son identifiant
     */
    obtenirTicket(req, res, next) {
      try {
        const { id } = req.params;
        const ticket = parking.obtenirTicket(id);

        if (!ticket) {
          const err = new BusinessError(`Ticket introuvable avec l'identifiant "${id}".`, 404);
          err.name = 'TicketNonTrouveError';
          return next(err);
        }

        return res.status(200).json({
          success: true,
          ticket: ticket.toJSON()
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/vehicules/:plaque/historique
     * Renvoie l'historique des passages d'une plaque
     */
    obtenirHistoriqueVehicule(req, res, next) {
      try {
        const { plaque } = req.params;
        const tickets = parking.historiqueVehicule(plaque);

        return res.status(200).json({
          success: true,
          plaque: plaque.trim().toUpperCase(),
          totalPassages: tickets.length,
          historique: tickets.map(t => t.toJSON())
        });
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = {
  createParkingController
};

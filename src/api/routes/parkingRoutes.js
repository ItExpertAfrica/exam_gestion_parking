/**
 * Routes pour l'API REST de gestion du parking
 */

const express = require('express');
const { createParkingController } = require('../controllers/parkingController');
const { validerEntree, validerSortie } = require('../middlewares/validation');

function createParkingRouter(parking) {
  const router = express.Router();
  const controller = createParkingController(parking);

  // POST /api/entrees - Enregistre l'entrée d'un véhicule ({ plaque, categorie })
  router.post('/entrees', validerEntree, controller.enregistrerEntree);

  // POST /api/sorties - Enregistre la sortie d'un véhicule ({ plaque })
  router.post('/sorties', validerSortie, controller.enregistrerSortie);

  // GET /api/places - Renvoie l'état des places (filtrable par ?categorie=)
  router.get('/places', controller.obtenirEtatPlaces);

  // GET /api/tickets/:id - Renvoie le détail d'un ticket
  router.get('/tickets/:id', controller.obtenirTicket);

  // GET /api/vehicules/:plaque/historique - Renvoie l'historique des passages d'une plaque
  router.get('/vehicules/:plaque/historique', controller.obtenirHistoriqueVehicule);

  return router;
}

module.exports = {
  createParkingRouter
};

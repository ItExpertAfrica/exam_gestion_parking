/**
 * Routes pour l'interface web Handlebars
 */

const express = require('express');
const { CATEGORIES } = require('../metier');

function createWebRouter(parking) {
  const router = express.Router();

  // GET / - Tableau de bord avec statistiques
  router.get('/', (req, res) => {
    const stats = parking.statistiques();
    res.render('dashboard', {
      title: 'Tableau de bord - ParkEasy',
      activeMenu: 'dashboard',
      stats
    });
  });

  // GET /entree - Formulaire d'enregistrement d'une entrée
  router.get('/entree', (req, res) => {
    res.render('entree', {
      title: 'Entrée d\'un véhicule - ParkEasy',
      activeMenu: 'entree',
      categories: [
        { value: CATEGORIES.VOITURE, label: 'VOITURE (500 F CFA / h)' },
        { value: CATEGORIES.MOTO, label: 'MOTO (250 F CFA / h)' },
        { value: CATEGORIES.PMR, label: 'PMR - Mobilité Réduite (500 F CFA / h)' }
      ]
    });
  });

  // POST /entree - Traitement de l'entrée d'un véhicule
  router.post('/entree', (req, res) => {
    const { plaque, categorie } = req.body;
    try {
      const ticket = parking.entrerVehicule(plaque, categorie);
      res.render('entree', {
        title: 'Entrée d\'un véhicule - ParkEasy',
        activeMenu: 'entree',
        categories: [
          { value: CATEGORIES.VOITURE, label: 'VOITURE (500 F CFA / h)' },
          { value: CATEGORIES.MOTO, label: 'MOTO (250 F CFA / h)' },
          { value: CATEGORIES.PMR, label: 'PMR - Mobilité Réduite (500 F CFA / h)' }
        ],
        successMessage: `Véhicule ${ticket.plaque} enregistré avec succès ! Place attribuée : ${ticket.placeId}.`,
        ticket
      });
    } catch (err) {
      res.render('entree', {
        title: 'Entrée d\'un véhicule - ParkEasy',
        activeMenu: 'entree',
        categories: [
          { value: CATEGORIES.VOITURE, label: 'VOITURE (500 F CFA / h)' },
          { value: CATEGORIES.MOTO, label: 'MOTO (250 F CFA / h)' },
          { value: CATEGORIES.PMR, label: 'PMR - Mobilité Réduite (500 F CFA / h)' }
        ],
        errorMessage: err.message,
        formData: { plaque, categorie }
      });
    }
  });

  // GET /sortie - Formulaire de sortie
  router.get('/sortie', (req, res) => {
    res.render('sortie', {
      title: 'Sortie d\'un véhicule - ParkEasy',
      activeMenu: 'sortie'
    });
  });

  // POST /sortie - Traitement de la sortie d'un véhicule
  router.post('/sortie', (req, res) => {
    const { plaque } = req.body;
    try {
      const ticket = parking.sortirVehicule(plaque);
      
      // Calcul de la durée en minutes pour affichage
      const dureeMs = new Date(ticket.dateSortie) - new Date(ticket.dateEntree);
      const dureeMin = Math.round(dureeMs / (1000 * 60));
      const heures = Math.floor(dureeMin / 60);
      const minutes = dureeMin % 60;
      const dureeFormatee = heures > 0 ? `${heures}h ${minutes}min` : `${minutes} min`;

      res.render('sortie', {
        title: 'Sortie d\'un véhicule - ParkEasy',
        activeMenu: 'sortie',
        successMessage: `Sortie confirmée pour le véhicule ${ticket.plaque}. Place ${ticket.placeId} libérée.`,
        ticket,
        dureeFormatee
      });
    } catch (err) {
      res.render('sortie', {
        title: 'Sortie d\'un véhicule - ParkEasy',
        activeMenu: 'sortie',
        errorMessage: err.message,
        formData: { plaque }
      });
    }
  });

  // GET /places - Liste des places
  router.get('/places', (req, res) => {
    const { categorie } = req.query;
    const catFiltre = categorie && categorie !== 'TOUTES' ? categorie.toUpperCase() : null;
    const places = parking.obtenirPlaces(catFiltre);
    const disponibles = parking.placesDisponibles(catFiltre);

    res.render('places', {
      title: 'État des places - ParkEasy',
      activeMenu: 'places',
      places,
      categorieFiltre: catFiltre || 'TOUTES',
      totalPlaces: places.length,
      placesLibres: disponibles,
      placesOccupees: places.length - disponibles
    });
  });

  return router;
}

module.exports = {
  createWebRouter
};

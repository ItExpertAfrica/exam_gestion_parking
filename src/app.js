/**
 * Application principale Express.js - ParkEasy
 * Configure le moteur Handlebars, l'API REST et l'interface opérateur
 */

const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');

const { Parking } = require('./metier');
const { LocalStorageParkingRepository } = require('./persistence');
const { createParkingRouter, errorHandler } = require('./api');
const { createWebRouter } = require('./web/webRoutes');

/**
 * Fabrique d'application Express avec injection du service Parking
 * @param {Parking} parkingInstance
 * @returns {express.Application}
 */
function createApp(parkingInstance) {
  const app = express();

  // Configuration du moteur de templates Handlebars avec helpers personnalisés
  app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    helpers: {
      eq: (a, b) => a === b,
      formatDate: (dateVal) => {
        if (!dateVal) return '-';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '-';
        const jour = String(d.getDate()).padStart(2, '0');
        const mois = String(d.getMonth() + 1).padStart(2, '0');
        const annee = d.getFullYear();
        const heures = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${jour}/${mois}/${annee} à ${heures}:${minutes}`;
      },
      formatMontant: (montant) => {
        if (montant === null || montant === undefined) return '0 F CFA';
        return `${new Intl.NumberFormat('fr-FR').format(montant)} F CFA`;
      },
      statusBadge: (statut) => {
        if (statut === 'LIBRE') {
          return '<span class="badge badge-libre">LIBRE</span>';
        }
        return '<span class="badge badge-occupee">OCCUPÉE</span>';
      }
    }
  }));

  app.set('view engine', 'handlebars');
  app.set('views', path.join(__dirname, 'views'));

  // Middlewares pour le parsing des corps de requête
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Fichiers statiques (CSS, etc.)
  app.use(express.static(path.join(__dirname, '../public')));

  // Montage des routes API REST
  app.use('/api', createParkingRouter(parkingInstance));

  // Montage des routes de l'interface Web
  app.use('/', createWebRouter(parkingInstance));

  // Middleware centralisé de gestion des erreurs
  app.use(errorHandler);

  return app;
}

// Démarrage du serveur en mode direct
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const storagePath = path.join(__dirname, '../data/storage');
  const repository = new LocalStorageParkingRepository(storagePath);
  const parking = new Parking(repository);
  const app = createApp(parking);

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ParkEasy - Système de Gestion de Parking`);
    console.log(` Serveur démarré avec succès sur http://localhost:${PORT}`);
    console.log(` API REST disponible sur http://localhost:${PORT}/api`);
    console.log(` Persistance activée dans ${storagePath}`);
    console.log(`====================================================`);
  });
}

module.exports = {
  createApp
};

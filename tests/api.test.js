/**
 * Tests d'intégration de l'API REST et de l'interface Web avec Supertest
 */

const request = require('supertest');
const { createApp } = require('../src/app');
const { Parking, CATEGORIES } = require('../src/metier');
const { MemoryParkingRepository } = require('../src/persistence');

describe('Suite de tests d\'intégration - API REST & Web (Supertest)', () => {
  let app;
  let parking;
  let repository;

  beforeEach(() => {
    repository = new MemoryParkingRepository();
    parking = new Parking(repository);
    app = createApp(parking);
  });

  describe('API REST - /api/entrees', () => {
    test('POST /api/entrees : doit enregistrer une entrée et renvoyer 201 Created', async () => {
      const res = await request(app)
        .post('/api/entrees')
        .send({
          plaque: 'DK-7788-ZZ',
          categorie: CATEGORIES.VOITURE
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.plaque).toBe('DK-7788-ZZ');
      expect(res.body.ticket.placeId).toBe('V-01');
    });

    test('POST /api/entrees : doit renvoyer 400 Bad Request si la plaque est absente', async () => {
      const res = await request(app)
        .post('/api/entrees')
        .send({
          categorie: CATEGORIES.VOITURE
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.type).toBe('VALIDATION_ERROR');
    });

    test('POST /api/entrees : doit renvoyer 400 Bad Request si la catégorie est inconnue', async () => {
      const res = await request(app)
        .post('/api/entrees')
        .send({
          plaque: 'DK-0001-AA',
          categorie: 'AVION'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.type).toBe('VALIDATION_ERROR');
    });

    test('POST /api/entrees : doit renvoyer 409 Conflict si la plaque est déjà active', async () => {
      await request(app)
        .post('/api/entrees')
        .send({
          plaque: 'DK-DOUBLON-01',
          categorie: CATEGORIES.VOITURE
        });

      const res = await request(app)
        .post('/api/entrees')
        .send({
          plaque: 'DK-DOUBLON-01',
          categorie: CATEGORIES.VOITURE
        });

      expect(res.status).toBe(409);
      expect(res.body.type).toBe('VehiculeDejaPresentError');
    });
  });

  describe('API REST - /api/sorties', () => {
    test('POST /api/sorties : doit enregistrer une sortie et renvoyer 200 OK avec le montant dû', async () => {
      // 1. Entrée du véhicule
      const entreeRes = await request(app)
        .post('/api/entrees')
        .send({
          plaque: 'DK-SORTIE-01',
          categorie: CATEGORIES.VOITURE,
          dateEntree: new Date('2026-03-01T10:00:00Z')
        });

      expect(entreeRes.status).toBe(201);

      // 2. Sortie 45 minutes plus tard (1 heure facturée à 500 F CFA)
      const sortieRes = await request(app)
        .post('/api/sorties')
        .send({
          plaque: 'DK-SORTIE-01',
          dateSortie: new Date('2026-03-01T10:45:00Z')
        });

      expect(sortieRes.status).toBe(200);
      expect(sortieRes.body.success).toBe(true);
      expect(sortieRes.body.montantDu).toBe(500);
      expect(sortieRes.body.ticket.dateSortie).toBeDefined();
    });

    test('POST /api/sorties : doit renvoyer 404 Not Found si le véhicule n\'est pas dans le parking', async () => {
      const res = await request(app)
        .post('/api/sorties')
        .send({
          plaque: 'INEXISTANT-99'
        });

      expect(res.status).toBe(404);
      expect(res.body.type).toBe('VehiculeNonTrouveError');
    });
  });

  describe('API REST - Consultation des places, tickets et historiques', () => {
    test('GET /api/places : doit renvoyer l\'état global des places', async () => {
      const res = await request(app).get('/api/places');

      expect(res.status).toBe(200);
      expect(res.body.totalPlaces).toBe(50);
      expect(res.body.placesLibres).toBe(50);
      expect(res.body.placesOccupees).toBe(0);
      expect(Array.isArray(res.body.places)).toBe(true);
    });

    test('GET /api/places?categorie=MOTO : doit filtrer les places par catégorie', async () => {
      const res = await request(app).get('/api/places?categorie=MOTO');

      expect(res.status).toBe(200);
      expect(res.body.totalPlaces).toBe(10);
      expect(res.body.places.every(p => p.categorie === 'MOTO')).toBe(true);
    });

    test('GET /api/tickets/:id : doit renvoyer les détails d\'un ticket', async () => {
      const entreeRes = await request(app)
        .post('/api/entrees')
        .send({ plaque: 'DK-TKT-01', categorie: CATEGORIES.VOITURE });

      const ticketId = entreeRes.body.ticket.id;

      const res = await request(app).get(`/api/tickets/${ticketId}`);
      expect(res.status).toBe(200);
      expect(res.body.ticket.id).toBe(ticketId);
    });

    test('GET /api/vehicules/:plaque/historique : doit renvoyer la liste des tickets d\'un véhicule', async () => {
      await request(app)
        .post('/api/entrees')
        .send({ plaque: 'DK-HISTO-88', categorie: CATEGORIES.MOTO });

      const res = await request(app).get('/api/vehicules/DK-HISTO-88/historique');
      expect(res.status).toBe(200);
      expect(res.body.totalPassages).toBe(1);
      expect(res.body.historique[0].plaque).toBe('DK-HISTO-88');
    });
  });

  describe('Interface Web Handlebars (Rendu SSR)', () => {
    test('GET / : doit afficher le tableau de bord en HTML (200 OK)', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Tableau de bord du parking');
      expect(res.text).toContain('Places disponibles');
    });

    test('GET /entree : doit afficher le formulaire d\'entrée (200 OK)', async () => {
      const res = await request(app).get('/entree');
      expect(res.status).toBe(200);
      expect(res.text).toContain("Enregistrement d'une entrée de véhicule");
    });

    test('GET /sortie : doit afficher le formulaire de sortie (200 OK)', async () => {
      const res = await request(app).get('/sortie');
      expect(res.status).toBe(200);
      expect(res.text).toContain("Enregistrement d'une sortie de véhicule");
    });

    test('GET /places : doit afficher la liste des 50 places (200 OK)', async () => {
      const res = await request(app).get('/places');
      expect(res.status).toBe(200);
      expect(res.text).toContain('État détaillé des 50 places de parking');
    });
  });
});

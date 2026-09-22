/**
 * Tests unitaires de la logique métier du Parking ParkEasy
 * Utilise une implémentation en mémoire du Repository pour une isolation totale
 */

const {
  Parking,
  CATEGORIES,
  PlaceIndisponibleError,
  VehiculeDejaPresentError,
  VehiculeNonTrouveError,
  ValidationError
} = require('../src/metier');
const { MemoryParkingRepository } = require('../src/persistence');

describe('Suite de tests unitaires - Système de Gestion ParkEasy', () => {
  let repository;
  let parking;

  beforeEach(() => {
    // Réinitialisation de l'état du parking avant chaque test
    repository = new MemoryParkingRepository();
    parking = new Parking(repository);
  });

  describe('1. Entrée d\'un véhicule', () => {
    test('doit enregistrer l\'entrée d\'un véhicule et lui attribuer une place disponible', () => {
      const dateEntree = new Date('2026-03-01T10:00:00Z');
      const ticket = parking.entrerVehicule('DK-1234-AB', CATEGORIES.VOITURE, dateEntree);

      expect(ticket).toBeDefined();
      expect(ticket.id).toMatch(/^TKT-/);
      expect(ticket.plaque).toBe('DK-1234-AB');
      expect(ticket.categorie).toBe(CATEGORIES.VOITURE);
      expect(ticket.placeId).toBe('V-01');
      expect(ticket.dateEntree).toEqual(dateEntree);
      expect(ticket.dateSortie).toBeNull();
      expect(ticket.montant).toBeNull();

      // Vérifier que la place attribuée est bien occupée
      const place = parking.obtenirPlace('V-01');
      expect(place.estLibre()).toBe(false);
      expect(parking.placesDisponibles(CATEGORIES.VOITURE)).toBe(34);
    });

    test('doit refuser l\'entrée quand la catégorie est complète', () => {
      // Les places PMR sont au nombre de 5 (PMR-01 à PMR-05)
      for (let i = 1; i <= 5; i++) {
        parking.entrerVehicule(`PMR-00${i}`, CATEGORIES.PMR);
      }

      expect(parking.placesDisponibles(CATEGORIES.PMR)).toBe(0);

      // La 6ème entrée doit être refusée
      expect(() => {
        parking.entrerVehicule('PMR-006', CATEGORIES.PMR);
      }).toThrow(PlaceIndisponibleError);
    });

    test('doit refuser l\'entrée si la plaque est déjà présente dans le parking (pas de doublon actif)', () => {
      parking.entrerVehicule('AA-999-ZZ', CATEGORIES.VOITURE);

      expect(() => {
        parking.entrerVehicule('AA-999-ZZ', CATEGORIES.VOITURE);
      }).toThrow(VehiculeDejaPresentError);
    });

    test('doit refuser l\'entrée en cas de données invalides (plaque vide ou catégorie inconnue)', () => {
      expect(() => {
        parking.entrerVehicule('', CATEGORIES.VOITURE);
      }).toThrow(ValidationError);

      expect(() => {
        parking.entrerVehicule('BB-111-CC', 'CAMION');
      }).toThrow(ValidationError);
    });
  });

  describe('2. Calcul des tarifs (Francs CFA)', () => {
    const dateEntree = new Date('2026-03-01T10:00:00Z');

    test('VOITURE : 20 min -> 0 F CFA (première demi-heure gratuite)', () => {
      const dateSortie = new Date('2026-03-01T10:20:00Z');
      const tarif = parking.calculerTarif(CATEGORIES.VOITURE, dateEntree, dateSortie);
      expect(tarif).toBe(0);
    });

    test('VOITURE : exactement 30 min -> 0 F CFA (limite de gratuité)', () => {
      const dateSortie = new Date('2026-03-01T10:30:00Z');
      const tarif = parking.calculerTarif(CATEGORIES.VOITURE, dateEntree, dateSortie);
      expect(tarif).toBe(0);
    });

    test('VOITURE : 45 min -> 500 F CFA (1 heure facturée à 500 F CFA/h)', () => {
      const dateSortie = new Date('2026-03-01T10:45:00Z');
      const tarif = parking.calculerTarif(CATEGORIES.VOITURE, dateEntree, dateSortie);
      expect(tarif).toBe(500);
    });

    test('VOITURE : 2h10 -> 1500 F CFA (3 heures facturées à 500 F CFA/h)', () => {
      const dateSortie = new Date('2026-03-01T12:10:00Z'); // 2h10 = 130 min -> 3h
      const tarif = parking.calculerTarif(CATEGORIES.VOITURE, dateEntree, dateSortie);
      expect(tarif).toBe(1500);
    });

    test('MOTO : 1h15 -> 500 F CFA (2 heures facturées à 250 F CFA/h)', () => {
      const dateSortie = new Date('2026-03-01T11:15:00Z'); // 75 min -> 2h
      const tarif = parking.calculerTarif(CATEGORIES.MOTO, dateEntree, dateSortie);
      expect(tarif).toBe(500);
    });

    test('PMR : 3h05 -> 2000 F CFA (4 heures facturées à 500 F CFA/h)', () => {
      const dateSortie = new Date('2026-03-01T13:05:00Z'); // 185 min -> 4h
      const tarif = parking.calculerTarif(CATEGORIES.PMR, dateEntree, dateSortie);
      expect(tarif).toBe(2000);
    });
  });

  describe('3. Sortie d\'un véhicule', () => {
    test('doit clôturer le ticket, libérer la place et renvoyer le montant dû', () => {
      const dateEntree = new Date('2026-03-01T08:00:00Z');
      const dateSortie = new Date('2026-03-01T08:45:00Z'); // 45 min -> 500 F CFA

      parking.entrerVehicule('SN-4455-TT', CATEGORIES.VOITURE, dateEntree);
      expect(parking.placesDisponibles(CATEGORIES.VOITURE)).toBe(34);

      const ticketSortie = parking.sortirVehicule('SN-4455-TT', dateSortie);

      expect(ticketSortie).toBeDefined();
      expect(ticketSortie.plaque).toBe('SN-4455-TT');
      expect(ticketSortie.dateSortie).toEqual(dateSortie);
      expect(ticketSortie.montant).toBe(500);
      expect(ticketSortie.estActif()).toBe(false);

      // La place attribuée doit être redevenue libre
      const place = parking.obtenirPlace(ticketSortie.placeId);
      expect(place.estLibre()).toBe(true);
      expect(parking.placesDisponibles(CATEGORIES.VOITURE)).toBe(35);
    });

    test('doit refuser la sortie pour une plaque inconnue ou déjà sortie', () => {
      expect(() => {
        parking.sortirVehicule('INCONNUE-00');
      }).toThrow(VehiculeNonTrouveError);

      // Entrée puis sortie
      parking.entrerVehicule('SN-1111-XX', CATEGORIES.VOITURE);
      parking.sortirVehicule('SN-1111-XX');

      // Tentative de 2ème sortie pour la même plaque
      expect(() => {
        parking.sortirVehicule('SN-1111-XX');
      }).toThrow(VehiculeNonTrouveError);
    });

    test('permet à un véhicule de réentrer après être sorti', () => {
      parking.entrerVehicule('SN-2222-YY', CATEGORIES.VOITURE);
      parking.sortirVehicule('SN-2222-YY');

      // Nouvelle entrée autorisée car le ticket précédent est clôturé
      expect(() => {
        parking.entrerVehicule('SN-2222-YY', CATEGORIES.VOITURE);
      }).not.toThrow();

      const historique = parking.historiqueVehicule('SN-2222-YY');
      expect(historique).toHaveLength(2);
    });
  });

  describe('4. Décompte des places et historique', () => {
    test('doit décompter correctement les places disponibles globalement et par catégorie', () => {
      expect(parking.placesDisponibles()).toBe(50);
      expect(parking.placesDisponibles(CATEGORIES.VOITURE)).toBe(35);
      expect(parking.placesDisponibles(CATEGORIES.MOTO)).toBe(10);
      expect(parking.placesDisponibles(CATEGORIES.PMR)).toBe(5);

      parking.entrerVehicule('V-01', CATEGORIES.VOITURE);
      parking.entrerVehicule('M-01', CATEGORIES.MOTO);

      expect(parking.placesDisponibles()).toBe(48);
      expect(parking.placesDisponibles(CATEGORIES.VOITURE)).toBe(34);
      expect(parking.placesDisponibles(CATEGORIES.MOTO)).toBe(9);
      expect(parking.placesDisponibles(CATEGORIES.PMR)).toBe(5);
    });

    test('doit renvoyer l\'historique chronologique des passages d\'une plaque', () => {
      const d1 = new Date('2026-03-01T08:00:00Z');
      const d2 = new Date('2026-03-01T09:00:00Z');
      const d3 = new Date('2026-03-02T14:00:00Z');

      parking.entrerVehicule('SN-HISTO-01', CATEGORIES.VOITURE, d1);
      parking.sortirVehicule('SN-HISTO-01', d2);

      parking.entrerVehicule('SN-HISTO-01', CATEGORIES.VOITURE, d3);

      const historique = parking.historiqueVehicule('SN-HISTO-01');
      expect(historique).toHaveLength(2);
      expect(historique[0].dateEntree).toEqual(d3); // Trié du plus récent au plus ancien
      expect(historique[1].dateEntree).toEqual(d1);
    });
  });
});

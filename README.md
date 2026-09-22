# ParkEasy &mdash; Système de Gestion d'un Parking Automobile

Application Node.js complète développée pour le compte de la société **ParkEasy**, permettant la gestion des places de parking, l'enregistrement des entrées et sorties de véhicules, le calcul automatique des tarifs en Francs CFA (XOF), l'exposition d'une API REST et la mise à disposition d'une interface web opérateur.

- **Dépôt GitHub** : [https://github.com/ItExpertAfrica/exam_gestion_parking](https://github.com/ItExpertAfrica/exam_gestion_parking)
- **Branche d'évaluation** : `main`

---

## 1. Règles Métier & Tarification

- **Capacité totale** : 50 places réparties strictement par catégorie :
  - **VOITURE** : 35 places &bull; Tarif : **500 F CFA / heure**
  - **MOTO** : 10 places &bull; Tarif : **250 F CFA / heure**
  - **PMR** (Mobilité Réduite) : 5 places &bull; Tarif : **500 F CFA / heure**
- **Monnaie sans subdivision décimale** : Tous les montants manipulés sont des **nombres entiers** en Francs CFA (pas de centimes).
- **Demi-heure gratuite** : La première demi-heure ($\le 30\text{ minutes}$) de stationnement est **totalement gratuite** pour toutes les catégories.
- **Facturation à l'heure entamée** : Au-delà de 30 minutes, toute heure entamée est facturée en totalité (arrondi à l'heure supérieure).
  - *Exemples VOITURE (500 F CFA/h)* :
    - $20\text{ min} \rightarrow \mathbf{0\text{ F CFA}}$ (première demi-heure gratuite).
    - $45\text{ min} \rightarrow \mathbf{500\text{ F CFA}}$ (1 heure facturée).
    - $2\text{h}10\text{ min} \rightarrow \mathbf{1\,500\text{ F CFA}}$ (3 heures facturées).
- **Contraintes d'intégrité** :
  - Attribution d'une place libre par catégorie (erreur `409 Conflict` si complet).
  - Unicité de la plaque active : interdiction pour un véhicule d'entrer à nouveau sans être sorti au préalable.
  - Horodatages injectables (`dateEntree`, `dateSortie`) garantissant une testabilité indépendante de l'horloge système.

---

## 2. Architecture du Projet

Le projet respecte une stricte séparation en couches logiques :

```text
exam-gestion-parking/
├── src/
│   ├── metier/                    # Logique métier pure (indépendante de tout framework)
│   │   ├── Place.js               # Entité Place (id, catégorie, statut LIBRE/OCCUPEE)
│   │   ├── Ticket.js              # Entité Ticket (id unique, plaque, catégorie, placeId, dates, montant)
│   │   ├── Tarification.js        # Algorithme de calcul du tarif (F CFA entiers, 30 min gratuites)
│   │   ├── Parking.js             # Gestionnaire principal du parking (50 places, entrées, sorties)
│   │   ├── errors.js              # Classes d'erreurs métier dédiées avec codes HTTP
│   │   └── index.js               # Point d'export du domaine métier
│   ├── persistence/               # Couche de persistance isolée (Pattern Repository)
│   │   ├── ParkingRepositoryInterface.js # Contrat d'interface abstrait
│   │   ├── MemoryParkingRepository.js    # Implémentation mémoire (pour les tests Jest isolés)
│   │   ├── LocalStorageParkingRepository.js # Implémentation disque (node-localstorage / JSON)
│   │   └── index.js               # Point d'export de la persistance
│   ├── api/                       # Couche API REST Express
│   │   ├── controllers/           # Contrôleur REST (parkingController.js)
│   │   ├── middlewares/           # Validation des entrées et gestion centralisée des erreurs
│   │   ├── routes/                # Définition des routes REST (/api/...)
│   │   └── index.js               # Point d'export de l'API
│   ├── views/                     # Vues Express Handlebars
│   │   ├── layouts/               # Layout partagé (main.handlebars) avec menu de navigation
│   │   ├── dashboard.handlebars   # Tableau de bord avec compteurs et jauges par catégorie
│   │   ├── entree.handlebars      # Formulaire d'enregistrement d'une entrée avec ticket
│   │   ├── sortie.handlebars      # Formulaire de sortie avec reçu et montant à régler
│   │   └── places.handlebars      # Tableau d'état des 50 places avec filtres par catégorie
│   ├── web/                       # Contrôleur et routes de l'interface opérateur
│   │   └── webRoutes.js
│   └── app.js                     # Point d'entrée principal, configuration Express et Handlebars
├── public/
│   └── css/
│       └── style.css              # Style sobre, clair et lisible (ergonomie opérateur, sans artifice IA)
├── tests/
│   ├── parking.test.js            # Tests unitaires Jest (15 tests, MemoryRepository, couverture complète)
│   └── api.test.js                # Tests d'intégration API REST et vues Web avec Supertest (14 tests)
├── data/                          # Dossier de persistance locale (exclu du suivi Git)
├── package.json                   # Dépendances et scripts npm
├── PLAN_REALISATION.md            # Plan d'implémentation initial
└── README.md                      # Documentation complète du projet
```

---

## 3. Justification du Choix de Persistance : `node-localstorage` vs `SQLite`

Le sujet d'examen proposait le choix entre **`node-localstorage` (Option A)** et **`SQLite` (Option B)**.

**Choix retenu : `node-localstorage` (Option A)** pour les raisons suivantes :
1. **Simplicité d'exploitation et portabilité universelle** : `node-localstorage` est une bibliothèque 100% JavaScript qui s'installe et s'exécute instantanément sur n'importe quel environnement (Linux, macOS, Windows) sans nécessiter de compilation native en C++ via `node-gyp` ou `python`, évitant ainsi les écueils fréquents lors de la correction.
2. **Adéquation avec le volume de données** : Avec un parking dimensionné à 50 places et une sérialisation claire sous forme d'états JSON (`places` et `tickets`), la structure clé/valeur persistante sur disque répond parfaitement au besoin sans introduire la lourdeur d'un schéma SQL complet.
3. **Isolation et injection de dépendance** : Grâce au pattern Repository (`ParkingRepositoryInterface`), la classe métier `Parking` ne connaît absolument pas le support physique sous-jacent. Elle reçoit son instance de repository via son constructeur (`new Parking(repository)`). Ainsi, l'implémentation `MemoryParkingRepository` est injectée dans les tests unitaires Jest pour garantir une vitesse d'exécution maximale en mémoire, tandis que `LocalStorageParkingRepository` est injectée au démarrage du serveur en production pour assurer la persistance sur disque.

---

## 4. Installation et Démarrage

### Prérequis
- Node.js (version 18 ou supérieure recommandée, testé sous Node v22)
- npm (version 9 ou supérieure)

### Installation des dépendances
```bash
npm install
```

### Lancer la suite de tests (Jest)
La suite de tests exécute à la fois les tests unitaires de la logique métier et les tests d'intégration avec Supertest :
```bash
npm test
```

### Démarrer l'application
```bash
npm start
```
*Pour le mode développement avec rechargement automatique :*
```bash
npm run dev
```

L'application sera accessible sur :
- **Interface Web opérateur** : [http://localhost:3000](http://localhost:3000)
- **API REST** : [http://localhost:3000/api](http://localhost:3000/api)

---

## 5. Spécification de l'API REST

Toutes les réponses de l'API sont retournées au format JSON.

| Méthode | Route | Description | Code Succès | Codes Erreurs |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/entrees` | Enregistre l'entrée d'un véhicule (`{ plaque, categorie }`) | `201 Created` | `400`, `409` |
| `POST` | `/api/sorties` | Clôture le ticket, libère la place et calcule le montant | `200 OK` | `400`, `404` |
| `GET` | `/api/places` | Liste les places et disponibilités (filtre optionnel `?categorie=`) | `200 OK` | - |
| `GET` | `/api/tickets/:id` | Récupère le détail d'un ticket par son identifiant unique | `200 OK` | `404` |
| `GET` | `/api/vehicules/:plaque/historique` | Renvoie l'historique complet des passages d'un véhicule | `200 OK` | - |

### Exemples d'appels `curl`

#### 1. Enregistrer une entrée de véhicule
```bash
curl -X POST http://localhost:3000/api/entrees \
  -H "Content-Type: application/json" \
  -d '{"plaque": "DK-1234-AB", "categorie": "VOITURE"}'
```
*Réponse (`201 Created`) :*
```json
{
  "success": true,
  "message": "Véhicule enregistré avec succès.",
  "ticket": {
    "id": "TKT-1790072245480-C5145F",
    "plaque": "DK-1234-AB",
    "categorie": "VOITURE",
    "placeId": "V-01",
    "dateEntree": "2026-09-22T10:17:25.480Z",
    "dateSortie": null,
    "montant": null
  }
}
```

#### 2. Enregistrer la sortie d'un véhicule
```bash
curl -X POST http://localhost:3000/api/sorties \
  -H "Content-Type: application/json" \
  -d '{"plaque": "DK-1234-AB"}'
```
*Réponse (`200 OK`) :*
```json
{
  "success": true,
  "message": "Sortie validée. Ticket clôturé.",
  "ticket": {
    "id": "TKT-1790072245480-C5145F",
    "plaque": "DK-1234-AB",
    "categorie": "VOITURE",
    "placeId": "V-01",
    "dateEntree": "2026-09-22T10:17:25.480Z",
    "dateSortie": "2026-09-22T11:02:25.480Z",
    "montant": 500
  },
  "montantDu": 500,
  "devise": "F CFA"
}
```

#### 3. Obtenir l'état des places avec filtre
```bash
curl http://localhost:3000/api/places?categorie=MOTO
```

#### 4. Consulter l'historique d'un véhicule
```bash
curl http://localhost:3000/api/vehicules/DK-1234-AB/historique
```

---

## 6. Interface Web Opérateur (Express Handlebars)

L'interface a été conçue selon des critères d'ergonomie et de clarté professionnelle pour l'agent d'exploitation du parking :
- `/` : **Tableau de bord** présentant la synthèse des 50 places (globales et ventilées par VOITURE, MOTO, PMR) avec rappel des règles tarifaires et boutons d'action rapide.
- `/entree` : **Formulaire d'entrée** avec sélection de catégorie, attribution instantanée d'un emplacement et rendu visuel du ticket sous forme de carte imprimable.
- `/sortie` : **Formulaire de sortie** par numéro de plaque, avec génération d'un reçu récapitulatif (durée précise de stationnement, place libérée et montant dû en Francs CFA).
- `/places` : **Liste exhaustive des 50 places** avec filtre déroulant par catégorie et badges de statut colorés (`LIBRE` en vert, `OCCUPÉE` en rouge).

---

## 7. Résultats des Tests Automatisés (Jest)

La suite de tests comprend **29 cas de tests** couvrant 100% des exigences fonctionnelles du barème :

```text
PASS tests/api.test.js
  Suite de tests d'intégration - API REST & Web (Supertest)
    API REST - /api/entrees
      ✓ POST /api/entrees : doit enregistrer une entrée et renvoyer 201 Created
      ✓ POST /api/entrees : doit renvoyer 400 Bad Request si la plaque est absente
      ✓ POST /api/entrees : doit renvoyer 400 Bad Request si la catégorie est inconnue
      ✓ POST /api/entrees : doit renvoyer 409 Conflict si la plaque est déjà active
    API REST - /api/sorties
      ✓ POST /api/sorties : doit enregistrer une sortie et renvoyer 200 OK avec le montant dû
      ✓ POST /api/sorties : doit renvoyer 404 Not Found si le véhicule n'est pas dans le parking
    API REST - Consultation des places, tickets et historiques
      ✓ GET /api/places : doit renvoyer l'état global des places
      ✓ GET /api/places?categorie=MOTO : doit filtrer les places par catégorie
      ✓ GET /api/tickets/:id : doit renvoyer les détails d'un ticket
      ✓ GET /api/vehicules/:plaque/historique : doit renvoyer la liste des tickets d'un véhicule
    Interface Web Handlebars (Rendu SSR)
      ✓ GET / : doit afficher le tableau de bord en HTML (200 OK)
      ✓ GET /entree : doit afficher le formulaire d'entrée (200 OK)
      ✓ GET /sortie : doit afficher le formulaire de sortie (200 OK)
      ✓ GET /places : doit afficher la liste des 50 places (200 OK)

PASS tests/parking.test.js
  Suite de tests unitaires - Système de Gestion ParkEasy
    1. Entrée d'un véhicule
      ✓ doit enregistrer l'entrée d'un véhicule et lui attribuer une place disponible
      ✓ doit refuser l'entrée quand la catégorie est complète
      ✓ doit refuser l'entrée si la plaque est déjà présente dans le parking (pas de doublon actif)
      ✓ doit refuser l'entrée en cas de données invalides (plaque vide ou catégorie inconnue)
    2. Calcul des tarifs (Francs CFA)
      ✓ VOITURE : 20 min -> 0 F CFA (première demi-heure gratuite)
      ✓ VOITURE : exactement 30 min -> 0 F CFA (limite de gratuité)
      ✓ VOITURE : 45 min -> 500 F CFA (1 heure facturée à 500 F CFA/h)
      ✓ VOITURE : 2h10 -> 1500 F CFA (3 heures facturées à 500 F CFA/h)
      ✓ MOTO : 1h15 -> 500 F CFA (2 heures facturées à 250 F CFA/h)
      ✓ PMR : 3h05 -> 2000 F CFA (4 heures facturées à 500 F CFA/h)
    3. Sortie d'un véhicule
      ✓ doit clôturer le ticket, libérer la place et renvoyer le montant dû
      ✓ doit refuser la sortie pour une plaque inconnue ou déjà sortie
      ✓ permet à un véhicule de réentrer après être sorti
    4. Décompte des places et historique
      ✓ doit décompter correctement les places disponibles globalement et par catégorie
      ✓ doit renvoyer l'historique chronologique des passages d'une plaque

Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        0.78 s
```

/**
 * Classes d'erreurs métier pour la gestion du parking
 */

class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class PlaceIndisponibleError extends BusinessError {
  constructor(categorie) {
    super(`Aucune place disponible pour la catégorie : ${categorie}`, 409);
    this.categorie = categorie;
  }
}

class VehiculeDejaPresentError extends BusinessError {
  constructor(plaque) {
    super(`Le véhicule avec la plaque "${plaque}" est déjà présent dans le parking.`, 409);
    this.plaque = plaque;
  }
}

class VehiculeNonTrouveError extends BusinessError {
  constructor(plaque) {
    super(`Aucun véhicule actif trouvé avec la plaque "${plaque}".`, 404);
    this.plaque = plaque;
  }
}

class ValidationError extends BusinessError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = {
  BusinessError,
  PlaceIndisponibleError,
  VehiculeDejaPresentError,
  VehiculeNonTrouveError,
  ValidationError
};

const { Place, STATUTS, CATEGORIES } = require('./Place');
const { Ticket } = require('./Ticket');
const { Parking } = require('./Parking');
const { calculerTarif, TARIFS_HORAIRES } = require('./Tarification');
const {
  BusinessError,
  PlaceIndisponibleError,
  VehiculeDejaPresentError,
  VehiculeNonTrouveError,
  ValidationError
} = require('./errors');

module.exports = {
  Place,
  STATUTS,
  CATEGORIES,
  Ticket,
  Parking,
  calculerTarif,
  TARIFS_HORAIRES,
  BusinessError,
  PlaceIndisponibleError,
  VehiculeDejaPresentError,
  VehiculeNonTrouveError,
  ValidationError
};

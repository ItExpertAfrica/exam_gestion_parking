const { createParkingRouter } = require('./routes/parkingRoutes');
const { createParkingController } = require('./controllers/parkingController');
const { errorHandler } = require('./middlewares/errorHandler');
const { validerEntree, validerSortie } = require('./middlewares/validation');

module.exports = {
  createParkingRouter,
  createParkingController,
  errorHandler,
  validerEntree,
  validerSortie
};

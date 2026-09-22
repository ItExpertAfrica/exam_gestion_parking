const { ParkingRepositoryInterface } = require('./ParkingRepositoryInterface');
const { MemoryParkingRepository } = require('./MemoryParkingRepository');
const { LocalStorageParkingRepository } = require('./LocalStorageParkingRepository');

module.exports = {
  ParkingRepositoryInterface,
  MemoryParkingRepository,
  LocalStorageParkingRepository
};

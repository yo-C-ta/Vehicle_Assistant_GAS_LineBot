'use strict'

/**
 * Represents a vehicle.
 * @constructor
 *
 * @param {Object} data The vehicle's raw data
 *
 */
var Vehicle = function(data) {
  this.vehicle = data
}

/**
 * Gets all of the vehicle's data.
 *
 * @return {Object} The vehicle's (formatted) data
 *
 */
Vehicle.prototype.getAll = function() {
  return {
    type: this.getType(),
    name: this.getName(),
    year: this.getYear(),
    seating: this.getSeating(),
    image: this.getImage(),
    drivetrain: this.getDrivetrain()
  }
}

/**
 * Gets the vehicle's type.
 * ex: SUV, sedan, minivan, etc.
 *
 * @return {string} The vehicle's type
 *
 */
Vehicle.prototype.getType = function() {
  var type = ''
  var types = this.vehicle.modelCategory.split(',')

  if (types.length > 1) type = types[1].replace(/\s+/g, '')
  else if (types.length === 1 && types[0].indexOf('-') >= 0)
    type = types[0].split('-')[0]
  else type = types

  return type.toString().substr(0, type.toString().length - 1)
}

/**
 * Gets the vehicle's name.
 *
 * @return {string} The vehicle's name
 *
 */
Vehicle.prototype.getName = function() {
  return this.vehicle.modelName
}

/**
 * Gets the vehicle's year.
 *
 * @return {number} The vehicle's production year
 *
 */
Vehicle.prototype.getYear = function() {
  return this.vehicle.modelYear
}

/**
 * Gets the vehicle's seating.
 *
 * @return {number} The vehicle's seating num
 *
 */
Vehicle.prototype.getSeating = function() {
  return this.vehicle.seating
}

/**
 * Gets the vehicle's image.
 *
 * @return {string} An image URL.
 *
 */
Vehicle.prototype.getImage = function() {
  return absoluteURL(
    'imgix/responsive/images/jellies/' +
      this.getYear() +
      '/' +
      this.getName()
        .toLowerCase()
        .replace(/\s/g, '') +
      '/base.png'
  )
}

/**
 * Gets the vehicle's available drivetrain(s).
 * ex: FWD, RWD, AWD, etc.
 *
 * @return {Object} An array of one or more drivetrains
 *
 */
Vehicle.prototype.getDrivetrain = function() {
  return underscoreGS._map(this.vehicle.DriveTrain.split(','), function(
    drivetrain
  ) {
    return drivetrain.replace(/\s+/g, '')
  })
}

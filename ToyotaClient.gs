'use strict'

var where = function(arr, obj) {
  var result = arr
  for (key in obj) {
    result = underscoreGS._filter(result, function(item) {
      return item[key] === obj[key]
    })
  }
  return result
}

/**
 * Builds and executes a request.
 *
 */
var doRequest = function(path, params) {
  arr = []
  for (key in params) {
    var param = key + '=' + params[key]
    arr.push(param)
  }
  var endpoint = absoluteURL(path + '?' + arr.join('&')).replace(/\s+/g, '')
  return JSON.parse(UrlFetchApp.fetch(endpoint).getContentText())
}

/**
 * Client constructor.
 * @constructor
 *
 */
var ToyotaClient = function() {
  /**
   * Generates well-organized, response-ready data on all vehicles.
   * @private
   *
   * @param {Object} vehicles An array of vehicle objects
   *
   * @return An array of formatted vehicle data
   *
   */
  var formatAllVehicleData = function(vehicles, group_by) {
    // filter out empty data
    var filtered = underscoreGS._filter(vehicles, function(vehicle) {
      return !underscoreGS._isEmpty(vehicle) //&& typeof vehicle.grades !== 'undefined'
    })

    if (group_by == 'seating') {
      // group vehicles by type
      var seating_groups = groupBy(filtered, group_by)
      return underscoreGS._map(seating_groups, function(stype) {
        // group vehicles by name
        var vehs = groupVehicleByName(stype)
        // concat data
        return {
          seating: stype[0].seating,
          vehicles: vehs
        }
      })
    } else if (group_by == 'type') {
      // group vehicles by type
      var type_groups = groupBy(filtered, group_by)
      return underscoreGS._map(type_groups, function(vtype) {
        // group vehicles by name
        var vehs = groupVehicleByName(vtype)
        // concat data
        return {
          type: vtype[0].type,
          vehicles: vehs
        }
      })
    } else {
      // group vehicles by name
      return groupVehicleByName(filtered)
    }
  }

  /**
   * Grouping vehicle data by name
   * @private
   *
   */
  var groupVehicleByName = function(list) {
    // group vehicles by name
    var name_groups = groupBy(list, 'name')
    return underscoreGS._map(name_groups, function(vehicle) {
      // parse generations
      var gens = underscoreGS._map(vehicle, function(gen) {
        return { year: gen.year, grades: gen.grades }
      })
      // concat data
      return {
        type: vehicle[0].type,
        name: vehicle[0].name,
        seating: vehicle[0].seating,
        image: vehicle[0].image,
        generations: gens
      }
    })
  }

  /**
   * Parses raw data on one or more vehicle(s).
   * @private
   *
   */
  var parseVehicles = function(data, with_grade, group_by) {
    var vehicles = underscoreGS._map(data, function(vehicleData) {
      if (vehicleData.modelYear >= new Date().getFullYear() - 1) {
        // create vehicle object
        var vehicle = new Vehicle(vehicleData).getAll()

        if (with_grade) {
          // get vehicle's grades
          var grades = getGrades(vehicle)
          // add combined vehicle data to mapped array
          if (underscoreGS._isEmpty(grades)) {
            return {}
          }
          for (key in grades) {
            vehicle[key] = grades[key]
          }
        }
        return vehicle
      } else return {}
    })
    return formatAllVehicleData(vehicles, group_by)
  }

  /**
   * Gets all vehicles.
   *
   */
  this.getAllVehicles = function(with_grade) {
    var req = doRequest('ToyotaSite/rest/lscs/getDocument', {
      templatePath:
        'templatedata/TComVehiclesData/Series/data/CombinedSeries.xml'
    })
    return parseVehicles(req.Root.Series, with_grade, 'name')
  }

  /**
   * Gets all vehicle type.
   *
   */
  this.getAllType = function(with_grade) {
    var req = doRequest('ToyotaSite/rest/lscs/getDocument', {
      templatePath:
        'templatedata/TComVehiclesData/Series/data/CombinedSeries.xml'
    })
    return parseVehicles(req.Root.Series, with_grade, 'type')
  }

  /**
   * Gets all vehicle seating.
   *
   */
  this.getAllSeating = function(with_grade) {
    var req = doRequest('ToyotaSite/rest/lscs/getDocument', {
      templatePath:
        'templatedata/TComVehiclesData/Series/data/CombinedSeries.xml'
    })
    return parseVehicles(req.Root.Series, with_grade, 'seating')
  }

  /**
   * Gets a specific vehicle.
   *
   */
  this.getVehicle = function(model, year) {
    var vehiclesData = doRequest('ToyotaSite/rest/lscs/getDocument', {
      templatePath:
        'templatedata/TComVehiclesData/Series/data/CombinedSeries.xml'
    })
    var vehicleGens = where(
      vehiclesData.Root.Series,
      year
        ? { modelName: model, modelYear: parseInt(year) }
        : { modelName: model }
    )
    return parseVehicles(vehicleGens, true, 'name')
  }

  /**
   * Gets a vehicle's grades and trims.
   * @private
   *
   */
  var getGrades = function(vehicle) {
    var data = doRequest('ToyotaSite/rest/lscs/getDocument', {
      templatePath:
        'templatedata/TComVehiclesData/VehicleTrim/data/' +
        vehicle.year.toString() +
        '/' +
        vehicle.name.toLowerCase() +
        '.xml'
    })
    if (data.Root) {
      var grades = underscoreGS._map(data.Root.ModelGrades, function(
        gradeData
      ) {
        var grade = new Grade(gradeData).getAll()
        var trims = underscoreGS._map(gradeData.VehicleTrims, function(
          trimData
        ) {
          var trim = new Trim(trimData).getAll()

          // determine trim's drivetrain
          var drivetrain = ''
          if (
            /FWD/.test(trim.name) ||
            /4x2/.test(trim.name) ||
            /2WD/.test(trim.name)
          )
            drivetrain = 'FWD'
          else if (
            /AWD/.test(trim.name) ||
            /4x4/.test(trim.name) ||
            /4WD/.test(trim.name)
          )
            drivetrain = 'AWD'
          else if (/RWD/.test(trim.name)) drivetrain = 'RWD'
          else drivetrain = underscoreGS._last(vehicle.drivetrain)

          trim['drivetrain'] = drivetrain
          return trim
        })
        grade['trims'] = trims
        return grade
      })
      return { grades: grades }
    } else return {}
  }
}

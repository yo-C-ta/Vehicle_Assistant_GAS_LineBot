'use strict'

/**
 * Represents a vehicle's grade.
 * @constructor
 *
 * @param {Object} grade The vehicle grade's raw data
 *
 */
var Grade = function(data) {
  this.grade = data
}

/**
 * Get all of the grade's data.
 *
 * @return {Object} The grade's (formatted) data
 *
 */
Grade.prototype.getAll = function() {
  return {
    name: this.getName(),
    key_features: this.getKeyFeatures()
  }
}

/**
 * Get the grade's name.
 * ex: SR5, SE, etc.
 *
 * @return {string} The grade's name
 *
 */
Grade.prototype.getName = function() {
  return this.grade.modelGradeName
}

/**
 * Get the grade's key features.
 *
 * @return {Object} The grade's key features
 *
 */
Grade.prototype.getKeyFeatures = function() {
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [],
      idx = 0

    for (
      var i = startIndex || 0, length = input && input.length;
      i < length;
      i++
    ) {
      var value = input[i]

      if (underscoreGS._isArray(value)) {
        if (!shallow) value = flatten(value, shallow, strict)
        var j = 0,
          len = value.length
        output.length += len

        while (j < len) {
          output[idx++] = value[j++]
        }
      } else if (!strict) {
        output[idx++] = value
      }
    }
    return output
  }

  return flatten(
    underscoreGS._map(this.grade.KeyFeatures, function(feature) {
      return underscoreGS._values(feature)
    }),
    false
  )
}

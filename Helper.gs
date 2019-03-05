function absoluteURL(relativeURL) {
  var baseURL = 'https://www.toyota.com/'
  if (relativeURL.indexOf('/') == 0) {
    relativeURL = relativeURL.slice(1)
  }
  return baseURL + relativeURL
}

function groupBy(obj, val) {
  var result = {}
  var iterator = underscoreGS._isFunction(val)
    ? val
    : function(obj) {
        return obj[val]
      }
  underscoreGS._each(obj, function(value, index) {
    var key = iterator(value, index)
    ;(result[key] || (result[key] = [])).push(value)
  })
  return result
}

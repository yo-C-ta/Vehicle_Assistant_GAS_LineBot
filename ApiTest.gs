function myFunction() {
  var tyc = new ToyotaClient()

  // All informations (Name sort)
  var dataset = tyc.getAllVehicles(false)
  Logger.log(JSON.stringify(dataset[0]))

  // Vehicle informations
  var veh = tyc.getVehicle('Prius v', '2017')
  Logger.log(JSON.stringify(veh[0]))

  // Vehicle informations
  var veh2 = tyc.getVehicle('Prius c')
  Logger.log(JSON.stringify(veh2[0]))

  // Type sort
  var type = tyc.getAllType(true)
  Logger.log(JSON.stringify(type[0]))

  // Seating sort
  var seat = tyc.getAllSeating(true)
  Logger.log(JSON.stringify(seat[0]))

  // Vehicle name list
  var names = underscoreGS._map(dataset, function(data) {
    return data.name
  })
  //Logger.log(JSON.stringify(names));
}

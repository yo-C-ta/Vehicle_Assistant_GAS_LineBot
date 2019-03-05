// LINE channel access token
var CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty(
  'APPTOKEN'
)
// Max carousel restrict
var MAX_COLUMN = 10
var MAX_LITSIZE = 120
// Max quick reply restrict
var MAX_ITEMS = 13
// Initial item List
var ITEM_TEMPLATE = {
  車種から選ぶ: '車種',
  タイプから選ぶ: 'タイプ',
  座席数から選ぶ: '座席数'
}

// !!!CHECK!!! this param before release
var _DEBUG_ = false

/********************************************************/
/*  doPost - Message hook                               */
/********************************************************/
function doPost(e) {
  var repmsgs
  var user_message

  if (!_DEBUG_) {
    var reply_token = JSON.parse(e.postData.contents).events[0].replyToken
    if (typeof reply_token === 'undefined') {
      return
    }
    user_message = JSON.parse(e.postData.contents).events[0].message.text
  } else {
    user_message = 'Avalon:2018'
  }

  if (~user_message.indexOf('車種')) {
    var msgarr = user_message.split(':')
    var page = 0
    if (msgarr[1]) {
      page = parseInt(msgarr[1])
    }
    repmsgs = getVehicleNames(page)
  } else if (~user_message.indexOf('タイプ')) {
    var msgarr = user_message.split(':')
    var type = ''
    if (msgarr[1]) {
      type = msgarr[1]
    }
    var page = 0
    if (msgarr[2]) {
      page = parseInt(msgarr[2])
    }
    repmsgs = getVehicleTypes(type, page)
  } else if (~user_message.indexOf('座席数')) {
    var msgarr = user_message.split(':')
    var seat = ''
    if (msgarr[1]) {
      seat = msgarr[1]
    }
    var page = 0
    if (msgarr[2]) {
      page = parseInt(msgarr[2])
    }
    repmsgs = getVehicleSeating(seat, page)
  } else {
    if (~user_message.indexOf(':')) {
      var msgarr = user_message.split(':')
      repmsgs = getVehicleInfo(msgarr[0], msgarr[1], msgarr[2])
    } else {
      repmsgs = getHelloComment()
    }
  }

  /***********/
  /*  Reply  */
  /***********/
  var url = 'https://api.line.me/v2/bot/message/reply'
  var payload = {
    replyToken: reply_token,
    messages: repmsgs
  }
  UrlFetchApp.fetch(url, {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    method: 'post',
    payload: JSON.stringify(payload)
  })
  return ContentService.createTextOutput(
    JSON.stringify({ content: 'post ok' })
  ).setMimeType(ContentService.MimeType.JSON)
}

/********************************************************/
/*  subFuncs                                            */
/********************************************************/

/*  Introduction  */
var getHelloComment = function() {
  return makeMsgResp(
    'こんにちは US-Toyota Botです🇺🇸\nどういう車を探してる？',
    ITEM_TEMPLATE
  )
}

/*  VehicleName  */
var getVehicleNames = function(page) {
  var dataset = new ToyotaClient().getAllVehicles(false)

  return makeVehicleCard(dataset, page, '車種:')
}

/*  VehicleType  */
var getVehicleTypes = function(type, page) {
  var dataset = new ToyotaClient().getAllType(false)

  var filtered = underscoreGS._filter(dataset, function(tp) {
    return tp.type == type
  })
  if (filtered.length != 0) {
    return makeVehicleCard(filtered[0].vehicles, page, 'タイプ:' + type + ':')
  } else {
    if (dataset.length > MAX_ITEMS) dataset.length = MAX_ITEMS
    var itemList = {}
    var types = underscoreGS._map(dataset, function(tp) {
      return tp.type
    })
    types.forEach(function(type_name) {
      itemList[type_name] = 'タイプ:' + type_name
    })
    return makeMsgResp('タイプ🚗🚙🚐を選んでね', itemList)
  }
}

/*  VehicleSeat  */
var getVehicleSeating = function(seating, page) {
  var dataset = new ToyotaClient().getAllSeating(false)

  var filtered = underscoreGS._filter(dataset, function(st) {
    return st.seating == seating
  })
  if (filtered.length != 0) {
    return makeVehicleCard(
      filtered[0].vehicles,
      page,
      '座席数:' + seating + ':'
    )
  } else {
    if (dataset.length > MAX_ITEMS) dataset.length = MAX_ITEMS
    var itemList = {}
    var seatings = underscoreGS._map(dataset, function(st) {
      return st.seating
    })
    seatings.sort(function(a, b) {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
    seatings.forEach(function(seat_num) {
      itemList[seat_num] = '座席数:' + seat_num
    })
    return makeMsgResp('座席数👨👩👦👦を選んでね', itemList)
  }
}

/*  Make carousel vehicle card  */
var makeVehicleCard = function(dataset, page, next_msg) {
  var sli_arr = sliArr2Dim(dataset, MAX_COLUMN)
  dataset = sli_arr[0]
  if (sli_arr[page]) dataset = sli_arr[page]

  var next_act
  if (sli_arr.length > page + 1) {
    next_act = {
      type: 'message',
      label: 'See more',
      text: next_msg + (page + 1)
    }
  }
  var cards = []
  dataset.forEach(function(vehicle) {
    var action = [
      {
        type: 'message',
        label: 'About this vehicle',
        text: vehicle.name + '::'
      }
    ]
    var defact = {
      type: 'uri',
      label: 'View image',
      uri: vehicle.image
    }
    if (next_act) action.push(next_act)
    var card = {
      thumbnailImageUrl: vehicle.image,
      title: vehicle.name,
      text: vehicle.type + '\n',
      defaultAction: defact,
      actions: action
    }
    cards.push(card)
  })
  return makeCarouselResp(cards, 'Select series')
}

/*  Detail info  */
var getVehicleInfo = function(name, year, grade) {
  var vehs = new ToyotaClient().getVehicle(name, year)
  if (!vehs[0]) {
    return makeMsgResp('車が見つからなかったよ😭', ITEM_TEMPLATE)
  }

  if (vehs[0].generations.length == 1) {
    // Get detail
    if (grade) return getDetail(vehs[0], grade)
    // Select Grade
    else return selectGrade(vehs[0])
  }
  // Select Model Year
  else if (vehs[0].generations.length > 1) {
    var itemList = {}
    var years = underscoreGS._map(vehs[0].generations, function(gen) {
      return gen.year
    })
    years.forEach(function(year) {
      itemList[year] = vehs[0].name + ':' + year + ':'
    })
    return makeMsgResp('年式📅を選んでね', itemList)
  }
  // Error
  else {
    return makeMsgResp(vehs[0].name + 'の情報がないみたい😭', ITEM_TEMPLATE)
  }
}

/*  Grade detail  */
var getDetail = function(veh, grade) {
  var filteredvehs = underscoreGS._filter(veh.generations[0].grades, function(
    grd
  ) {
    return grd.name == grade
  })

  var cards = []
  filteredvehs.forEach(function(vehicle) {
    vehicle.trims.forEach(function(trim) {
      var m =
        '$ ' + trim.msrp.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,') + '\n'
      var f = 'Fe ' + trim.city_mpg + 'mpg\n'
      var d = trim.drivetrain + '\n'
      var t =
        trim.transmission.replace('Automatic', 'AT').replace('Manual', 'MT') +
        '\n'
      var s = 'Seats ' + trim.max_seating + '\n'
      var defact = {
        type: 'uri',
        label: 'View image',
        uri: trim.image
      }
      var v = veh.name.toLowerCase().replace(/\s+/g, '')
      var y = veh.generations[0].year
      var action = [
        {
          type: 'uri',
          label: 'Official',
          uri:
            'https://www.toyota.com/configurator/#!/build/step/model/year/' +
            y +
            '/series/' +
            v +
            '/model/' +
            trim.trimId
          //uri: 'https://www.toyota.com/' + v
        }
      ]
      var card = {
        thumbnailImageUrl: trim.image,
        title: vehicle.name + ' ' + trim.name.split(' ')[0],
        text: m + f + d + t + s,
        defaultAction: defact,
        actions: action
      }
      cards.push(card)
    })
  })
  return makeCarouselResp(cards, 'Select vehicle')
}

/*  Select Grade  */
var selectGrade = function(veh) {
  var itemList = {}
  var grades = underscoreGS._map(veh.generations[0].grades, function(grd) {
    return grd.name
  })

  var cards = []
  veh.generations[0].grades.forEach(function(grade) {
    var action = [
      {
        type: 'message',
        label: 'Select this garde',
        text: veh.name + ':' + veh.generations[0].year + ':' + grade.name
      }
    ]
    var f = grade.name + '\n'
    grade.key_features.forEach(function(feature) {
      feature = feature.replace(/&lt;sup&gt;&amp;.+&lt;\/sup&gt;/g, '')
      feature = feature.replace(/&lt;.+?&gt;/g, '')
      feature = feature.replace(/\[.+\]/g, '')
      feature = feature.replace(/&#39;/g, "'")
      feature = '- ' + feature + '\n'
      if (f.length + feature.length < MAX_LITSIZE) f += feature
    })
    var card = {
      text: f,
      actions: action
    }
    cards.push(card)
  })
  return makeCarouselResp(cards, 'Select grade')
}

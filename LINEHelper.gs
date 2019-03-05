/********************************************************/
/*  makeQckRep - Convert item list to LINE format       */
/********************************************************/
function makeQckRep(item_list) {
  var items = []

  for (key in item_list) {
    var item = {
      type: 'action',
      action: {
        type: 'message',
        label: key,
        text: item_list[key]
      }
    }
    items.push(item)
  }

  return items
}

/********************************************************/
/*  makeMsgResp - Text message format for LINE          */
/********************************************************/
function makeMsgResp(msg, item_list) {
  return [
    {
      type: 'text',
      text: msg,
      quickReply: {
        items: makeQckRep(item_list)
      }
    }
  ]
}

/********************************************************/
/*  makeCarouselResp - Carousel message format for LINE */
/********************************************************/
function makeCarouselResp(cards, alt_text) {
  if (cards.length >= MAX_COLUMN) cards.length = MAX_COLUMN
  return [
    {
      type: 'template',
      altText: alt_text,
      template: {
        type: 'carousel',
        columns: cards,
        imageSize: 'contain'
      }
    }
  ]
}

/********************************************************/
/*  sliArr2Dim - Slice single array into 2-dim array    */
/********************************************************/
function sliArr2Dim(baseArr, max) {
  var newArr = []
  var size = baseArr.length
  for (var i = 0; i < Math.ceil(size / max); i++) {
    var j = i * max
    var p = baseArr.slice(j, j + max)
    newArr.push(p)
  }
  return newArr
}

const superagent = require('superagent');
const async = require('async')

const usernameApi = 'https://api.worldofwarships.com/wows/account/list/'
const application_id = '3e2c393d58645e4e4edb5c4033c56bd8'

async function idGetter(search) {
  let id = await superagent.get(usernameApi).query({
    application_id: application_id,
    search: search
  })
  return {
    data: id.body.data[0],
    response: `${id.body.data[0]['nickname']}: ${id.body.data[0]['account_id']}`
  }
}

function shipid(shipQuery) {
  var ship_id
  let shipData = graph.get('name_to_id')
  if (shipData.hasOwnProperty(shipQuery)) {
    ship_id = shipData[shipQuery]
  } else {
    let keyArray = Object.keys(shipData)
    for (var i = 0; i < keyArray.length; i++) {
      if (keyArray[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(shipQuery.toLowerCase())) {
        ship_id = shipData[keyArray[i]]
        console.log(keyArray[i])
        break
      }
    }
  }
  return {ship_id: ship_id, ship_name: keyArray[i]}
}

module.exports.id = idGetter
module.exports.shipid = shipid

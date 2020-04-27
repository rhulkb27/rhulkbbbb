const superagent = require('superagent');
const async = require('async')
const fs = require('fs')

const clanSearchApi = 'https://api.worldofwarships.com/wows/clans/list/'
const memberIdApi = 'https://api.worldofwarships.com/wows/clans/info/'
const memberDataApi = 'https://api.worldofwarships.com/wows/ships/stats/'
const expectedPrApi = 'https://api.wows-numbers.com/personal/rating/expected/json/'
const memberNameApi = 'https://api.worldofwarships.com/wows/account/info/'
const apikey = "3e2c393d58645e4e4edb5c4033c56bd8"

async function memberStats(clanQuery, shipQuery) {
  var map = new Map()

  var shipsJson = fs.readFileSync('ships.json')

  var shipData = JSON.parse(shipsJson)

  Object.keys(shipData).forEach(key => {
    map.set(key, shipData[key]);
  });

  // console.log(map)

  let clanId = await superagent.get(clanSearchApi).query({
    application_id: apikey,
    fields: 'clan_id',
    search: clanQuery
  })

  // console.log(clanId.body.data[0].clan_id)

  let memberRequest = await superagent.get(memberIdApi).query({
    application_id: apikey,
    clan_id: clanId.body.data[0].clan_id,
    fields: 'members_ids',
  })

  let members = memberRequest.body.data[clanId.body.data[0].clan_id].members_ids

  // console.log(members);

  var shipId
  if (map.has(shipQuery)) {
    shipId = map.get(shipQuery)
  } else {
    let keyArray = Array.from(map.keys())
    for (var i = 0; i < keyArray.length; ++i) {
      if (keyArray[i].toLowerCase().includes(shipQuery.toLowerCase())) {
        shipId = map.get(keyArray[i])
        break
      }
    }
  }

  let value = await superagent.get(expectedPrApi)
  let expectedValues = value.body.data[shipId]

  let prMap = new Map()

  for (var i = 0; i < members.length; i++) {
    let memberData = await superagent.get(memberDataApi).query({
      application_id: apikey,
      account_id: members[i],
      fields: 'pvp',
      ship_id: shipId
    })

    let memberName = await superagent.get(memberNameApi).query({
      application_id: apikey,
      account_id: members[i],
      fields: 'nickname'
    })

    if (memberData.body.data[members[i]] === null) continue
    let data = memberData.body.data[members[i]][0].pvp

    let rWins = (data.wins / data.battles) / (expectedValues.win_rate / 100)
    let rFrags = (data.frags / data.battles) / expectedValues.average_frags
    let rDmg = data.damage_dealt / data.battles / expectedValues.average_damage_dealt

    let nDmg = Math.max(0, (rDmg - 0.4) / (1 - 0.4))
    let nFrags = Math.max(0, (rFrags - 0.1) / (1 - 0.1))
    let nWins = Math.max(0, (rWins - 0.7) / (1 - 0.7))

    let PR = 700 * nDmg + 300 * nFrags + 150 * nWins

    prMap.set(memberName.body.data[members[i]].nickname, Math.round(PR));
  }

  return new Map([...prMap.entries()].sort((a, b) => b[1] - a[1]))
}

// await handler('rng', 'haku')

module.exports.memberStats = memberStats;

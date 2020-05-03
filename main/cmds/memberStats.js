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

  var shipsJson = fs.readFileSync(`${__dirname}/../utility/ships.json`)

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
    fields: 'members_ids,tag',
  })

  let members = memberRequest.body.data[clanId.body.data[0].clan_id].members_ids
  let clanTag = memberRequest.body.data[clanId.body.data[0].clan_id].tag

  // console.log(members);

  var shipId
  var shipName
  if (map.has(shipQuery)) {
    shipId = map.get(shipQuery)
  } else {
    let keyArray = Array.from(map.keys())
    for (var i = 0; i < keyArray.length; ++i) {
      if (keyArray[i].toLowerCase().includes(shipQuery.toLowerCase())) {
        shipId = map.get(keyArray[i])
        shipName = keyArray[i]
        console.log(keyArray[i])
        break
      }
    }
  }

  let value = await superagent.get(expectedPrApi)
  let expectedValues = value.body.data[shipId]

  let prMap = new Map()
  let arr = new Array();

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

    if (data.battles == 0) continue

    let rWins = (data.wins / data.battles) / (expectedValues.win_rate / 100)
    let rFrags = (data.frags / data.battles) / expectedValues.average_frags
    let rDmg = data.damage_dealt / data.battles / expectedValues.average_damage_dealt

    let nDmg = Math.max(0, (rDmg - 0.4) / (1 - 0.4))
    let nFrags = Math.max(0, (rFrags - 0.1) / (1 - 0.1))
    let nWins = Math.max(0, (rWins - 0.7) / (1 - 0.7))

    let PR = 700 * nDmg + 300 * nFrags + 150 * nWins

    let arr2 = {
      name: memberName.body.data[members[i]].nickname,
      pr: Math.round(PR),
      battles: data.battles,
      dmg: Math.round(data.damage_dealt / data.battles),
      kills: Math.round((data.frags / data.battles) * 100) / 100,
      wr: Math.round((data.wins / data.battles) * 100)
    }

    arr.push(arr2);

    prMap.set(memberName.body.data[members[i]].nickname, Math.round(PR));
  }

  map = (new Map([...prMap.entries()].sort((a, b) => b[1] - a[1])))

  arr.sort(function(a, b) {
    if (a.pr > b.pr) {
      return -1;
    }
    if (b.pr > a.pr) {
      return 1;
    }
    return 0;
  });

  let field = []
  for (let i = 0; i < Math.min(10, arr.length); i++) {
    field.push({
      name: `${i + 1}.  ${arr[i].name}`,
      value: `PR:  ${arr[i].pr}\n Battles: ${arr[i].battles}\nDamage: ${arr[i].dmg}\nKills: ${arr[i].kills}\nWinrate: ${arr[i].wr}%`,
    })
  }

  let em = {
    title: `Clan: ${clanTag}\nShip: ${shipName}`,
    fields: field
  }

  return em;
}

module.exports.memberStats = memberStats;

// async function command(args) {
//   // m.channel.startTyping()
//   arr = await memberStats(args[0], args[1])
//   console.log("Got map");
//
//   // m.channel.send({
//   //   embed: em
//   // });
//   // m.channel.stopTyping()
//   console.log(arr);
// }
// command(['rng', 'daring'])

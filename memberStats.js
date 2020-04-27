console.log("Starting up");
const Discord = require('discord.js');
const client = new Discord.Client();

const superagent = require('superagent');
const async = require('async')
const fs = require('fs')

const clanSearchApi = 'https://api.worldofwarships.com/wows/clans/list/'
const memberIdApi = 'https://api.worldofwarships.com/wows/clans/info/'
const memberDataApi = 'https://api.worldofwarships.com/wows/ships/stats/'
const expectedPrApi = 'https://api.wows-numbers.com/personal/rating/expected/json/'
const memberNameApi = 'https://api.worldofwarships.com/wows/account/info/'
const apikey = "3e2c393d58645e4e4edb5c4033c56bd8"

async function handler(clanQuery, shipQuery) {
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

    let rWins = (data.wins / data.battles) / (expectedValues.win_rate / 100)
    let rFrags = (data.frags / data.battles) / expectedValues.average_frags
    let rDmg = data.damage_dealt / data.battles / expectedValues.average_damage_dealt

    let nDmg = Math.max(0, (rDmg - 0.4) / (1 - 0.4))
    let nFrags = Math.max(0, (rFrags - 0.1) / (1 - 0.1))
    let nWins = Math.max(0, (rWins - 0.7) / (1 - 0.7))

    let PR = 700 * nDmg + 300 * nFrags + 150 * nWins

    let arr2 = new Array();
    arr2.push(memberName.body.data[members[i]].nickname);
    arr2.push(Math.round(PR));
    arr2.push(data.battles);
    arr2.push(Math.round(data.damage_dealt/data.battles));
    arr2.push(Math.round((data.frags/data.battles)*100)/100);
    arr2.push(Math.round((data.wins/data.battles)*100));

    arr.push(arr2);

    prMap.set(memberName.body.data[members[i]].nickname, Math.round(PR));
  }

  map = (new Map([...prMap.entries()].sort((a, b) => b[1] - a[1])))

  arr.sort(function (a, b) {
        if (a[1] > b[1]) {
          return -1;
        }
        if (b[1] > a[1]) {
          return 1;
        }
        return 0;
      });

  return arr;
}

client.on('ready', () => {
  console.log(`Logged in!`);
});

client.on('message', (m) => {
  var content = m.content;
  if (content.startsWith("-")) {
    content = content.replace("-","")
    command(content.split(" "), m);
  }
});

async function command(args, m) {
  m.channel.startTyping()
  arr = await handler(args[0], args[1])
  console.log("Got map");
  let em = {
    title: "Clan: " + args[0] + "\nShip: " + args[1],
    fields: [
      {
        name: '1. ' + arr[0][0],
        value: 'PR: ' + arr[0][1] + '\n Battles: ' + arr[0][2] + '\nDamage: '+  arr[0][3] + '\nKills: ' + arr[0][4] + '\nWinrate: ' + arr[0][5] + '%',
      },
      {
        name: '2. ' + arr[1][0],
        value: 'PR: ' + arr[1][1] + '\n Battles: ' + arr[1][2] + '\nDamage: '+  arr[1][3] + '\nKills: ' + arr[1][4] + '\nWinrate: ' + arr[1][5] + '%',
      },
      {
        name: '3. ' + arr[2][0],
        value: 'PR: ' + arr[2][1] + '\n Battles: ' + arr[2][2] + '\nDamage: '+  arr[2][3] + '\nKills: ' + arr[2][4] + '\nWinrate: ' + arr[2][5] + '%',
      },
      {
        name: '4. ' + arr[3][0],
        value: 'PR: ' + arr[2][1] + '\n Battles: ' + arr[3][2] + '\nDamage: '+  arr[3][3] + '\nKills: ' + arr[3][4] + '\nWinrate: ' + arr[3][5] + '%',
      },
      {
        name: '5. ' + arr[4][0],
        value: 'PR: ' + arr[4][1] + '\n Battles: ' + arr[4][2] + '\nDamage: '+  arr[4][3] + '\nKills: ' + arr[4][4] + '\nWinrate: ' + arr[4][5] + '%',
      },
      {
        name: '6. ' + arr[5][0],
        value: 'PR: ' + arr[5][1] + '\n Battles: ' + arr[5][2] + '\nDamage: '+  arr[5][3] + '\nKills: ' + arr[5][4] + '\nWinrate: ' + arr[5][5] + '%',
      },
      {
        name: '7. ' + arr[6][0],
        value: 'PR: ' + arr[6][1] + '\n Battles: ' + arr[6][2] + '\nDamage: '+  arr[6][3] + '\nKills: ' + arr[6][4] + '\nWinrate: ' + arr[6][5] + '%',
      },
      {
        name: '8. ' + arr[7][0],
        value: 'PR: ' + arr[7][1] + '\n Battles: ' + arr[7][2] + '\nDamage: '+  arr[7][3] + '\nKills: ' + arr[7][4] + '\nWinrate: ' + arr[7][5] + '%',
      },
      {
        name: '9. ' + arr[8][0],
        value: 'PR: ' + arr[8][1] + '\n Battles: ' + arr[8][2] + '\nDamage: '+  arr[8][3] + '\nKills: ' + arr[8][4] + '\nWinrate: ' + arr[8][5] + '%',
      },
      {
        name: '10. ' + arr[9][0],
        value: 'PR: ' + arr[9][1] + '\n Battles: ' + arr[9][2] + '\nDamage: '+  arr[9][3] + '\nKills: ' + arr[9][4] + '\nWinrate: ' + arr[9][5] + '%',
      },
    ]
  }

  m.channel.send({ embed: em });
  m.channel.stopTyping()
}
client.login('NjcyMjU2ODg0MTc4Mjg4NjQ4.XqYTUw.X5eL23f-jX_dIh1qL8TLLY2Tg1M')
//handler('rng', 'daring')

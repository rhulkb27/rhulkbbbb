const superagent = require('superagent');
const async = require('async')
const Discord = require('discord.js');
const fs = require('fs')
const id = require('./id')
const pr = require('./graph')
const data = require('../utility/data')

const clanSearchApi = 'https://api.worldofwarships.com/wows/clans/list/'
const memberIdApi = 'https://api.worldofwarships.com/wows/clans/info/'
const memberDataApi = 'https://api.worldofwarships.com/wows/ships/stats/'
const expectedPrApi = 'https://api.wows-numbers.com/personal/rating/expected/json/'
const memberNameApi = 'https://api.worldofwarships.com/wows/account/info/'
const apikey = "3e2c393d58645e4e4edb5c4033c56bd8"

async function memberStats(clanQuery, shipQuery, isCompact) {

  var shipsJson = fs.readFileSync(`${__dirname}/../utility/ships.json`)

  var shipData = JSON.parse(shipsJson)

  var map = new Map(Object.entries(shipData))

  let clanId = await superagent.get(clanSearchApi).query({
    application_id: apikey,
    fields: 'clan_id',
    search: clanQuery
  })

  if (!clanId.body.data[0]) throw new Error('Please enter a valid clan.')

  let memberRequest = await superagent.get(memberIdApi).query({
    application_id: apikey,
    clan_id: clanId.body.data[0].clan_id,
    fields: 'members_ids,tag',
  })

  let members = memberRequest.body.data[clanId.body.data[0].clan_id].members_ids
  let clanTag = memberRequest.body.data[clanId.body.data[0].clan_id].tag

  // console.log(members);

  var shipData = id.shipid(shipQuery)

  if (!shipData.ship_id) throw new Error('Please enter a valid ship.')

  var shipId = shipData.ship_id
  var shipName = shipData.ship_name

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

    let PR = await pr.pr(data, shipId)

    let arr2 = {
      name: memberName.body.data[members[i]].nickname,
      pr: PR,
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
  let description = ''
  for (let i = 0; i < Math.min(10, arr.length); i++) {
    if (isCompact) {
      description += `**${i + 1}**. ${arr[i].name} (${arr[i].pr} pr over ${arr[i].battles} games)\n`
    } else {
      field.push({
        name: `${i + 1}.  ${arr[i].name}`,
        value: `PR:  ${arr[i].pr}\n Battles: ${arr[i].battles}\nDamage: ${arr[i].dmg}\nKills: ${arr[i].kills}\nWinrate: ${arr[i].wr}%`,
      })
    }
  }

  let embed = new Discord.MessageEmbed()
    .setColor('#66ffff')

  if (isCompact) {
    embed
      .setTitle(`Clan: ${clanTag}              Ship: ${shipName}`)
      .setDescription(description)
  } else {
    embed
      .setTitle(`Clan: ${clanTag}\nShip: ${shipName}`)
      .addFields(field)
  }

  return embed;
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

const superagent = require('superagent');
const async = require('async')
const fs = require('fs')

const apikey = '3e2c393d58645e4e4edb5c4033c56bd8'
const historyApi = 'https://clans.worldofwarships.com/clans/wows/ladder/api/battles/'

async function history(team = 1, length = 5) {
  // const clanTokenJson = fs.readFileSync(`${__dirname}/../utility/clanToken.json`)
  // var clanTokenObj = JSON.parse(clanTokenJson)
  //
  // let keyArray = Object.keys(clanTokenObj)
  // let clanToken = ''
  // for (var i = 0; i < keyArray.length; ++i) {
  //   if (keyArray[i].toLowerCase().includes(clanQuery.toLowerCase())) {
  //     clanToken = clanTokenObj[keyArray[i]]
  //     break
  //   }
  // }

  let historyData = await superagent.get(historyApi)
    .set({
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "wsauth_token=XnB788lFxSyTFM03_vwZOC_PlZJ3ZFKl1WkN5G_g3zReFCROcEWl6eAe2gZxDEwJ;"
    })
    .query({
      team: team
    })

  let fields = []
  for (let i = 0; i < Math.min(length, historyData.body.length); i++) {
    if (historyData.body[i].teams[0].rating_delta == 0) {
      fields.push({
        name: `**${historyData.body[i].teams[0].claninfo.tag} vs ${historyData.body[i].teams[1].claninfo.tag}**`,
        value: `result: ${historyData.body[i].teams[0].result}`
      })
    } else {
      fields.push({
        name: `**${historyData.body[i].teams[0].claninfo.tag} vs ${historyData.body[i].teams[1].claninfo.tag}**`,
        value: `result: ${historyData.body[i].teams[0].rating_delta}`
      })
    }
  }
  team = team == 1 ? 'Alpha' : 'Bravo'
  let embed = {
    title: `${historyData.body[0].teams[0].claninfo.tag} ${team} ${length} game history`,
    fields: fields
  }

  return embed
}

exports.history = history;

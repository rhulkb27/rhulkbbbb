const superagent = require('superagent');
const async = require('async')
const fs = require('fs')
const _ = require('lodash')
const Enmap = require("enmap");
const shipGenerator = require(`${__dirname}/../utility/shipGenerator`)
const cron = require('cron')
const plotly = require('plotly')('Shadow_Storm419', 'TxSRgxqeDWdxtwTxzt2H')


// linux
// const file1 = 'main/cmds/graphs/graph.png'
// const file2 = 'main/cmds/graphs/test.png'

// mac
const file1 = './graph.png'
const file2 = './test.png'

const graph = new Enmap({
  name: "graph"
})

const userDataApi = 'https://api.worldofwarships.com/wows/ships/stats/'
const expectedPrApi = 'https://api.wows-numbers.com/personal/rating/expected/json/'
const apikey = '3e2c393d58645e4e4edb5c4033c56bd8'
const id = 1023637668
const userIds = Object.values(graph.get('link'))

class ShipStats {
  constructor(games_list, all_stats, last_battle_time) {
    this.games_list = games_list
    this.all_stats = all_stats
    this.last_battle_time = last_battle_time
  }

  getGames() {
    return this.games_list
  }

  getlast_battle_time() {
    return this.last_battle_time
  }

  updateStats(updated_stats, last_battle_time) {
    this.last_battle_time = last_battle_time
    if (updated_stats.battles == this.all_stats.battles) return
    var newStatBlock = {
      damage_dealt: updated_stats.damage_dealt - this.all_stats.damage_dealt,
      wins: updated_stats.wins - this.all_stats.wins,
      frags: updated_stats.frags - this.all_stats.frags,
      battles: updated_stats.battles - this.all_stats.battles
    }
    this.all_stats = updated_stats
    this.games_list.push(newStatBlock)
  }

  async getPRGraph(ship_id) {
    var graph = [{
      x: [],
      y: [],
      type: 'scatter'
    }]
    var point = {
      damage_dealt: 0,
      wins: 0,
      frags: 0,
      battles: 0
    }
    for (var i = 0; i < this.games_list.length; i++) {
      point.damage_dealt += this.games_list[i].damage_dealt
      point.wins += this.games_list[i].wins
      point.frags += this.games_list[i].frags
      point.battles += this.games_list[i].battles
      let pr = await generatePR(point, ship_id)
      graph[0].x.push(point.battles)
      graph[0].y.push(pr)
    }
    return graph
  }

  getWRGraph() {
    var graph = [{
      x: [],
      y: [],
      type: 'scatter'
    }]
    for (var i = 0; i < this.games_list.length; i++) {
      point.wins += this.games_list[i].wins
      point.battles += this.games_list[i].battles
      let wr = point.wins / point.battles
      graph[0].x.push(point.battles)
      graph[0].y.push(wr)
    }
    return graph
  }

  static cast(object) {
    return new ShipStats(object.games_list, object.all_stats, object.last_battle_time)
  }
}

function updateHandler() {
  for (var i = 0; i < userIds.length; i++) {
    update(userIds[i])
  }
}

function initHandler() {
  for (var i = 0; i < userIds.length; i++) {
    init(userIds[i])
  }
}

function debug() {
  console.log(graph)
}

async function update(playerid) {

  console.log('test');

  let prevStats = await graph.get(playerid)

  let updated_stats = await superagent.get(userDataApi).query({
    application_id: apikey,
    account_id: playerid,
    fields: 'last_battle_time, ship_id, pvp.battles, pvp.damage_dealt, pvp.wins, pvp.frags'
  })

  updated_stats = updated_stats.body.data[playerid]

  // let testData = fs.readFileSync(`${__dirname}/../playerData/1023637668.json`)
  //
  // let updaed = JSON.parse(testData)

  let stats

  for (var i = 0; i < updated_stats.length; i++) {
    if (prevStats[updated_stats[i].ship_id].last_battle_time < updated_stats[i].last_battle_time) {
      let prevShipStats = graph.get(playerid, updated_stats[i].ship_id)
      prevShipStats = ShipStats.cast(prevShipStats)
      if (!prevShipStats) {
        graph.set(playerid, new ShipStats([updated_stats[i].pvp], updated_stats[i].pvp, updated_stats[i].last_battle_time),
          updated_stats[i].ship_id)
        continue
      }
      prevShipStats.updateStats(updated_stats[i].pvp, updated_stats[i].last_battle_time)
      graph.set(playerid, prevShipStats, updated_stats[i].ship_id)
    }
  }

  // for (var i = 0; i < updated_stats.length; i++) {
  //   if (prevStats[updated_stats[i].ship_id].getlast_battle_time() < updated_stats[i].last_battle_time) {
  //     stats = new ShipStats(prevStats[shipTimeList[i].ship_id), shipTimeList[i].pvp)
  //     stats.updateStats(updated[i].pvp, updated[i].last_battle_time)
  //   }
  // }

}

async function generatePR(data, ship_id) {
  let ship_expected_values = graph.get('expected_values', ship_id)

  let rWins = (data.wins / data.battles) / (ship_expected_values.win_rate / 100)
  let rFrags = (data.frags / data.battles) / ship_expected_values.average_frags
  let rDmg = data.damage_dealt / data.battles / ship_expected_values.average_damage_dealt

  let nDmg = Math.max(0, (rDmg - 0.4) / (1 - 0.4))
  let nFrags = Math.max(0, (rFrags - 0.1) / (1 - 0.1))
  let nWins = Math.max(0, (rWins - 0.7) / (1 - 0.7))

  let PR = 700 * nDmg + 300 * nFrags + 150 * nWins

  return Math.round(PR)
}



async function init(playerid) {

  // graph.clear()

  await shipGenerator.shipGenerator()

  let expected_values = await superagent.get(expectedPrApi)
  expected_values = expected_values.body.data

  graph.set('expected_values', expected_values)

  let playerstats = await superagent.get(userDataApi).query({
    application_id: apikey,
    account_id: playerid,
    fields: 'last_battle_time, ship_id, pvp.battles, pvp.damage_dealt, pvp.wins, pvp.frags'
  })

  playerstats = playerstats.body.data[playerid]

  // test data
  // let testData = fs.readFileSync(`${__dirname}/../playerData/1023637668.json`)
  // let playerstats = JSON.parse(testData)

  graph.ensure(playerid.toString(), {})

  for (var i = 0; i < playerstats.length; i++) {
    graph.ensure(playerid.toString(), new ShipStats([playerstats[i].pvp], playerstats[i].pvp, playerstats[i].last_battle_time),
      playerstats[i].ship_id)
  }

  // console.log(graph.get('1036358248'));
}

async function sendGraph(discord_id, shipQuery, isPR = true) {

  let player_id = graph.get('link', discord_id)

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

  let trace
  if (isPR) {
    trace = await (ShipStats.cast(graph.get(player_id, ship_id))).getPRGraph(ship_id)
  } else {
    trace = await (ShipStats.cast(graph.get(player_id, ship_id))).getWRGraph(ship_id)
  }
  // console.log(graph.get('ship_id'));
  var layout = {
    title: `PR Chart of ${graph.get('ship_id')[ship_id].normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`,
    xaxis: {
      dtick: 1,
    }
  }

  let figure = {
    'data': trace,
    layout: layout
  }

  let imgOpts = {
    format: 'png',
  }

  // plotly.getImage(figure, imgOpts, function(error, imageStream) {
  //   if (error) return console.log(error)
  //
  //   // let fileStream = fs.createWriteStream(`${__dirname}/cmds/graphs/graph.png`)
  //   let fileStream = fs.createWriteStream('main/cmds/graphs/graph.png')
  //   imageStream.pipe(fileStream)
  // })
  // console.log(JSON.stringify(figure));
  // console.log(imgOpts);


  await generateImage(figure, imgOpts)
  fs.copyFileSync(file1, file2);
  fs.unlinkSync(file2)
}

function generateImage(figure, imgOpts) {
  return new Promise((resolve, reject) => {
    plotly.getImage(figure, imgOpts, (err, imageStream) => {
      if (err) return reject(err);
      var fileStream = fs.createWriteStream(file1);
      imageStream.pipe(fileStream);
      fileStream.on('error', reject);
      fileStream.on('finish', resolve);
    })
  })
}

async function main() {
  // await init(id)
  // await update(id)
  // await test()
  // const job = cron.job('*/20 * * * *', () => updateHandler())
  // job.start()
  // sendGraph()
}

// main()
module.exports.init = initHandler
module.exports.graph = sendGraph
module.exports.update = updateHandler
module.exports.debug = debug







async function test() {
  let test = await (ShipStats.cast(graph.get(id, '4076746192'))).getPRGraph(4076746192)
  console.log(test)

  // let memberRequest = await superagent.get(userDataApi).query({
  //   application_id: apikey,
  //   account_id: playerid,
  //   fields: 'last_battle_time, ship_id, pvp.battles, pvp.damage_dealt, pvp.wins, pvp.frags'
  // })
  //
  // var updated = memberRequest.body.data[playerid]
  //
  // let shipTimeList = JSON.parse(fs.readFileSync(`${__dirname}/../playerData/${playerid}.json`))
  //
  // for (var i = 0; i < updated.length; i++) {
  //   if (Math.floor(Date.now() / 1000) - updated[i].last_battle_time < 1200) {
  //     let prevStats = playerData.get(shipTimeList[i].ship_id)
  //     let newStats = updated[i].pvp
  //     console.log(prevStats)
  //     if (prevStats) {
  //       let lastGame = {
  //         damage_dealt: newStats.damage_dealt - prevStats.damage_dealt,
  //         wins: newStats.wins - prevStats.wins,
  //         frags: newStats.frags - prevStats.frags,
  //         battles: newStats.battles - prevStats.battles
  //       }
  //     } else {
  //       let lastGame = newStats
  //     }
  //     console.log(lastGame);
  // let updated_stats = playerData.get(shipTimeList[i].ship_id)
  // updated_stats.push(lastGame)
  // playerData.set(shipTimeList[i].ship_id, updated_stats)

  // playerData.set(shipTimeList[i].ship_id,
  // console.log(map.get(shipTimeList[i].ship_id.toString()))
  // console.log(shipTimeList[i].ship_id)
  //   }
  // }
  // console.log(playerData)
}

// init()
// update()

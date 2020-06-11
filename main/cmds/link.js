const superagent = require('superagent')
const Enmap = require("enmap");
const id = require('./id')
const update = require('./graph')

const graph = new Enmap({
  name: "graph"
})

async function link(discord_id, username) {
  let playerid = await id.id(username)
  graph.set('link', {
    id: playerid.data['account_id'].toString(),
    name: playerid.data['nickname']
  }, discord_id)
  await update.initId(playerid.data['account_id'], discord_id)
  return playerid.data['nickname']
}

function listLinks() { 
  return JSON.stringify(graph.get('link'))
}

function clear() {
  graph.set('link', {})
}

module.exports.link = link
module.exports.listLinks = listLinks
module.exports.clear = clear

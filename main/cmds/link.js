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
    id: playerid.data['account_id'],
    name: playerid.data['nickname']
  }, discord_id)
  update.initId(playerid.data['account_id'], discord_id)
  return playerid.data['nickname']
}

function listLinks() {
  return JSON.stringify(graph.get('link'))
}

function clear() {
  let clear = graph.observable('link')
  clear = {}
}

module.exports.link = link
module.exports.listLinks = listLinks

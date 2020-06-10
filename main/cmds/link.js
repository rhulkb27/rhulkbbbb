const superagent = require('superagent')
const Enmap = require("enmap");
const id = require('./id')

const graph = new Enmap({
  name: "graph"
})

async function link(discord_id, username) {
  let playerid = await id.id(username)
  graph.set('link', playerid.data['account_id'], discord_id)
  return playerid.data['nickname']
}

function listLinks() {
  return JSON.stringify(graph.get('link'))
}

module.exports.link = link
module.exports.listLinks = listLinks

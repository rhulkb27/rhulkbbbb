const superagent = require('superagent')
const id = require('./id')
const update = require('./graph')
const data = require('../utility/data')

async function link(discord_id, username) {
  let playerid
  try {
    playerid = await id.id(username)
  } catch (err) {
    throw new Error('Please enter a valid username.')
  }
  await data.graph.set('link', {
    id: playerid.data['account_id'].toString(),
    name: playerid.data['nickname']
  }, discord_id)
  console.log(data.graph.get('link', discord_id))
  await update.initId(playerid.data['account_id'], discord_id)
  return playerid.data['nickname']
}

function listLinks() {
  return JSON.stringify(data.graph.get('link'))
}

function clear() {
  data.graph.set('link', {})
}

module.exports.link = link
module.exports.listLinks = listLinks
module.exports.clear = clear

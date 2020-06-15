const superagent = require('superagent')
const id = require('./id')
const update = require('./graph')
const data = require('../utility/data')


async function add(username) {
  let playerid
  try {
    playerid = await id.id(username)
    playerid = playerid.data
  } catch (err) {
    throw new Error('Please enter a valid username.')
  }

  data.enmap.push('ids', playerid.account_id)
  data.enmap.push('usernames', playerid.nickname)

  update.initId(playerid.account_id)
  return playerid.nickname
}

async function link(discord_id, username) {
  let playerid
  try {
    playerid = (await id.id(username)).data
  } catch (err) {
    throw new Error('Please enter a valid username.')
  }
  if (!data.enmap.get('ids').includes(playerid.account_id)) throw new Error(`\`${playerid.nickname}\` is not in the database.`)
  data.enmap.set('link', playerid.account_id, discord_id)
  console.log(data.enmap.get('link'))
  return playerid.nickname
}

function listLinks() {
  return JSON.stringify(data.enmap.get('link'))
}

function clear() {
  data.enmap.set('link', {})
}

exports.add = add
exports.link = link
exports.listLinks = listLinks
exports.clear = clear

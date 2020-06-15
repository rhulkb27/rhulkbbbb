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

async function importUsers(users) {
  users = JSON.parse(users)
  Object.keys(users).forEach(function(item) {
    if (!users[item]) return
    data.enmap.push('ids', users[item].id)
    data.enmap.push('usernames', users[item].name)
    update.initId(users[item].id)
  })
}

function listLinks() {
  return JSON.stringify({
      ids: data.enmap.get('ids'),
      names: data.enmap.get('usernames')
  })
}

function clear() {
  data.enmap.set('link', {})
}

exports.add = add
exports.link = link
exports.importUsers = importUsers
exports.listLinks = listLinks
exports.clear = clear

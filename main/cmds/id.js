const superagent = require('superagent');
const async = require('async')

const usernameApi = 'https://api.worldofwarships.com/wows/account/list/'
const application_id = '3e2c393d58645e4e4edb5c4033c56bd8'

async function idGetter(search) {
  let id = await superagent.get(usernameApi).query({
    application_id: application_id,
    search: search
  })
  return id.body.data[0]['nickname'] + id.body.data[0]['account_id']
}

module.exports.id = idGetter

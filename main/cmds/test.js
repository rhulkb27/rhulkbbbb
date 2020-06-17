// const Enmap = require("enmap");
// const test = new Enmap({name: "test"});
//
// test.set("kek", {})
// test.observe('kek')
// test.destroy()

const data = require('../utility/data')
const superagent = require('superagent')
const update = require('./graph')

// console.log(data.enmap.get(1037870425));
// data.enmap.set('link', {})
//

async function test() {
  const idList = [1031838820, 1028074488, 1023637668, 1034164076, 1036358248]
  const usernameList = ['SageLiev', 'Nightlock_', 'Shadow_Storm419', 'Maxitaxi55555', 'rhulkb27']
  const clanSearchApi = 'https://api.worldofwarships.com/wows/clans/list/'
  const memberIdApi = 'https://api.worldofwarships.com/wows/clans/info/'
  const memberNameApi = 'https://api.worldofwarships.com/wows/account/info/'
  const apikey = "3e2c393d58645e4e4edb5c4033c56bd8"

  data.enmap.set('ids', {})

  let clanQuery = 'ggwp'

  let clanId = await superagent.get(clanSearchApi).query({
    application_id: apikey,
    fields: 'clan_id',
    search: clanQuery
  })

  let memberRequest = await superagent.get(memberIdApi).query({
    application_id: apikey,
    clan_id: clanId.body.data[0].clan_id,
    fields: 'members_ids,tag',
  })

  let members = memberRequest.body.data[clanId.body.data[0].clan_id].members_ids

  for (var i = 0; i < members.length; i++) {
    let memberName = (await superagent.get(memberNameApi).query({
      application_id: apikey,
      account_id: members[i],
      fields: 'nickname'
    })).body.data[members[i]].nickname
    data.enmap.observe('ids')[members[i]] = memberName
    update.initId(members[i])
  }

  console.log(data.enmap.get('ids'))
}
exports.test = test

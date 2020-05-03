const superagent = require('superagent')
const fs = require('fs')

const api = 'https://api.worldofwarships.com/wows/encyclopedia/ships/'
const key = '3e2c393d58645e4e4edb5c4033c56bd8'

var ships;
var map = new Map();
async function handler() {
  for (let i = 1; i < 6; i++) {
    ships = await superagent.get(api).query({
      application_id: key,
      fields: 'ship_id, name, has_demo_profile',
      page_no: i
    })
    Object.keys(ships.body.data).forEach(key => {
      if (!ships.body.data[key].name.includes('[') && !ships.body.data[key].has_demo_profile) {
        map.set(ships.body.data[key].name, key)
      }
    });
  }
  let obj = Array.from(map).reduce((obj, [key, value]) => (
    Object.assign(obj, { [key]: value })
  ), {});
  fs.writeFileSync('ships.json', JSON.stringify(obj))
}

handler()

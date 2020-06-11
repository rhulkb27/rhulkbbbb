const superagent = require('superagent')
const fs = require('fs')
const Enmap = require("enmap");
const _ = require('lodash')

const graph = new Enmap({
  name: "graph"
});

const api = 'https://api.worldofwarships.com/wows/encyclopedia/ships/'
const key = '3e2c393d58645e4e4edb5c4033c56bd8'

var ships;
var map = new Map();
var badShips = ["Alaska B", "Asashio B", "Atago B", "Tirpitz B", "Massachusetts B", "Graf Zeppelin B", "Sims B"]

async function handler() {
  for (let i = 1; i < 6; i++) {
    ships = await superagent.get(api).query({
      application_id: key,
      fields: 'ship_id, name, has_demo_profile',
      page_no: i
    })
    Object.keys(ships.body.data).forEach(key => {
      if (!ships.body.data[key].name.includes('[') && !ships.body.data[key].has_demo_profile) {
        if (!badShips.includes(ships.body.data[key].name))
          map.set(ships.body.data[key].name, key)
      }
    });
  }
  let obj = Array.from(map).reduce((obj, [key, value]) => (
    Object.assign(obj, {
      [key]: value
    })
  ), {})
  graph.set('name_to_id', obj)
  graph.set('ship_id', _.invert(obj))
  // console.log(graph.get('ship_id'));
  // console.log(graph.get('name_to_id'));
}

module.exports.shipGenerator = handler;
// handler()

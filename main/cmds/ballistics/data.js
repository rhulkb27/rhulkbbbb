const superagent = require('superagent');
const Enmap = require("enmap");
const _ = require('lodash')
const ballistics = require('./ballistics')
const id = require('../id')

const enmap = new Enmap({
  name: "ballistics"
})

const url = 'https://api.github.com/repos/jcw780/LiveGameData/contents/0.9.5.0'
const range_url = 'https://api.worldofwarships.ru/wows/encyclopedia/ships/'
const apikey = '3e2c393d58645e4e4edb5c4033c56bd8'
const header = {
  'User-Agent': 'beb bot'
}

// console.dir(Object.keys(enmap.get('ballistics_data')), {'maxArrayLength': null});

async function generateBallisticsGraph(shipQuery, isStock = false, isAp = true) {
  let ship_name
  let ship_data
  let ballistics_data = enmap.get('ballistics_data')
  let keyArray = Object.keys(ballistics_data)
  for (var i = 0; i < keyArray.length; i++) {
    if (keyArray[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '').replace('-', '').toLowerCase().includes(shipQuery.toLowerCase())) {
      ship_data = ballistics_data[keyArray[i]]
      ship_name = keyArray[i];
      break
    }
  }

  let shell_type = isAp ? 'AP' : 'HE'

  const ship_id = (await id.shipid(shipQuery)).ship_id
  let range = (await superagent.get(range_url).query({
    application_id: apikey,
    ship_id: ship_id,
    fields: 'default_profile.artillery.distance'
  })).body.data[ship_id].default_profile.artillery.distance

  range *= 1.4 * 1000

  if ('Artillery1' in ship_data && !isStock) await ballistics.getBallistics(ship_data.Artillery1[shell_type], range, ship_name)
  else await ballistics.getBallistics(ship_data.Artillery0[shell_type], range, ship_name)
}

// init()
// generateBallisticsGraph('grozo')

const badShips = ['PRSD109_Pr_48_Kiev', 'PRSD108_Pr_20i_Tashkent', 'PRSD106_Pr_30_Ognevoy', 'PRSD105_Pr_7_Gnevny', 'PFSC810_Henri_IV', 'PWSD910_Lappland', 'PRSD210_Grozovoy_pr_40N', 'PRSB538_V_I_Lenin'];

async function init() {
  let data = (await superagent.get(url).set(header)).body
  let ballistic_stats = {}
  for (const entry of data) {
    if (entry.name == 'nations.json' || entry.name == 'Events') continue
    let nation_stats = (await superagent.get(entry.url).set(header)).body
    for (const item of nation_stats) {
      if (item.name == 'shiptypes.json') continue
      Object.assign(ballistic_stats, JSON.parse((await superagent.get(item.download_url).set(header)).text))
    }
  }
  enmap.set('ballistics_data', ballistic_stats);

  var ballistics_data = enmap.get('ballistics_data')
  var keys = Object.keys(ballistics_data)
  for (const key of keys) {
    let new_key = getName(key, ballistics_data)
    if (!new_key) continue
    changeKey(key, new_key, ballistics_data)
  }
  enmap.set('ballistics_data', ballistics_data)
}

function changeKey(old_key, new_key, object) {
  if (old_key !== new_key) {
    Object.defineProperty(object, new_key,
      Object.getOwnPropertyDescriptor(object, old_key));
    delete object[old_key];
  }
}

function getName(key, ballistics_data) {
  switch (key) {
    case 'PJSD025_True_Kamikaze':
      return 'Kamikaze'
    case 'PZSB509_Izumo_Bajie':
      return 'Bajie'
    case 'PRSC001_Avrora_1917':
      return 'Aurora'
    case 'PRSC107_Schors':
      return 'Shchors'
    case 'PRSC106_Pr_94_Budeny':
      return 'Budyonny'
    case 'PRSC108_Pr_68_Chapaev':
      return 'Chapayev'
    case 'PRSD107_Pr_35_Udaloy':
      return 'Udaloi'
    case 'PRSD206_Pr_7':
      return 'Gnevny'
    case 'PRSD208_Pr_30':
      return 'Ognevoi'
    case 'PRSD308_Pr_48':
      return 'Kiev'
    case 'PRSD910_Grozovoy_pr_40N':
      return 'Grozovoi'
    case 'PRSC109_Dmitry_Donskoy':
      return 'Dmitri Donskoi'
    case 'PFSB110_France':
      return 'République'
  }
  let name = key.split('_')
  if (badShips.includes(key) || _.intersection(name, ['TST', 'Black', 'Asus', 'KIM', 'Camo', 'Dragon', 'event', 'Event']).length > 0) {
    delete ballistics_data[key]
    return
  }
  console.log(name);
  if (!['V', 'G', 'T', 'Z'].includes(name[1])) {
    name = name.filter(function(name) {
      return !/\d/g.test(name)
    })
  }
  name = _.difference(name, ['AZUR', 'pr', 'Pr', 'HSF', 'SM'])
  return name.join(' ')
}

exports.generateBallisticsGraph = generateBallisticsGraph

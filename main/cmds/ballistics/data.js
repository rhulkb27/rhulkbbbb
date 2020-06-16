const superagent = require('superagent');
const Discord = require('discord.js');
const plotly = require('plotly')('Shadow_Storm419', 'TxSRgxqeDWdxtwTxzt2H')
const fs = require('fs')
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

// console.dir(Object.keys(enmap.get('ballistics_data')), {
//   'maxArrayLength': null
// });

async function test(client, message) {
  let embed = new Discord.MessageEmbed()
    .setColor('#6a0dad')
    .setTitle('Ballistics Graph Creation Menu')
    .setDescription('Use the reactions to add or remove ships, exit the menu, or change shell types.\n📎: add ship\n📈: graph ballistics of added ships\n🚫: close menu')
    .setTimestamp()
  embed = await message.channel.send({
    embed
  })
  let ship_list = []
  recusiveTest(client, embed, message.author, ship_list)
}
async function recusiveTest(client, message, author, ship_list) {
  await message.react('📎')
  if (ship_list.length > 0) await message.react('📈')
  await message.react('🚫')
  const filter = (reaction, user) => {
    return ['📎', '📈', '🚫'].includes(reaction.emoji.name) && user.id == author.id;
  }
  // try {
    let reaction = await message.awaitReactions(filter, {
      max: 1,
      time: 30000
    })
    message.reactions.removeAll()
    switch (reaction.keys().next().value) {
      case '📎':
        console.log(ship_list)
        console.log('Adding new ship...')
        ship_list.push(await getShip(client, message, author.id))
        console.log(`${ship_list[ship_list.length - 1].ship_name} added!`)
        //make it nicer
        let embed = new Discord.MessageEmbed()
          .setColor('#6a0dad')
          .setTitle('Ballistics Graph Creation Menu')
          .setDescription('Use the reactions to add or remove ships, exit the menu, or change shell types.')
          .setTimestamp()
        for (var i = 0; i < ship_list.length; i++) {
          embed.addField(`${i + 1})`, `Ship: ${ship_list[i].ship_name}\nAmmo: ${ship_list[i].shell_type}\nGuns: ${ship_list[i].gun_type}`) // make it so u can change ammo
        }
        await message.edit({
          embed
        })
        recusiveTest(client, message, author, ship_list)
        break
      case '📈':
        console.log('Generating ballistics graph...')
        console.log(ship_list)
        await generateBallisticsGraph(ship_list)
        const attachment = new Discord.MessageAttachment('./ballistics.png')
        message.channel.send('', attachment)
        message.delete()
        console.log('Done!')
      case '🚫':
        message.delete()
    }
  // } catch (error) {
  //
  // }
}

async function getShip(client, message, user_id) {
  var filter = response => {
    return response.author.id == user_id
  }
  let embed = new Discord.MessageEmbed()
    .setColor('#6a0dad')
    .setTitle('Ballistics Graph Creation Menu')
    .setDescription('Type your new ship.')
    .setTimestamp()
  await message.edit({
    embed
  })
  let shipQueryMessage = (await message.channel.awaitMessages(filter, {
    max: 1,
    time: 15000
  })).first()
  shipQueryMessage.delete()
  let shipQuery = shipQueryMessage.content
  let ballistics_data = enmap.get('ballistics_data')
  let keyArray = Object.keys(ballistics_data)
  let ship_name
  let shell_type
  let gun_type
  for (var i = 0; i < keyArray.length; i++) {
    if (keyArray[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '').replace('-', '').replace('ß', 'ss').toLowerCase().includes(shipQuery.toLowerCase())) {
      ship_name = keyArray[i];
      break
    }
  }
  console.log(`Ship name is ${ship_name}`)
  embed = new Discord.MessageEmbed()
    .setColor('#6a0dad')
    .setTitle('Ballistics Graph Creation Menu')
    .setDescription('Choose either HE or AP.\n🟠: HE\n⚪: AP')
    .setTimestamp()
  await message.edit({
    embed
  })

  await message.react('🟠')
  await message.react('⚪')
  filter = (reaction, user) => {
    return ['🟠', '⚪'].includes(reaction.emoji.name) && user.id == user_id;
  }
  try {
    let reaction = await message.awaitReactions(filter, {
      max: 1,
      time: 30000
    })
    message.reactions.removeAll()
    if (reaction.keys().next().value == '🟠') shell_type = 'HE'
    else shell_type = 'AP'
    console.log(`Shell type set to ${shell_type}`)
  } catch (error) {}

  filter = (reaction, user) => {
    return ['🔴', '🔵'].includes(reaction.emoji.name) && user.id == user_id;
  }

  if (ballistics_data[ship_name].ammo_num == 2) {
    let gun_choice_1 = ballistics_data[ship_name].Artillery0[shell_type].name
    let gun_choice_2 = ballistics_data[ship_name].Artillery1[shell_type].name
    embed = new Discord.MessageEmbed()
      .setColor('#6a0dad')
      .setTitle('Ballistics Graph Creation Menu')
      .setDescription(`Choose which gun to use.\n🔴: ${gun_choice_1}\n🔵: ${gun_choice_2}`)
      .setTimestamp()
    await message.edit({
      embed
    })
    await message.react('🔴')
    await message.react('🔵')
    try {
      let reaction = await message.awaitReactions(filter, {
        max: 1,
        time: 30000
      })
      message.reactions.removeAll()
      if (reaction.keys().next().value == '🔴') gun_type = gun_choice_1
      else gun_type = gun_choice_2
    } catch (error) {}
  } else {
    gun_type = ballistics_data[ship_name].Artillery0[shell_type].name
  }

  return {
    ship_name,
    shell_type,
    gun_type
  }
}


async function generateBallisticsGraph(ship_names, isShortCmd = false, isStock = false, isAp = 'AP') {

  let figure = {
    'data': [],
    layout: {
      title: `Ballistics`,
      yaxis: {
        title: 'Penetration',
      },
      yaxis2: {
        title: 'Time',
        overlaying: 'y',
        side: 'right'
      },
      xaxis: {
        dtick: 1000,
      }
    }
  }

  let imgOpts = {
    format: 'png',
    height: 600,
    width: 1000
  }

  let ballistics_data = enmap.get('ballistics_data')
  for (var i = 0; i < ship_names.length; i++) {
    let ship_name
    let shell_type = isAp
    if (isShortCmd) {
      let keyArray = Object.keys(ballistics_data)
      for (var a = 0; a < keyArray.length; a++) {
        if (keyArray[a].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '').replace('-', '').replace('ß', 'ss').toLowerCase().includes(ship_names[i].toLowerCase())) {
          ship_name = keyArray[a];
          break
        }
      }
    } else {
      shell_type = ship_names[i].shell_type
      ship_name = ship_names[i].ship_name
    }

    let ship_data = ballistics_data[ship_name]
    // console.log({ship_data.Artillery0, ship_name});

    const ship_id = (await id.shipid(ship_name)).ship_id
    let range
    if (!ship_id) {
      range = 20000
    } else {
      range = (await superagent.get(range_url).query({
        application_id: apikey,
        ship_id: ship_id,
        fields: 'default_profile.artillery.distance'
      })).body.data[ship_id].default_profile.artillery.distance

      range *= 1.4 * 1000
    }

    let ballistics_obj

    if (isShortCmd) {
      if (ship_data.hasOwnProperty('Artillery1') && !isStock) ballistics_obj = await ballistics.getBallistics(ship_data.Artillery1[shell_type], range, ship_name)
      else ballistics_obj = await ballistics.getBallistics(ship_data.Artillery0[shell_type], range, ship_name)
    } else {
      let array = Object.values(ship_data)
      ship_data = array.find(obj => obj[shell_type].name == ship_names[i].gun_type)
      ballistics_obj = await ballistics.getBallistics(ship_data[shell_type], range, ship_name)
    }

    ship_name = ship_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ß', 'ss')

    figure.data.push({
      x: ballistics_obj.distance,
      y: ballistics_obj.armor,
      name: `${ship_name} Penetration`,
      type: 'scatter'
    })
    figure.data.push({
      x: ballistics_obj.distance,
      y: ballistics_obj.time,
      name: `${ship_name} Time`,
      yaxis: 'y2',
      type: 'scatter'
    })
    console.log(ship_name)
    // console.log(figure.data)
  }

  await generateImage(figure, imgOpts)

}

function generateImage(figure, imgOpts, name) {
  return new Promise((resolve, reject) => {
    plotly.getImage(figure, imgOpts, (err, imageStream) => {
      if (err) return reject(err)
      var fileStream = fs.createWriteStream(`./ballistics.png`)
      imageStream.pipe(fileStream)
      fileStream.on('error', reject)
      fileStream.on('finish', resolve)
    })
  })
}

// init()
// generateBallisticsGraph('grozo')

const badShips = ['PRSD109_Pr_48_Kiev', 'PRSD108_Pr_20i_Tashkent', 'PRSD106_Pr_30_Ognevoy', 'PRSD105_Pr_7_Gnevny', 'PFSC810_Henri_IV', 'PWSD910_Lappland', 'PRSD210_Grozovoy_pr_40N', 'PRSB538_V_I_Lenin', 'PGSB910_Grossdeutschland'];

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
  console.log('init finished!');
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
    case 'PGSB110_Grossdeutschland':
      return 'Großer Kurfürst'
  }
  let name = key.split('_')
  if (badShips.includes(key) || _.intersection(name, ['TST', 'Black', 'Asus', 'KIM', 'Camo', 'Dragon', 'event', 'Event']).length > 0) {
    delete ballistics_data[key]
    return
  }
  if (!['V', 'G', 'T', 'Z'].includes(name[1])) {
    name = name.filter(function(name) {
      return !/\d/g.test(name)
    })
  } else {
    name = name.splice(1)
  }
  name = _.difference(name, ['AZUR', 'pr', 'Pr', 'HSF', 'SM'])
  return name.join(' ')
}

exports.generateBallisticsGraph = generateBallisticsGraph
exports.test = test

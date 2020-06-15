require('dotenv').config({
  path: __dirname + '/../.env'
});

const {
  Client,
  Attachment
} = require('discord.js');

const bot = new Client();
const fs = require('fs')
const cron = require('cron')
const memberStats = require('./cmds/memberStats')
const history = require('./cmds/history')
const graph = require('./cmds/graph')
const id = require('./cmds/id')
const link = require('./cmds/link')
const help = require('./cmds/help')
const test = require('./cmds/test')

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  graph.init()
  const initStats = cron.job('0 3 * * *', () => graph.init())
  const updateStats = cron.job('*/10 * * * *', () => graph.update())
  initStats.start()
  updateStats.start()
});

bot.on('message', async message => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

  var command = message.content.toLowerCase().slice(process.env.PREFIX.length).split(' ')[0];

  var args = message.content.split(' ').slice(1);

  switch (command) {

    case 'help':
      message.channel.send({
        embed: help.help()
      })
      break

    case 'ct':
    case 'clantop':
      try {
        let mode = args[2] == 'c' ? true : false
        var data = await memberStats.memberStats(args[0], args[1], mode)
        message.channel.send({
          embed: data
        })
      } catch (err) {
        message.channel.send(err.message)
      }
      break

    case 'h':
      // message.channel.startTyping()
      //
      // console.log('' + args[0] + args[1] + args[2]);
      //
      // var data = await history.history(args[0], args[1], args[2])
      // message.channel.send({
      //   embed: data
      // })
      break

    case 'g':
    case 'graph':
      var user = message.author.id
      var shipQuery = args[0]
      var mode = args[1]
      if (args[1]) {
        shipQuery = args[1]
        mode = args[2]
        try {
          user = getUserFromMention(args[0]).id
        } catch (err) {
          user = {
            username: args[0]
          }
        }
      }
      // try {
        await graph.graph(user, shipQuery, mode)
        const attachment = new Attachment('./graph.png')
        message.channel.send('', attachment)
      // } catch (err) {
      //   message.channel.send(err.message)
      // }
      break

    case 'u':
    case 'update':
      graph.update()
      message.channel.send('Stats have been updated.')
      break

    case 'init':
      graph.init()
      break

    case 'id':
      let userid = await id.id(args[0])
      message.channel.send(userid.response)
      break

    case 'shipid':
      let shipid = await id.shipid(args[0])
      message.channel.send(`${shipid.ship_name}: ${shipid.ship_id}`)
      break

    case 'a':
    case 'add':
      // try {
        var response = await link.add(args[0])
        message.channel.send(`\`${response}\` added to database.`)
      // } catch (err) {
      //   message.channel.send(err.message)
      // }
      break

    case 'link':
      var user = message.author
      var name = args[0]
      if (args[1]) {
        user = getUserFromMention(args[0])
        name = args[1]
      }
      try {
        var response = await link.link(user.id, name)
        message.channel.send(`${user} has been linked to \`${response}\``)
      } catch (err) {
        message.channel.send(err.message)
      }
      break

    case 'll':
    case 'listLinks':
      message.channel.send(link.listLinks())
      break

    case 'i':
    case 'import':
      link.importUsers(args[0])
      break
      // case 'clear':
      //   link.clear()
      //   break

    case 'debug':
    case 'listGraph':
      graph.debug(args[0])
      break
    case 'test':
      test.test()
      break
  }

})

function getUserFromMention(mention) {
  if (!mention) return;

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1)

    if (mention.startsWith('!')) {
      mention = mention.slice(1)
    }
    return bot.users.get(mention)
  } else {
    throw new Error('Please enter an actual user')
  }
}

bot.login();

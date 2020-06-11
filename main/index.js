require('dotenv').config({path: __dirname + '/../.env'});

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

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  graph.init()
  const job = cron.job('*/10 * * * *', () => graph.update())
  job.start()
});

bot.on('message', async message => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

  var command = message.content.toLowerCase().slice(process.env.PREFIX.length).split(' ')[0];

  var args = message.content.split(' ').slice(1);

  switch (command) {

    case 'm':

      var data = await memberStats.memberStats(args[0], args[1])
      // var text = ''
      // for (let i = 0; i < Math.min(15, data.size); i++) {
      //   text += `${Array.from(data)[i][0]}: ${Array.from(data)[i][1]}\n`
      // }
      // message.channel.send(text)
      message.channel.send({
        embed: data
      })
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
      // linux
      // const file = 'main/cmds/graphs/graph.png'

      // mac
      const file = './graph.png'

      var user = message.author
      var shipQuery = args[0]
      if (args[1]) {
        user = getUserFromMention(args[0])
        shipQuery = args[1]
      }
      await graph.graph(user.id, shipQuery)
      const attachment = new Attachment(file)
      message.channel.send('', attachment)
      break

    case 'u':
    case 'update':
      graph.update()
      break

    case 'init':
      graph.init()
      break

    case 'id':
      let userid = await id.id(args[0])
      message.channel.send(userid.response)
      break

    case 'link':
      var user = message.author
      var name = args[0]
      if (args[1]) {
        user = getUserFromMention(args[0])
        name = args[1]
      }
      var response = await link.link(user.id, name)
      message.channel.send(`${user} has been linked to ${response}`)
      break

    case 'll':
    case 'listLinks':
      message.channel.send(link.listLinks())
      break

    case 'debug':
    case 'listGraph':
      graph.debug()
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
  }
}

bot.login();

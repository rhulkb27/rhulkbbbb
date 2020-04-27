const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const fs = require('fs')
const promisify = require('util').promisify;
const memberStats = require('./cmds/memberStats')

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async message => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  var command = message.content.toLowerCase().slice(config.prefix.length).split(' ')[0];

  var args = message.content.split(' ').slice(1);

  message.channel.startTyping()

  switch (command) {
    case 'm':
      var data = await memberStats.memberStats(args[0], args[1])
      var text = ''
      for (let i = 0; i < Math.min(15, data.size); i++) {
        text += `${Array.from(data)[i][0]}: ${Array.from(data)[i][1]}\n`
      }
      message.channel.send(text)
      break;
  }

  message.channel.stopTyping()
  
});

function getUserFromMention(mention) {
  if (!mention) return;

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1);

    if (mention.startsWith('!')) {
      mention = mention.slice(1);
    }

    return client.users.get(mention);
  }
}

bot.login(config.token);

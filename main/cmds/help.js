function help() {
  return {
    color: 3447003,
    title: "Help",
    description: "**command** (abbreviation) <required> [optional]\n**clantop** (**ct**) <clan tag> <ship name> [c for compact, leave empty for all stats]\n**graph** (**g**) [other user mention, default is author of message] <ship> [wr, dmg, kills, default is pr]\nWhen typing shipnames, exclude spaces and dashes.",
    footer: {
      text: `Command prefix: ${process.env.PREFIX}`
    }
  }
}

module.exports.help = help

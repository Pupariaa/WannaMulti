const Discord = require('discord.js')
const bjs = require("bancho.js");
const CommandHandler = require('./src/commands/CommandManager');
const { Collection, Events } = require('discord.js');
const { events } = require('./models/Events')
const dotenv = require('dotenv')
const envFile = './config.env';
dotenv.config({ path: envFile });
const client = new Discord.Client({ intents: 3276799, partials: ['MESSAGE', 'REACTION'] });
const { checkUserOnline } = require('./functions')

client.commands = new Collection();

client.on('ready', async () => {

  const guild = client.guilds.cache.get(process.env.discord_guid);
  
  const commandHandler = new CommandHandler(client);
  commandHandler.loadCommands();
  commandHandler.deployCommands();

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`DISCORD: No command matching ${interaction.commandName} was found.`)
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`DISCORD: Not exectuable command ${interaction.commandName} ${error}.`)
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  });

})

client.login(process.env.disbot_token);




const ircClient = new bjs.BanchoClient({ username: process.env.irc_username, password: process.env.irc_password });

ircClient.connect()
ircClient.on('PM', async (message) => {

  const content = message.message;
  // const from = message.user.ircUsername;
  if (content.startsWith('!host')) {
    console.log('commande')
  } else {
    if (!await checkUserOnline()) {
      console.log()
      message.user.sendMessage(`Hey ! Je ne suis pas connecté. Ceci est un message automatique`);
    }
  }
});











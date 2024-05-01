const Discord = require('discord.js')
const bjs = require("bancho.js");
const CommandHandler = require('./src/commands/CommandManager');
const { Collection, Events, EmbedBuilder } = require('discord.js');
const { events } = require('./models/Events')
const dotenv = require('dotenv')
const envFile = './config.env';
dotenv.config({ path: envFile });
const client = new Discord.Client({ intents: 3276799, partials: ['MESSAGE', 'REACTION'] });
const { checkUserOnline } = require('./functions')
const path = require('path')
const fs = require('fs')

client.commands = new Collection();

client.on('ready', async () => {

  const guild = client.guilds.cache.get(process.env.discord_guid);

  const commandHandler = new CommandHandler(client);
  commandHandler.loadCommands();
  commandHandler.deployCommands();

  client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = member.guild.channels.cache.get(process.env.welcome_channel)
    const pseudo_name = member.user.username;

    const greetings = [
      `Bienvenue sur Wanna Multi FR, ${pseudo_name} ! J'espère que tu passeras un bon moment ici.`,
      `Salut ${pseudo_name} ! Content de te voir sur Wanna Multi FR.`,
      `Bonjour ${pseudo_name}, nous sommes ravis de t'accueillir sur Wanna Multi FR, le serveur Discord.`,
      `Salut ${pseudo_name}, j'espère que tu trouveras des gens sympas pour jouer avec toi sur Wanna Multi FR.`,
      `Bonjour ${pseudo_name}, nous sommes heureux que tu aies rejoint notre communauté de joueurs sur Wanna Multi FR.`,
      `Hey ${pseudo_name}, nous sommes ravis de t'accueillir parmi nous sur Wanna Multi FR.`,
      `Bonjour ${pseudo_name}, bienvenue sur Wanna Multi FR ! J'espère que tu te sentiras comme chez toi.`,
      `Salut ${pseudo_name}, c'est génial que tu aies rejoint Wanna Multi FR ! N'hésite pas à explorer et à participer.`,
      `Hey ${pseudo_name}, bienvenue sur Wanna Multi FR ! Nous avons hâte de jouer avec toi.`,
      `Bonjour ${pseudo_name}, sois le bienvenu sur Wanna Multi FR ! Nous sommes impatients de te rencontrer.`,
      `Salut ${pseudo_name}, nous sommes ravis que tu aies choisi de rejoindre la communauté de Wanna Multi FR.`,
      `Hey ${pseudo_name}, bienvenue sur Wanna Multi FR ! Nous espérons que tu passeras un bon moment ici.`,
      `Salut ${pseudo_name}, sois le bienvenu sur Wanna Multi FR ! Nous sommes impatients de jouer avec toi.`,
      `Bonjour ${pseudo_name}, nous sommes ravis de t'accueillir sur Wanna Multi FR, où tu pourras rencontrer des gens sympas et jouer à des jeux amusants.`,
      `Hey ${pseudo_name}, sois le bienvenu sur Wanna Multi FR, le serveur où tu peux te faire de nouveaux amis tout en jouant à tes jeux préférés.`,
      `Bonjour ${pseudo_name}, nous sommes ravis que tu aies rejoint notre communauté sur Wanna Multi FR ! Amuse-toi bien et fais-toi des amis !`,
      `Salut ${pseudo_name}, bienvenue sur Wanna Multi FR, où tu peux trouver des joueurs de tous niveaux pour jouer à Osu!`
    ];
    const randomNum = Math.floor(Math.random() * greetings.length) + 1;
    if (!member.user.avatarURL()) {
      avatar = "https://cdn.discordapp.com/embed/avatars/4.png";
    } else {
      avatar = member.user.avatarURL();
    }
    const phrase = greetings[randomNum];
    const generalMessage = new EmbedBuilder()
      .setColor(0x0099FF)
      .setAuthor({ name: `${phrase}`, iconURL: `${avatar}` })
    welcomeChannel.send({ embeds: [generalMessage] });
  })

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
  if (content.startsWith('!')) {
    let index = content.indexOf('!');

    if (index !== -1) {
      let subString = content.substring(index + 1);
      let splits = subString.trim().split(/\s+/);
      const route = await LoadRoute(splits[0])
      if (route) {
        message.user.sendMessage(await route.Static());
      } else {
        message.user.sendMessage(`Commande inconnu. Utilise !help pour plus de détails`);
      }
    }
  } else {
    if (!await checkUserOnline()) {
  
      message.user.sendMessage(`Hey ! Je ne suis pas connecté. Ceci est un message automatique`);
    }
  }
});

async function LoadRoute(route) {
  return new Promise((resolve, reject) => {
    const routePath = path.join(__dirname, 'src/commands/irc', `${route}.js`);
    fs.access(routePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false)
      } else {
        const fileCommand = require(routePath)
        resolve(fileCommand);
      }
    });
  })
  

}











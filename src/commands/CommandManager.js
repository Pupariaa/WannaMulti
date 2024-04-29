const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Collection } = require('discord.js');
const dotenv = require('dotenv')


const envFile = '../../config.js';
dotenv.config({ path: envFile });


class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.commandsPath = './src/commands/handlers'
        this.rest = new REST({ version: '10' }).setToken(process.env.disbot_token);
    }

    loadCommands() {
        const commandFiles = fs.readdirSync(this.commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./handlers/${file}`);
            if ('data' in command && 'execute' in command) {
                this.client.commands.set(command.data.name, command);
            } else {
                console.warn(`The command at ${filePath} is missing a required "data" or "execute" property`);
            }
        }
    }

    async deployCommands() {
        const commands = [];
        this.client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

        try {
            const data = await this.rest.put(
                Routes.applicationGuildCommands(process.env.disbot_id, process.env.discord_guid),
                { body: commands }
            );
            console.log(`${data.length} commands successfully updated in ${this.client.guilds.cache.get(process.env.discord_guid).name}`);
        } catch (error) {
            console.error('Error updating commands: ' + error);
        }
    }
}

module.exports = CommandHandler;

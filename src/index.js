// libraries
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// initiates the client, and what it needs to listen for
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});
// creates a collection k/v data structure where key is name of command and v is its function
client.commands = new Collection();

// sets foldersPath to equal "current directory/commands"
const foldersPath = path.join(__dirname, 'commands');
// array of all folders/files (if we have files) in the commands directory. Currently ['utility']
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// same as foldersPath, appends folder
	const commandsPath = path.join(foldersPath, folder);
	// same as commandFolders, filters for only js files. array looks like this ['ping.js', 'server.js', 'user.js']
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


	for (const file of commandFiles) {
		// array is now the entire file path
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.TOKEN);
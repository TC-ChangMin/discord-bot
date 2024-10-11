// libraries
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
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

// console logs on startup, only once
client.once(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.username}`); // it used to be tag but discord has moved to username
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


client.login(process.env.TOKEN);
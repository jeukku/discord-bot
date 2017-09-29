/*
    Copyright (C) 2017  Juuso Vilmunen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
var sleep = require('sleep');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var dburl = 'mongodb://localhost:27017/tzmfi_discord';
const fs = require('fs');

const ADMIN_CHANNEL_NAME = "bot-admin";

var podbot;

function App() {
	this.actions = {};
	
	this.arguments = require('./actions/arguments.js').init(this);
	
	this.checkRights = function(action, message) {
		var okrole;
		var guild = message.guild.roles[client.guilds[message.guild.id]];

		console.log("guild " + JSON.stringify(guild));
		console.log("guilds " + JSON.stringify(client.guilds));
		console.log("message guild id  " + JSON.stringify(message.guild.id));
		
		for(var key in message.guild.roles) {
			var role = message.guild.roles[key];
			console.log("role id " + role.id);
			console.log("role name " + role.name);
		}
		
		console.log("message.guild " + message.guild);
		console.log("message.guild.roles " + message.guild.roles);
		console.log("action.channel " + action.channel);
		
		console.log("okrole " + role);
		
		if(action.channel == "all") {
			return true;
		} else if(role && role.members[message.author.id]) {
			return true;
		} else {
			return false;
		}
	}
	
	this.dbConnect = function(callback) {
		MongoClient.connect(dburl, callback);
	}
}

var app = new App();

app.actions.help = { channel: "all", 
	handle: function(message) {
		var list = "";
		for(var key in app.actions) {
			if(list.length > 0) {
				list += ", ";
			}
			if(app.actions[key] && app.actions[key].view) {
				list += app.actions[key].view;
			} else {
				list += key;
			}
		}
		
		message.reply("Usage: !action eg !list_arguments. List of actions : " + list);
	}
};

app.actions.uptime = { channel: "all",
	handle: function(message) {
		message.reply("Uptime " + process.uptime());
	}
};

app.actions.record = {
	channel: "admin",
	handle: function(message) {
		console.log("Should record " + message.content);

		if (message.member.voiceChannel) {
			message.member.voiceChannel.join().then(connection => { 
				message.reply('I have successfully connected to the channel!');
				var rec = connection.createReceiver();
				
			})
			.catch(console.log);
		} else {
			message.reply('You need to join a voice channel first!');
		}
	}
};

client.on('ready', () => {
	console.log('I am ready!');
	client.syncGuilds();
	//podbot = require('./podbot/index.js').create(ADMIN_CHANNEL_NAME, client);
});

client.on('message', message => {
	// console.log("got message " + message.content + " on channel " + message.channel);
	var split = message.content.split(" ");
	var first = split[0].trim();
	
	first = first.substr(1).toLowerCase();
	first = first.replace(/[^A-Za-z0-9]/g, "");
	
	if (!first.match(/[a-z]/i)) {
		// not alphabet letters found
		// ignore
	} else if(message.content.trim().length < 4) {
		// ignore
	} else if(message.content.startsWith("!")) {
		var saction = first;
		console.log("action " + saction);
		var action = app.actions[saction];
		if(action) {
			if(!app.checkRights(action, message)) {
				console.log("ignoring admin command " + saction + " from " + message.author.username);
			} else {
				var rest = message.content.substr(message.content.indexOf(" ")).trim();
				if(!action.needparams || split.length > 1) {
					action.handle(message, rest);
				} else {
					message.reply("This actions needs parameters");
				}
			}
		} else {
			message.reply('unknown ACTION \"' + saction + '\"');
		}
	} else if(message.content.startsWith("?")) {
		app.arguments.handle(first, message);
	} else if (message.content === 'ping') {
		// message.reply('pong DOOP');
	} else if(message.author.username != "tzm-bot") {
		// message.reply("unknown message " + message.content.replace(/\@/g, "FOO") + " user: " + message.author.username);
	}
});

sleep.sleep(1);

app.arguments.fetchArguments();

client.login(process.env.DISCORD_BOT_LOGIN);


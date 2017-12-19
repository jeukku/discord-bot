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

var express 		= require('express'), serveStatic = require('serve-static'); 
const PORT=18881;

const Discord = require('discord.js');
const client = new Discord.Client();


var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var dburl = 'mongodb://localhost:27017/tzmfi_discord';
const fs = require('fs');

const ADMIN_CHANNEL_NAME = "bot-admin";

var podbot;


function App() {
	this.actions = {};
	
	this.arguments = require('./actions/arguments.js').init(this);
	this.strings = require('./actions/strings.js').init(this);
		
	this.checkRights = function(action, message) {
		if(action.channel == "admin") {
			if(message.channel.name == ADMIN_CHANNEL_NAME) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}
	
	this.cleanUp = function(str) {
		if(str) {
			str = ("" + str).toLowerCase();
			str = str.replace(/[^A-Za-z0-9]/g, "");
			str = str.trim();
			return str;
		} else {
			return "";
		}
	}
	
	this.dbConnect = function(callback) {
		MongoClient.connect(dburl, (err, dbc) => {
				const db = dbc.db('tzmfi_discord');
				callback(err, dbc, db);	
		});
	}
	
	this.isSet = function(o) {
		return typeof o !== 'undefined';
	}
}

var app = new App();
var exp = express();

app.actions.help = { channel: "all", 
	handle: function(message) {
		var list = "";
		for(var key in app.actions) {
			var action = app.actions[key];
			if(action && app.checkRights(action, message)) {
				if(list.length > 0) {
					list += ", ";
				}

				if(action.view) {
					list += app.actions[key].view;
				} else {
					list += key;
				}
			}
		}
		
		message.reply("Usage: !action eg !list_arguments. List of actions : " + list);
	}
};

app.actions.uptime = { channel: "all",
	handle: function(message) {
		app.strings.get("UPTIME", "" + process.uptime(), function(err, str) {
			if(str) {
				message.reply(str);
			} else {
				message.reply("ERROR " + err);
			}
		});
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
	//podbot = require('./podbot/index.js').create(ADMIN_CHANNEL_NAME, client);
});

client.on('message', message => {
	// console.log("got message " + message.content + " on channel " + message.channel);
	var split = message.content.split(" ");
	var first = split[0].trim();

	var actionchar = first.substr(0, 1);
		
	first = first.substr(1).toLowerCase();
	first = first.replace(/[^A-Za-z0-9]/g, "");
	
	if (!first.match(/[a-z]/i)) {
		// not alphabet letters found
		// ignore
	} else if(message.content.trim().length < 4) {
		// ignore
	} else if(message.author.username.match("/\-bot/i")) {
		console.log("ignore bot message");
	} else if(actionchar=="!" || actionchar=="?") {
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
			app.arguments.handle(first, message);
		}
	}
});

exp.get("/list", function(req, res) {
	console.log("\"list\" called");

	app.arguments.listArguments(function(db, docs) {
		var html = "<html><head><title>TZM</title></head><body>\n";

		docs.forEach(function(item) {
			html += "<div>\n";
			html += "<h2>" + item.argument + "</h2>\n";
			html += "<h3>by " + item.author + "</h3>";
			html += "<p>" + item.text + "</p>";
			html += "</div>\n\n";
		});

		html += "</body></html>";
		
		db.close();
		res.send(html);
	});
});

app.arguments.fetchArguments();

exp.listen(PORT);
console.log("Listening to port " + PORT);

client.login(process.env.DISCORD_BOT_LOGIN).then(function() {
	console.log("login success");
}, function(err) {
	console.log("login failed " + err);
});

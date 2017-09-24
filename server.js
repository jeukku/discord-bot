'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
var sleep = require('sleep');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var dburl = 'mongodb://localhost:27017/tzmfi_discord';
const fs = require('fs');

const ADMIN_CHANNEL_NAME = "bot-admin";

var actions = {};
var allarguments = {};

var podbot;

actions.help = { channel: "all", 
	handle: function(message) {
		var list = "";
		for(var key in actions) {
			if(list.length > 0) {
				list += ", ";
			}
			
			list += key;
		}
		
		message.reply("Usage: !action eg !list_arguments. List of actions : " + list);
	}
};

actions.uptime = { channel: "all",
	handle: function(message) {
		message.reply("Uptime " + process.uptime());
	}
};

actions.record = {
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

actions.delete_argument = {
	channel: "admin",
	handle: function(message) {
		console.log("delete_argument content \"" + message.content + "\"");
		var argumentname = message.content.substr(message.content.indexOf(" ")+1);
		console.log("deleting argument:\"" + argumentname + "\"");

		deleteArgument(argumentname, function(docs) {
			message.reply("removed argument:" + argumentname + " docs:" + JSON.stringify(docs));
		})
	}
};

actions.store_argument = {
	channel: "admin",
	handle: function(message) {
		dbConnect(function(err, db) {
			console.log("store_argument content \"" + message.content + "\"");
			var rest = message.content.substr(message.content.indexOf(" ")).trim();
			
			var argumentname = rest.substr(0, rest.indexOf(" ")).trim();
			var text = rest.substr(rest.indexOf(":") + 1).trim();
			
			console.log("argument:\"" + argumentname + "\" text:" + text);
			
			var carguments = db.collection('arguments');
			var query = { argument: argumentname };
			var update = { argument: argumentname, text: text }; 
			carguments.update(query, update, { upsert: true }, function(err, docs) {
				message.reply("stored argument:" + argumentname + " text:" + text);
				db.close();
				
				fetchArguments();
			});
		});
	}
};

actions.list_arguments = {
	channel: "all",
	handle: function(message) {
		dbConnect(function(err, db) {
			console.log("listing arguments");
			var carguments = db.collection('arguments');
			carguments.find({}).toArray(function(err, docs) {
				console.log("arguments " + JSON.stringify(docs));
				
				var list = "";
				docs.forEach(function(item) {
					if(list.length > 0) {
						list += ", ";
					}
					
					list += item.argument;
				});
				
				message.reply("Arguments " + list);
				db.close();
			});
		});
	}
};

function deleteArgument(name, callback) {
		dbConnect(function(err, db) {
			var carguments = db.collection('arguments');
			var query = { argument: name };
			carguments.remove(query, function(err, docs) {
				callback(docs);
			});
		});
}

function fetchArguments() {
	dbConnect(function(err, db) {
		var carguments = db.collection('arguments');
		carguments.find({}).toArray(function(err, docs) {
			console.log("arguments " + JSON.stringify(docs));

			var shoulddelete = "";
			
			docs.forEach(function(item) {
				var name = item.argument;
				if(name.indexOf(" ")>0 || name.indexOf(":")>0) {
					shoulddelete = name;
					console.log("not adding " + name);
				} else {
					console.log("Adding action name:" + item.argument + " text:" + item.text);
					allarguments[name] = {
						channel: "all",
						handle: function(message) {
							responseArgument(message, name);
						}
					};
				}
			});

			db.close();
			
			if(shoulddelete.length>0) {
				deleteArgument(shoulddelete, function() {
					console.log("deleted " + shoulddelete);
				});
			}
			
		});
	});
}

function responseArgument(message, name) {
	dbConnect(function(err, db) {
		var carguments = db.collection('arguments');
		carguments.find({ argument: name }).toArray(function(err, docs) {
			docs.forEach(function(item) {
				var content = "";
				var index = message.content.indexOf(" "); 
				if(index > 0) {
					content = message.content.substring(index).trim() + " : ";
				}
				
				message.reply("" + content + "" + item.text);
			});
			
			db.close();
		});
	});
}

function checkRights(action, message) {
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

function dbConnect(callback) {
	MongoClient.connect(dburl, callback);
}

client.on('ready', () => {
	console.log('I am ready!');
	//podbot = require('./podbot/index.js').create(ADMIN_CHANNEL_NAME, client);
});

client.on('message', message => {
	// console.log("got message " + message.content + " on channel " + message.channel);
	if (!message.content.split(" ")[0].match(/[a-z]/i)) {
		// not alphabet letters found
		// ignore
	} else if(message.content.trim().length < 4) {
		// ignore
	} else if(message.content.startsWith("!")) {
		var saction = message.content.substr(1);
		if(saction.indexOf(" ") > 0) {
			saction = saction.substr(0, message.content.indexOf(" ") - 1).trim();
		}
		
		var action = actions[saction];
		if(action) {
			if(!checkRights(action, message)) {
				console.log("ignoring admin command " + saction + " from " + message.author.username);
			} else {
				action.handle(message);
			}
		} else {
			message.reply('unknown ACTION \"' + saction + '\"');
		}
	} else if(message.content.startsWith("?")) {
		var sarg  = message.content.substr(1);
		if(sarg.indexOf(" ") > 0) {
			sarg = sarg.substr(0, sarg.indexOf(" ")).trim();
		}
		
		sarg = sarg.replace(/_/g, "");
		
		var argument = allarguments[sarg];
		if(argument) {
			argument.handle(message);
		} else {
			message.reply('Unknown argument \"' + sarg + '\"');
		}	
	} else if (message.content === 'ping') {
		// message.reply('pong DOOP');
	} else if(message.author.username != "tzm-bot") {
		// message.reply("unknown message " + message.content.replace(/\@/g, "FOO") + " user: " + message.author.username);
	}
});

sleep.sleep(1);

fetchArguments();
client.login(process.env.DISCORD_BOT_LOGIN);


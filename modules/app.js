/*
    Copyright (C) 2018  Juuso Vilmunen

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

var appmodule = {
	setup: function() { console.log("App setup"); },
	init: function() { return initApp(); }
};

appmodule.setup();
module.exports = appmodule;

var express 		= require('express'), serveStatic = require('serve-static'); 
const PORT=18881;

const MongoClient = require('mongodb').MongoClient, assert = require('assert');
const dburl = 'mongodb://localhost:27017';
const fs = require('fs');

const ADMIN_CHANNEL_NAME = "bot-admin";

function App(noptions) {
	if(noptions) {
		this.options = noptions;
	} else {
		var optionsfile = process.env.DISCORD_BOT_OPTIONS;
		if (!optionsfile) {
			optionsfile = "options.json";
		}
		
		this.options = JSON.parse(fs.readFileSync(optionsfile, 'utf8'));
	}
	
	this.actions = {};
	
	this.arguments = require('../actions/arguments.js').init(this);
	this.strings = require('../actions/strings.js').init(this);
	this.roles = require('./roles.js').init(this);
	this.news = require('./news.js').init(this);

	this.handlers = [this.news];
	
	this.checkRights = function(action, message) {
		if(action.channel == "admin") {
			console.log("checkrights " + message.author.username);
			if(message.author.username == "jeukku (Juuso V)") {
				return true;
			}
			
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
		// console.log("connecting to " + dburl);
		var client = new MongoClient(dburl, { loggerLevel: "warn" });
		client.connect((err, dbc) => {
				const db = dbc.db('tzmfi_discord');
				callback(err, dbc, db);	
		});
	}
	
	this.isSet = function(o) {
		return typeof o !== 'undefined';
	}
	
	this.handleMessage = function(message, callback) {
		// console.log("got message " + message.content + " on channel " +
		// message.channel);
		var split = message.content.split(" ");
		var first = split[0].trim();

		var actionchar = first.substr(0, 1);
			
		first = first.substr(1).toLowerCase();
		first = first.replace(/[^A-Za-z0-9]/g, "");
		
		if (!first.match(/[a-z]/i)) {
			// not alphabet lletters found
			// ignore
		} else if(message.content.trim().length < 4) {
			// ignore
		} else if(message.author.username.match("/\-bot/i")) {
			console.log("ignore bot message");
		} else if(actionchar=="!" || actionchar=="?") {
			var saction = first;
			callback(saction, split);
		}	
	};
}

function initApp() {
	var app = new App();
	var exp = express();
	var expserver;
	
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
	
	app.actions.podon = {
		channel: "admin",
		handle: function(message, rest) {
			console.log("Should record " + message.content);
	
			var split = rest.split(" ");
			if(split.length<2) {
				message.reply("usage !record recordid email (" + rest + ")");
			} else {
				var recid = split[0].trim();
				var email = split[1].trim();
			
				if (message.member.voiceChannel) {
					message.reply("starting recordig " + recid + " by " + email);
					podbot._podon(message, message.member, recid, email);
				} else {
					message.reply('You need to join a voice channel first!');
				}
			}
		}
	};
	
	app.actions.podoff = {
			channel: "admin",
			handle: function(message, rest) {
				console.log("Should stop recording " + message.content);
				if (message.member.voiceChannel) {
					message.reply("stopping recordig");
					podbot._status(message);
					podbot._podoff(message, message.member);
				} else {
					message.reply('You need to join a voice channel first!');
				}
			}
	};
	
	app.reaction = function(reaction, user) {
		
		var repl = "reaction added " + reaction.emoji.name + " id:" + reaction.emoji.identifier;
		console.log("messageReactionAdd " + repl);
		
		for(var i in app.handlers) {
			var h = app.handlers[i];
			h.handle_reaction(reaction, user)
		}
		// reaction.message.reply(repl);
	};
	
	app.message = function(message) {
		app.handleMessage(message, (saction, split) => {
			console.log("Handling message action " + saction);
			var action = app.actions[saction];
			if(action) {
				if(!app.checkRights(action, message)) {
					console.log("ignoring admin command " + saction + " from " + message.author.username);
				} else {
					var rest = message.content.substr(message.content.indexOf(" ")).trim();
					var restlist = rest.split(":");
					var paramlist = [];
					for (var i in restlist) {
						var param = restlist[i].trim();
						console.log("param " + param);
						paramlist.push(param);
					}
					
					if(!action.needparams || split.length > 1) {
						action.handle(message, rest, paramlist);
					} else {
						message.reply("This actions needs parameters");
					}
				}
			} else {
				app.arguments.handle(saction, message);
			}		
		});
	};

	exp.get("/list", function(req, res) {
		console.log("\"list\" called");

		app.arguments.listArguments(function(dbclient, db, docs) {
			var html = "<html><head><title>TZM</title></head><body>\n";

			docs.forEach(function(item) {
				html += "<div>\n";
				html += "<h2>" + item.argument + "</h2>\n";
				html += "<h3>by " + item.author + "</h3>";
				html += "<p>" + item.text + "</p>";
				html += "</div>\n\n";
			});

			html += "</body></html>";
			
			dbclient.close();
			res.send(html);
		});
	});
	
	exp.get("/news", function(req, res) {
		var newscontent = app.news.get_content(function(newscontent) {
			res.send(newscontent);
		});
	});

	app.arguments.fetchArguments();

	app.init = function(client) {
		app.news.init(client);		
	}
	
	app.shutdown = function() {
		console.log("app shutdown");
		if(app.expserver) {
			console.log("closing expserver");
			app.expserver.close();
		}
	}
	
	app.expserver = exp.listen(PORT);
	console.log("Listening to port " + PORT);		
	
	return app;
}

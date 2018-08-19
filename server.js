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

var app = require('./modules/app.js').init();

var podbot;

client.on('ready', () => {
	console.log('I am ready!');
	//podbot = require('./podbot/index.js').create(ADMIN_CHANNEL_NAME, client);
});

client.on('message', app.message);

client.on('messageReactionAdd', (reaction, user) => {
	var repl = "reaction added " + reaction.emoji.name + " id:" + reaction.emoji.identifier;
	console.log("messageReactionAdd " + repl);
	// reaction.message.reply(repl);
});

client.on("debug", (e) => console.info(e));

client.login(process.env.DISCORD_BOT_LOGIN).then(function() {
	console.log("login success");
}, function(err) {
	console.log("login failed " + err);
});

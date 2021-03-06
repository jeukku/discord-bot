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

var stests_arguments = {
		setup: function() { console.log("stests setup"); },
		init: function(app) { return new NewsTests(app); }
	};

var messages = require("./messages.js").init();

stests_arguments.setup();
module.exports = stests_arguments;

var app;

function NewsTests(napp) {
	app = napp;
	
	this.run = function() {
		var message = messages.getNews();
		message.content = "Important message";
		message.reply = function(s) {
			console.log("REPLY " + s);
		};
		message.channel = { id: app.news.news_channel_id };
		app.message(message);
		
		var reactinguser = {}
		var reaction = {}
		reaction.emoji = {}
		reaction.emoji.name = ':thumbsup:'; 
		reaction.message = message;
		reaction.count = 4;
		
		app.reaction(reaction, reactinguser);
		
		var newscontent = app.news.get_content(function(newscontent) {
			console.log("news content " + newscontent);			
		});
	}
}

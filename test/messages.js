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

var messages_arguments = {
		setup: function() { console.log("messages setup"); },
		init: function() { return new TestMessages(); }
	};

messages_arguments.setup();
module.exports = messages_arguments;

function TestMessages() {
	this.get = function() {	
		var message = {};
		message.content = "!JEE";
		message.author = {};
		message.author.username = "testingdude";
		message.reply = function(s) {
			console.log("MESSAGE reply " + s);
		};
		message.id = Date.now();
		message.channel = {};
		message.channel.name = "random";
		
		return message;
	};

	this.getBotAdmin = function() {	
		var message = {};
		message.content = "!JEE";
		message.author = {};
		message.author.username = "testingdude";
		message.reply = function(s) {
			console.log("MESSAGE reply " + s);
		};
		
		message.id = Date.now();
		message.channel = {};
		message.channel.name = "bot-admin";
		
		return message;
	};

	this.getNews = function() {	
		var message = {};
		message.content = "topic: THIS IS TOPIC\nReally important message";
		message.cleanContent = message.content;
		message.author = {};
		message.author.username = "testingdude";
		message.reply = function(s) {
			console.log("MESSAGE reply " + s);
		};
		message.createdAt = new Date();
		message.id = Date.now();
		message.createdTimestamp = Date.now();
		message.channel = {};
		message.channel.name = "news";
		message.member = { username: "testing2" };
		console.log("created a news message with id " + message.id);
		return message;
	};
}
		
		
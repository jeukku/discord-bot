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
	this.get =function() {	
		var message = {};
		message.content = "!JEE";
		message.author = {};
		message.author.username = "testingdude";
		message.reply = function(s) {
			console.log("MESSAGE reply " + s);
		};
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
		
		message.channel = {};
		message.channel.name = "bot-admin";
		
		return message;
	};
}
		
		
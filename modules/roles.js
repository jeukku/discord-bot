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

var roles_arguments = {
	setup: function() { console.log("Roles setup"); },
	init: function(app) { return new Roles(app); }
};

roles_arguments.setup();
module.exports = roles_arguments;

function Roles(app) {
	var self = this;
	this.actions = app.actions;
	
	this.handle = function(first, message) {
	};
	
	this.actions.listroles = {
		channel: "admin",
		view: "list_roles",
		handle: function(message, rest) {	
			var rarray = message.guild.roles.array();
			var roles = "roles: ";
			for(var r in rarray) {
				roles += rarray[r].name.replace("@", "") + " ";
			}
			message.reply(roles);
		}
	};

	this.actions.connectroletoemoji = {
			channel: "admin",
			view: "connect_role_to_emoji",
			handle: function(message, rest, list) {
				var role = list[0];
				var emoji = list[1];
				var ret = "connecting " + role + " to reaction " + emoji;
				console.log(ret);
				1
				this.app.dbConnect(function(err, dbclient, db) {
					var cstrings = db.collection('reaction_roles');
					
					console.log("Setting string " + name);
					
					var query = { role: role};
					var item = { role: role, reaction: reaction };
					cstrings.update( query, item, { upsert: true }, function(err, docs) {
						dbclient.close();
						message.reply(ret);
					});
				});		
			}			
	}
}

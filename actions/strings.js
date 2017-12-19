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

var strings = {
	setup: function() { console.log("Strings setup"); },
	init: function(app) { return new Strings(app); }
};

strings.setup();
module.exports = strings;

function Strings(app) {
	var self = this;
	this.actions = app.actions;

	this.actions.setstring = {
		channel: "admin",
		view: "set_string",
		needparams: true,
		handle: function(message, rest) {
			var strname = rest.substr(0, rest.indexOf(" ")).trim();
			var text = rest.substr(rest.indexOf(":") + 1).trim();

			app.dbConnect(function(err, dbclient, db) {
				var cstrings = db.collection('strings');
				
				var query = { name: strname };
				var item = { name: strname, text: text };
				cstrings.update( query, item, { upsert: true }, function(err, docs) {
					message.reply("set string \"" + strname + "\" to \"" + text + "\"");
					dbclient.close();
				});					
			});
		}
	}

	this.actions.liststrings = {
			channel: "admin",
			view: "list_strings",
			needparams: false,
			handle: function(message, rest) {
				app.dbConnect(function(err, dbclient, db) {
					var cstrings = db.collection('strings');
					
					cstrings.find({ }).toArray(function(err, docs) {
						var reply = "STRINGS:\n";
						docs.forEach(function(item) {						
							reply += "string \"" + item.name + "\" is \"" + item.text + "\"\n";
						});
						message.reply(reply);
						
						dbclient.close();
					});					
				});
			}
		}

	this.get = function(name, param, callback) {
		app.dbConnect(function(err, dbclient, db) {
			var cstrings = db.collection('strings');
			
			var query = { name: name };
			cstrings.findOne(query, function(err, item) {
				if(err) {
					var defaultvalue = "default value for string " + name;
					callback(err, defaultvalue);
				} else if(item) {
					dbclient.close();
					callback(err, item.text.replace("{REPLACE}", param));
				} else {
					callback(err, "string \"" + name + "\" not found");
				}
			});
		});
	}
}


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

			app.dbConnect(function(err, db) {
				var cstrings = db.collection('strings');
				
				var query = { name: strname };
				var item = { name: strname, text: text };
				cstrings.update( query, item, { upsert: true }, function(err, docs) {
					message.reply("set string \"" + strname + "\" to \"" + text + "\"");
					db.close();
				});
			});
		}
	}

	this.get = function(name, param, callback) {
		app.dbConnect(function(err, db) {
			var cstrings = db.collection('strings');
			
			var query = { name: name };
			cstrings.findOne(query, function(err, item) {
				if(err) {
					callback(err, null);
				} else if(item) {
					db.close();
					callback(err, item.text.replace("{REPLACE}", param));
				} else {
					callback("string \"" + name + "\" not found", null);
				}
			});
		});
	}
}


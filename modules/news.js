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

var news_arguments = {
	setup : function() {
		console.log("news setup");
	},
	init : function(app) {
		return new news(app);
	}
};

news_arguments.setup();
module.exports = news_arguments;

function news(app) {
	var self = this;

	this.handle = function(first, message) {
	};

	this.handle_reaction = function(reaction, user) {
		var message = reaction.message;
		console.log("handle reaction to message " + message.content + "(" + message.id + ")");

		app.dbConnect(function(err, dbclient, db) {
			var cnews = db.collection('news');

			var query = {
				messageid : message.id
			};
			
			var item = { 
					messageid: message.id, 
					text: message.content, 
					count: reaction.count,
					nickname: message.member.nickname
					};
			
			console.log("updating or adding " + JSON.stringify(item));
			cnews.update( query, item, { upsert: true }, function(err, docs) {
				if(err) {
					console.log("ERROR " + err);
				} else {
					console.log("updated or added news " + docs);
				}
				
				dbclient.close();
			});
		});
	};

	this.init = function(client) {
		app.strings.get("CONFIG_GUILD_ID", "", function(err, value) {
			if (!err) {
				app.strings.get("CONFIG_NEWS_CHANNEL_ID", "", function(err,
						newschannel) {
					if (!err) {
						console.log("news channel id " + newschannel)
						var guildx = client.guilds.find("id", value); // serverID
						guildx.channels.find("id", newschannel).fetchMessages({
							limit : 50
						});
					} else {
						console.log("ERROR news channel id missing");
					}
				});
			} else {
				console.log("ERROR " + err);
			}
		});
	};
	
	this.get_content = function(callback) {
		app.dbConnect(function(err, dbclient, db) {
			console.log("listing news");
			var cnews = db.collection('news');
			cnews.find({ count: { $gte: 2 } }).toArray(function(err, docs) {
				console.log("news " + JSON.stringify(docs));
				
				var content = "";
				
				docs.forEach(function(item) {
					if(content.length > 0) {
						content += "\n";
					}

					content += item.text;
				});

				dbclient.close();
				callback(content);
			});
		});
	};
}
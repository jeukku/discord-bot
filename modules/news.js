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

const fs = require('fs');

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
	var news_channel_id;

	this.handle = function(first, message) {
	};

	this.handle_reaction = function(reaction, user) {
		var message = reaction.message;
		if (message.channel.id == app.news.news_channel_id) {
			app.news.handle_news_reaction(reaction, message, user);
		}
	};

	this.handle_news_reaction = function(reaction, message, user) {
		console.log("handle reaction (" + reaction.emoji.name + ") to message "
				+ message.cleanContent + "(" + message.id + ")");

		app.dbConnect(function(err, dbclient, db) {
			var cnews = db.collection('news');

			var query = {
				messageid : message.id
			};

			var cat = message.createdAt;
			var createdAt = cat.getUTCFullYear() + "-" + (cat.getUTCMonth() + 1)
					+ "-" + cat.getUTCDate();
			var topic = "" + createdAt;
			var orgtext = message.cleanContent;
			
			var textlines = orgtext.split("\n")
			var text = "";
			for (var iline in textlines) {
				var line = textlines[iline];
				console.log("checking line " + line);
				if (line.startsWith("topic:")) {
					topic = line.substr(line.indexOf(":")+1).trim()
				} else {
					text += line + "\n";
				}
			}
			
			var item = {
				messageid : message.id,
				text : text,
				count : reaction.count,
				username : message.author.username,
				createdAt : createdAt,
				topic: topic,
				timestamp : message.createdTimestamp,
				published: false
			};

			console.log("updating or adding " + JSON.stringify(item));
			cnews.update(query, item, {
				upsert : true
			}, function(err, docs) {
				if (err) {
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
					app.news.news_channel_id = newschannel;

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

	// every news item that isn't published and where reaction count is greater
	// that 1
	// is written to a date.md file
	this.get_content = function(callback) {
		app.dbConnect(function(err, dbclient, db) {
			console.log("listing news");
			var cnews = db.collection('news');
			cnews.find({
				count : {
					$gte : 3
				}
			}).sort({
				timestamp : 1
			}).toArray((err, docs) => {
				app.news.get_content_docs(dbclient, cnews, err, docs, callback);
			});
		});
	};

	this.get_topic_file = function(date, topic) {
		var filepath;
		
		if(date!=topic) {
			filepath = app.options.news_items_path + "news-" + date + "-" + topic + '.md';
		} else {
			filepath = app.options.news_items_path + "news-" + date + '.md';			
		}
		
		filepath = filepath.replace(/ /g, "_");
		return filepath;
	};
	
	this.get_content_docs = function(dbclient, cnews, err, docs, callback) {
		console.log("news count:" + docs.length + " " + JSON.stringify(docs));

		var content = "";

		fs.writeFileSync(app.options.news_json_path + 'messages.json', JSON
				.stringify(docs, null, 2));

		var updated_topics = {};

		docs.forEach(function(item) {
			if (!item.published && !(Object.keys(updated_topics).includes(item.topic))) {
				console.log("something updated topic:" + item.topic + " createdAt:" + item.createdAt);
				updated_topics[item.topic] = item.createdAt;
			}
		});

		console.log("updated_topics " + updated_topics);

		for (var topic in updated_topics) {
			var date = updated_topics[topic];
			var template = "" + fs.readFileSync("files/news_template.md");
			template = template.replace("REPLACE_TITLE", topic);
			var createfile = app.news.get_topic_file(date, topic);
			console.log("creating file " + createfile);
			fs.writeFileSync(createfile, template);
		}

		docs.forEach(function(item) {
			var createdAt = "" + item.createdAt;
			var topic = "" + item.topic;
			if (Object.keys(updated_topics).includes(topic)) {
				console.log("writing item to md " + item.timestamp + " createdAt:" + createdAt + " topic:" + topic);

				var icontent = "### ";
				if(topic!=createdAt) {
					icontent += topic;
					icontent += "\n#### " + item.username;
				} else {
					icontent += item.username;					
				}
				
				icontent += "\n\n";				
				icontent += item.text;

				icontent += "\n\n";
				content += icontent;

				var appendfile = app.news.get_topic_file(createdAt, topic);
				console.log("appending in file " + appendfile);
				fs.appendFileSync(appendfile, icontent);

				var query = {
					messageid : item.messageid
				};
				item.published = true

				cnews.update(query, item, {
					upsert : true
				}, function(err, docs) {
					console.log("updated " + docs);
				});
			}
		});

		dbclient.close();
		callback(content);
	};
}

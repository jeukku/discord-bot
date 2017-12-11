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

var action_arguments = {
	setup: function() { console.log("Arguments setup"); },
	init: function(app) { return new Arguments(app); }
};

action_arguments.setup();
module.exports = action_arguments;

function Arguments(app) {
	var self = this;
	
	this.actions = app.actions;
	this.allarguments = {};
	
	this.handle = function(first, message) {
		var argument = this.allarguments[first];
		if(!argument) {
			argument = this.allarguments[first.toUpperCase()];
		}

		if(argument) {
			argument.handle(message);
		} else {
			app.strings.get("UNKNOWN_RESPONSE", first, function(err, str) {
				if(err) {
					message.reply("ERROR " + err);
				} else {
					message.reply(str);
				}
			});
		}	
	};

	this.actions.deleteargument = {
		channel: "admin",
		view: "delete_argument",
		needparams: true,
		handle: function(message, rest) {
			var argumentid = rest;
			console.log("deleting argument:\"" + argumentid + "\"");

			self.deleteArgument(argumentid, function(docs) {
				message.reply("removed argument:" + argumentid + " docs:" + JSON.stringify(docs));
			});
		}
	}

	this.actions.suggestargument = {
		channel: "all",
		view: "suggest_argument",
		needparams: true,
		handle: function(message, rest) {
			var argumentname = rest.substr(0, rest.indexOf(" ")).trim();
			argumentname = app.cleanUp(argumentname);
			
			var text = rest.substr(rest.indexOf(":") + 1).trim();
			var username = message.author.username;
			app.dbConnect(function(err, db) {
				console.log("connected");
				
				var carguments = db.collection('arguments');
				var query = { argument: argumentname, author: username, state: "suggestion" };
				var update = { argument: argumentname, text: text, author: username, state: "suggestion", argumentid: self.generateId() }; 
				
				carguments.update(query, update, { upsert: true }, function(err, docs) {
					console.log("reply");
					message.reply("stored suggestion:" + argumentname + " by " + username + " with id " + update.argumentid);
					db.close();
				});
			});
		}
	}

	this.actions.publishargument = {
		channel: "admin",
		view: "publish_argument",
		needsargument: true,
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("storeargument content \"" + message.content + "\"");
				var argumentid = rest;
				
				console.log("publish argument:" + argumentid);
				
				var carguments = db.collection('arguments');
				var query = { argumentid: argumentid };
				var update = { state: "published" };
				
				carguments.findOne(query, function(err, item) {
					item.state = "published";
					carguments.update( { _id: item._id }, item, function(err, docs) {
						message.reply("published " + argumentid + " " + JSON.stringify(docs));
						db.close();
						self.fetchArguments();
					});
				});
			});
		}
	};

	this.actions.unpublishargument = {
		channel: "admin",
		view: "unpublish_argument",
		needsargument: true,
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("unpublishargument content \"" + message.content + "\"");
				var argumentid = rest;
				
				console.log("unpublish argument:" + argumentid);
				
				var carguments = db.collection('arguments');
				var query = { argumentid: argumentid };

				carguments.findOne(query, function(err, item) {
					item.state = "suggestion";
					carguments.update( { _id: item._id }, item, function(err, docs) {
						message.reply("unpublished " + argumentid + " " + JSON.stringify(docs));
						db.close();
						self.fetchArguments();
					});
				});
			});
		}
	};

	this.actions.fixarguments = {
		channel: "admin",
		view: "fix_arguments",
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("listing argumentsuggestions");
				var carguments = db.collection('arguments');
				carguments.find({ }).toArray(function(err, docs) {
					if(err) {
						console.error("ERROR " + err);
					}
					
					console.log("arguments " + JSON.stringify(docs));
					
					var fixed = "";
					
					var bulk = carguments.initializeOrderedBulkOp();
					
					docs.forEach(function(item) {						
						if(!item.argumentid) {
							var newid = self.generateId();
							bulk.find( { _id: item._id } ).updateOne( { $set: { argumentid: newid }});
							fixed += "adding argumentid[" + newid + "] to " + item._id + "\n";
						}

						if(!item.state) {
							bulk.find( { _id: item._id } ).updateOne( { $set: { state: "published" }});
							fixed += "setting published  to " +  item.argument + "[" + item._id + "][" + item.argumentid + "]\n";
						}


						if(!app.isSet(item.argument) || !item.argument.replace(/[A-Za-z0-9]/g, "").length == 0) {
							//bulk.find( { _id: item._id } ).removeOne();
							fixed += "deleting " +  item.argument + "[" + item._id + "] isSet:" + app.isSet(item.argument) + " \n";
						}

					 });

					bulk.execute(function(err, result) {
						message.reply("fixed " + fixed);
						db.close();
					});
				});
			});
		}		
	};
	
	this.actions.listargumentsuggestions = {
		channel: "admin",
		view: "list_argument_suggestions",
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("listing argumentsuggestions");
				var carguments = db.collection('arguments');
				carguments.find({ state: { $not: /published/ }}).toArray(function(err, docs) {
					if(err) {
						console.error("ERROR " + err);
					}
					
					console.log("arguments " + JSON.stringify(docs));
					
					var list = "";
					docs.forEach(function(item) {
						if(list.length > 0) {
							list += ", ";
						}
						
						list += item.argument;
						var aid = item.argumentid;
						list += " [" + item.argumentid + "] by " + item.author;
					});
					
					message.reply("Argumentsuggestions " + list);
					db.close();
				});
			});
		}
	};

	this.actions.viewargument = {
		channel: "admin",
		view: "view_argument",
		needsargument: true,
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("viewing argument " + rest);
				var carguments = db.collection('arguments');
				carguments.find({ argumentid: rest }).toArray(function(err, docs) {
					console.log("arguments " + JSON.stringify(docs));
					var a = docs[0];
					var smes = "\"" + a.argument + "\"";
					if(a.state=="suggestion") {
						smes += " suggested";
					}
					
					smes += " by " + a.author + "\n";
					smes += a.text;
					
					message.reply(smes);
					db.close();
				});
			});
		}
	};

	this.actions.listarguments = {
		channel: "all",
		view: "list_arguments",
		handle: function(message, rest) {
			app.dbConnect(function(err, db) {
				console.log("listing arguments");
				var carguments = db.collection('arguments');
				carguments.find({ state: "published" }).toArray(function(err, docs) {
					console.log("arguments " + JSON.stringify(docs));
					
					var list = "";
					docs.forEach(function(item) {
						if(list.length > 0) {
							list += ", ";
						}

						list += item.argument;
					});

					message.reply("Arguments " + list);
					db.close();
				});
			});
		}
	};

	this.actions.listargumentsinfo = {
		channel: "admin",
		view: "list_arguments_info",
		handle: function(message, rest) {
			self.listArguments(function(db, docs) {
				var list = "";
				docs.forEach(function(item) {
					if(list.length > 0) {
						list += ", ";
					}

					list += "\nname:" + item.argument;
					list += "\nargumentid:" + item.argumentid;
					list += "\nauthor:" + item.author;
					list += "\n";
				});

				message.reply("Arguments " + list);
				db.close();
			});
		}
	};

	this.listArguments = function(callback) {
		app.dbConnect(function(err, db) {
			console.log("listing arguments");
			var carguments = db.collection('arguments');
			carguments.find({ state: "published" }).toArray(function(err, docs) {
				console.log("arguments " + JSON.stringify(docs));
				callback(db, docs);
			});
		});
	};
	
	this.deleteArgument = function(argumentid, callback) {
			app.dbConnect(function(err, db) {
				var carguments = db.collection('arguments');
				var query = { argumentid: argumentid };
				carguments.remove(query, function(err, docs) {
					callback(docs);
				});
			});
	}

	this.fetchArguments = function() {
		app.dbConnect(function(err, db) {
			if(err) {
				console.log("ERROR " + err);
			}

			var carguments = db.collection('arguments');
			carguments.find({ state: "published" }).toArray(function(err, docs) {
				console.log("arguments " + JSON.stringify(docs));

				docs.forEach(function(item) {
					var name = item.argument;
					if(!name || name.indexOf(" ")>0 || name.indexOf(":")>0) {
						console.log("not adding " + name);
					} else {
						console.log("Adding action name:" + item.argument + " text:" + item.text);
						self.allarguments[name] = {
							channel: "all",
							handle: function(message) {
								self.responseArgument(message, name);
							}
						};
					}
				});

				db.close();
			});
		});
	}

	this.generateId = function() {
		var nid = "";
		
		while(nid.length<7) {
			var n = (Math.random() * 46656) | 0;
			nid += ("" + n.toString(36)).slice(-8);
		}
		
		return nid;
	}		
	
	this.responseArgument = function(message, name) {
		app.dbConnect(function(err, db) {
			var carguments = db.collection('arguments');
			carguments.find({ argument: name }).toArray(function(err, docs) {
				docs.forEach(function(item) {
					var content = "";
					var index = message.content.indexOf(" "); 
					if(index > 0) {
						content = message.content.substring(index).trim() + " : ";
					}
					
					message.reply("" + content + "" + item.text);
				});
				
				db.close();
			});
		});
	}
}

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
			message.reply('I\'m not sure what \"' + first + '\" means, can you tell me? If you suggest an explanation and mention @jeukku I can learn.');
		}	
	};
	
	this.actions.deleteargument = {
		channel: "admin",
		handle: function(message) {
			console.log("deleteargument content \"" + message.content + "\"");
			var argumentname = message.content.substr(message.content.indexOf(" ")+1);
			console.log("deleting argument:\"" + argumentname + "\"");

			self.deleteArgument(argumentname, function(docs) {
				message.reply("removed argument:" + argumentname + " docs:" + JSON.stringify(docs));
			})
		}
	};

	this.actions.storeargument = {
		channel: "admin",
		handle: function(message) {
			app.dbConnect(function(err, db) {
				console.log("storeargument content \"" + message.content + "\"");
				var rest = message.content.substr(message.content.indexOf(" ")).trim();
				
				var argumentname = rest.substr(0, rest.indexOf(" ")).trim();
				var text = rest.substr(rest.indexOf(":") + 1).trim();
				
				console.log("argument:\"" + argumentname + "\" text:" + text);
				
				var carguments = db.collection('arguments');
				var query = { argument: argumentname };
				var update = { argument: argumentname, text: text }; 
				carguments.update(query, update, { upsert: true }, function(err, docs) {
					message.reply("stored argument:" + argumentname + " text:" + text);
					db.close();
					
					self.fetchArguments();
				});
			});
		}
	};


	this.actions.listarguments = {
		channel: "all",
		handle: function(message) {
			app.dbConnect(function(err, db) {
				console.log("listing arguments");
				var carguments = db.collection('arguments');
				carguments.find({}).toArray(function(err, docs) {
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

	this.deleteArgument = function(name, callback) {
			app.dbConnect(function(err, db) {
				var carguments = db.collection('arguments');
				var query = { argument: name };
				carguments.remove(query, function(err, docs) {
					callback(docs);
				});
			});
	}

	this.fetchArguments = function() {
		app.dbConnect(function(err, db) {
			var carguments = db.collection('arguments');
			carguments.find({}).toArray(function(err, docs) {
				console.log("arguments " + JSON.stringify(docs));

				var shoulddelete = "";
				
				docs.forEach(function(item) {
					var name = item.argument;
					if(name.indexOf(" ")>0 || name.indexOf(":")>0) {
						shoulddelete = name;
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
				
				if(shoulddelete.length>0) {
					self.deleteArgument(shoulddelete, function() {
						console.log("deleted " + shoulddelete);
					});
				}
				
			});
		});
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
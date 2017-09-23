module.exports = {
  apps : [{
    name        : "tzm-bot",
    script      : "server.js",
    watch       : ['server.js'],
	ignore_watch : ["src", "*.old", ".log", "ecosystem.config.js"],
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production"
    }
  }]
}

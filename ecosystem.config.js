module.exports = {
  apps : [{
    name        : "tzm-bot",
    script      : "server.js",
    watch       : true,
    ignore_watch : ["token", "podcasts", "src", "*.old", ".log", "logs", "ecosystem.config.js"],
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production"
    }
  }]
}

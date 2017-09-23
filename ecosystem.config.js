module.exports = {
  apps : [{
    name        : "mindmap",
    script      : "./server.js",
    watch       : true,
	ignore_watch : ["src"],
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production"
    }
  }]
}
#./node_modules/pm2/bin/pm2 stop all
./node_modules/pm2/bin/pm2 start ecosystem.config.js
#--no-daemon -i 1 --watch --name=tzm-bot server.js
./node_modules/pm2/bin/pm2 log


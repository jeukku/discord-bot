if [ ! -d node_modules/discord.js ]; then npm install discord.js; fi
if [ ! -d node_modules/express ]; then npm install express; fi
if [ ! -d node_modules/sleep ]; then npm install sleep; fi
if [ ! -d node_modules/mongodb ]; then npm install mongodb; fi
#npm install libsodium-wrappers --save
if [ ! -d node_modules/node-opus ]; then npm install node-opus; fi
if [ ! -d node_modules/async ]; then npm install async; fi

if [ ! -d podbot ]; then
	git clone https://github.com/tzmfi/podbot.git
fi

pkill pm2

pm2 stop all
sleep 1
pm2 kill
sleep 1

pm2 update

pm2 -i 0 start --no-daemon -i 0 --watch . --name=my-process server.js
pm2 log

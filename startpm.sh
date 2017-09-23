./node_modules/pm2/bin/pm2 stop all || true
./node_modules/pm2/bin/pm2 kill || true
./node_modules/pm2/bin/pm2 start ecosystem.config.js
#--no-daemon -i 1 --watch --name=tzm-bot server.js

if [ ! -d node_modules/discord.js ]; then npm install discord.js; fi
if [ ! -d node_modules/pm2 ]; then npm install pm2; fi
if [ ! -d node_modules/sleep ]; then npm install sleep; fi
if [ ! -d node_modules/mongodb ]; then npm install mongodb; fi
#npm install libsodium-wrappers --save
if [ ! -d node_modules/ffmpeg-binaries ]; then npm install ffmpeg-binaries; fi
if [ ! -d node_modules/node-opus ]; then npm install node-opus; fi
if [ ! -d node_modules/async ]; then npm install async; fi

if [ ! -d podbot ]; then
	git clone https://github.com/tzmfi/podbot.git
fi

./node_modules/pm2/bin/pm2 log



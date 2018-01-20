FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

RUN npm install pm2 -g

COPY package*.json ./

CMD ["pm2-docker", "ecosystem.config.js"]
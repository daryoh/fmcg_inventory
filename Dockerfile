FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000

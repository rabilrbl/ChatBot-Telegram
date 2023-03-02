FROM node:latest

LABEL fly_launch_runtime="nodejs"

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN yarn install

ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
FROM node:latest as builder

RUN apt-get update; apt-get upgrade -y

#######################################################################

RUN mkdir /app
WORKDIR /app

# NPM will not install any package listed in "devDependencies" when NODE_ENV is set to "production",
# to install all modules: "npm install --production=false".
# Ref: https://docs.npmjs.com/cli/v9/commands/npm-install#description

ENV NODE_ENV production

COPY . .


FROM node:latest

LABEL fly_launch_runtime="nodejs"

COPY --from=builder /app /app

WORKDIR /app

RUN npm install -g yarn

RUN yarn install

ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
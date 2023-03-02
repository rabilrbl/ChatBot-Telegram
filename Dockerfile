FROM node:latest

LABEL fly_launch_runtime="nodejs"

SHELL ["/bin/bash", "-c"]

# Switch timezone to Asia/Kolkata
RUN timedatectl set-timezone Asia/Kolkata

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN yarn install

ENV NODE_ENV production

CMD [ "yarn", "run", "start" ]
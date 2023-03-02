FROM node:latest

LABEL fly_launch_runtime="nodejs"

SHELL ["/bin/bash", "-c"]

ARG TIMEZONE=Asia/Kolkata
ENV TZ ${TIMEZONE}
RUN timedatectl set-timezone ${TZ}

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN yarn install

ENV NODE_ENV production

CMD [ "yarn", "run", "start" ]
FROM node:latest

LABEL fly_launch_runtime="nodejs"

SHELL ["/bin/bash", "-c"]

# Switch timezone to Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime && echo Asia/Kolkata > /etc/timezone

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN yarn install

ENV NODE_ENV production

CMD [ "yarn", "run", "start" ]
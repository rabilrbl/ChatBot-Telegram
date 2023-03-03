FROM node:latest

LABEL fly_launch_runtime="nodejs"

SHELL ["/bin/bash", "-c"]

ENV TZ=Asia/Kolkata
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y tzdata

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN yarn install

ENV NODE_ENV production

CMD [ "yarn", "run", "start" ]

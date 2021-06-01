FROM node:14-alpine

WORKDIR /src
ENV NODE_ENV production

# Only copy package.json and package-lock.json so
# that npm install can be cached
COPY package.json package-lock.json ./

# git is used to install npm packages from git
# ffmpeg is used for Discord Voice
# all other dependencies are for Discord additional packages
RUN apk add --no-cache git ffmpeg \
  && apk add --no-cache --virtual .build-deps python3 make g++ musl-dev \
  && npm ci --production \
  && apk del .build-deps

COPY . .

CMD ["npm", "start"]

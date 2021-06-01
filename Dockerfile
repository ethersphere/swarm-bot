FROM node:14-alpine

WORKDIR /src
ENV NODE_ENV production

COPY package.json package-lock.json ./
RUN apk add --no-cache git ffmpeg \
  && npm ci --production
COPY . .

CMD ["npm", "start"]

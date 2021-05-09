FROM node:14-alpine

WORKDIR /src
ENV NODE_ENV production

COPY . .
RUN apk add --no-cache git \
  && npm ci --production

CMD ["npm", "start"]

FROM node:14-alpine

WORKDIR /src
ENV NODE_ENV production

COPY . .
RUN npm ci --production

CMD ["npm", "start"]

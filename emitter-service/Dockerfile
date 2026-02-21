FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY .env ./
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

CMD ["npm", "run", "start"]

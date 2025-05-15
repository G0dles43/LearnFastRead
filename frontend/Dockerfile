FROM node:20

WORKDIR /app

COPY . /app/

RUN npm install
RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]

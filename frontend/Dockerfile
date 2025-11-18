# Etap 1: Budowanie (Node.js)
FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Tutaj React "wypala" zmienną środowiskową z .env.production
RUN npm run build

# Etap 2: Serwowanie (Nginx) - Lżejszy i szybszy niż 'serve'
FROM nginx:alpine

# Kopiujemy zbudowane pliki
COPY --from=build /app/dist /usr/share/nginx/html

# Konfiguracja Nginx pod Cloud Run (Port 8080 + React Router fix)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Cloud Run wymaga portu 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
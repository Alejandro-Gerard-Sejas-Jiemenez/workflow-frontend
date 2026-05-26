# Etapa 1: Construcción
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Sincronizar variables de entorno y construir
RUN npm run sync-env && npx ng build --configuration production

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiar el build (ajusta la ruta si tu proyecto se llama distinto)
COPY --from=build /app/dist/workflow-frontend/browser /usr/share/nginx/html
# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

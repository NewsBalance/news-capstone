# 1단계: build
FROM node:18-alpine AS builder
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: serve with nginx
FROM nginx:1.25-alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /frontend/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
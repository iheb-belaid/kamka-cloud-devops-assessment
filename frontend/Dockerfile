FROM nginx:1.27-alpine

ENV API_UPSTREAM=http://api:8080
ENV API_HOST_HEADER=api

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY src/ /usr/share/nginx/html/

EXPOSE 80


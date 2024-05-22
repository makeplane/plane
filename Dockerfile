FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
ENV NEXT_PUBLIC_API_BASE_URL=http://NEXT_PUBLIC_API_BASE_URL_PLACEHOLDER

RUN yarn global add turbo
RUN apk add tree
COPY . .

RUN turbo prune --scope=app --scope=plane-deploy --docker
CMD tree -I node_modules/

# Add lockfile and package.json's of isolated subworkspace
FROM node:18-alpine AS installer

RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# # Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
COPY replace-env-vars.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/replace-env-vars.sh

RUN yarn turbo run build

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    BUILT_NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN /usr/local/bin/replace-env-vars.sh http://NEXT_PUBLIC_WEBAPP_URL_PLACEHOLDER ${NEXT_PUBLIC_API_BASE_URL}

FROM python:3.11.1-alpine3.17 AS backend

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 

WORKDIR /code

RUN apk --no-cache add \
    "libpq~=15" \
    "libxslt~=1.1" \
    "nodejs-current~=19" \
    "xmlsec~=1.2" \
    "nginx" \
    "nodejs" \
    "npm" \
    "supervisor"

COPY apiserver/requirements.txt ./
COPY apiserver/requirements ./requirements
RUN apk add --no-cache libffi-dev
RUN apk add --no-cache --virtual .build-deps \
    "bash~=5.2" \
    "g++~=12.2" \
    "gcc~=12.2" \
    "cargo~=1.64" \
    "git~=2" \
    "make~=4.3" \
    "postgresql13-dev~=13" \
    "libc-dev" \
    "linux-headers" \
    && \
    pip install -r requirements.txt --compile --no-cache-dir \
    && \
    apk del .build-deps

# Add in Django deps and generate Django's static files
COPY apiserver/manage.py manage.py
COPY apiserver/plane plane/
COPY apiserver/templates templates/

RUN apk --no-cache add "bash~=5.2"
COPY apiserver/bin ./bin/

RUN chmod +x ./bin/*
RUN chmod -R 777 /code

# Expose container port and run entry point script

WORKDIR /app

COPY --from=installer /app/apps/app/next.config.js .
COPY --from=installer /app/apps/app/package.json .
COPY --from=installer /app/apps/space/next.config.js .
COPY --from=installer /app/apps/space/package.json .

COPY --from=installer /app/apps/app/.next/standalone ./

COPY --from=installer /app/apps/app/.next/static ./apps/app/.next/static

COPY --from=installer /app/apps/space/.next/standalone ./
COPY --from=installer /app/apps/space/.next ./apps/space/.next

ENV NEXT_TELEMETRY_DISABLED 1

# RUN rm /etc/nginx/conf.d/default.conf
#######################################################################
COPY nginx/nginx-single-docker-image.conf /etc/nginx/http.d/default.conf
#######################################################################

COPY nginx/supervisor.conf /code/supervisor.conf

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    BUILT_NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY replace-env-vars.sh /usr/local/bin/
COPY start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/replace-env-vars.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 80

CMD ["supervisord","-c","/code/supervisor.conf"]

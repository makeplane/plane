FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app

RUN apk add curl

COPY ./apps ./apps
COPY ./package.json ./package.json
COPY ./.eslintrc.json ./.eslintrc.json
COPY ./yarn.lock ./yarn.lock

RUN yarn global add turbo
RUN turbo prune --scope=app --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:18-alpine AS installer

RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=app...

FROM python:3.8.14-alpine3.16 AS runner

ENV SECRET_KEY ${SECRET_KEY}
ENV DATABASE_URL ${DATABASE_URL}
ENV REDIS_URL ${REDIS_URL}
ENV EMAIL_HOST ${EMAIL_HOST}
ENV EMAIL_HOST_USER ${EMAIL_HOST_USER}
ENV EMAIL_HOST_PASSWORD ${EMAIL_HOST_PASSWORD}

ENV AWS_REGION ${AWS_REGION}
ENV AWS_ACCESS_KEY_ID ${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY ${AWS_SECRET_ACCESS_KEY}
ENV AWS_S3_BUCKET_NAME ${AWS_S3_BUCKET_NAME}


ENV SENTRY_DSN ${SENTRY_DSN}
ENV WEB_URL ${WEB_URL}

ENV DISABLE_COLLECTSTATIC ${DISABLE_COLLECTSTATIC}

ENV GITHUB_CLIENT_SECRET ${GITHUB_CLIENT_SECRET}
ENV NEXT_PUBLIC_GITHUB_ID ${NEXT_PUBLIC_GITHUB_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENTID ${NEXT_PUBLIC_GOOGLE_CLIENTID}
ENV NEXT_PUBLIC_API_BASE_URL ${NEXT_PUBLIC_API_BASE_URL}

# Frontend

RUN apk --update --no-cache add \
    "libpq~=14" \
    "libxslt~=1.1" \
    "nodejs-current~=18" \
    "xmlsec~=1.2"

WORKDIR /app

# Don't run production as root
RUN addgroup -S plane && \
    adduser -S captain -G plane

USER captain

COPY --from=installer /app/apps/app/next.config.js .
COPY --from=installer /app/apps/app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=captain:plane /app/apps/app/.next/standalone ./
COPY --from=installer --chown=captain:plane /app/apps/app/.next/static ./apps/app/.next/static

EXPOSE 3000

# Backend

USER root


ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 


COPY ./apiserver/requirements.txt ./
COPY ./apiserver/requirements ./requirements
RUN apk add libffi-dev
RUN apk --update --no-cache --virtual .build-deps add \
    "bash~=5.1" \
    "g++~=11.2" \
    "gcc~=11.2" \
    "cargo~=1.60" \
    "git~=2" \
    "make~=4.3" \
    "postgresql13-dev~=13" \
    "libc-dev" \
    "linux-headers" \
    && \
    pip install -r requirements.txt --compile --no-cache-dir \
    && \
    apk del .build-deps


RUN chown captain.plane /app

# Add in Django deps and generate Django's static files
COPY ./apiserver/manage.py manage.py
COPY ./apiserver/plane plane/
COPY ./apiserver/templates templates/

COPY ./apiserver/gunicorn.config.py ./
USER root
RUN apk --update --no-cache add "bash~=5.1"
COPY ./bin ./bin/
USER captain

# Expose container port and run entry point script
EXPOSE 8000

RUN python manage.py migrate

RUN apk --update add supervisor

ADD /supervisor /src/supervisor

CMD ["supervisord","-c","/src/supervisor/service_script.conf"]
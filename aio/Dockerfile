# *****************************************************************************
# STAGE 1: Build the project
# *****************************************************************************
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
ENV NEXT_PUBLIC_API_BASE_URL=http://NEXT_PUBLIC_API_BASE_URL_PLACEHOLDER

RUN yarn global add turbo
COPY . .

RUN turbo prune --scope=web --scope=space --scope=admin --docker

# *****************************************************************************
# STAGE 2: Install dependencies & build the project
# *****************************************************************************
# Add lockfile and package.json's of isolated subworkspace
FROM node:18-alpine AS installer

RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# # Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_ADMIN_BASE_URL=""
ENV NEXT_PUBLIC_ADMIN_BASE_URL=$NEXT_PUBLIC_ADMIN_BASE_URL

ARG NEXT_PUBLIC_ADMIN_BASE_PATH="/god-mode"
ENV NEXT_PUBLIC_ADMIN_BASE_PATH=$NEXT_PUBLIC_ADMIN_BASE_PATH

ARG NEXT_PUBLIC_SPACE_BASE_URL=""
ENV NEXT_PUBLIC_SPACE_BASE_URL=$NEXT_PUBLIC_SPACE_BASE_URL

ARG NEXT_PUBLIC_SPACE_BASE_PATH="/spaces"
ENV NEXT_PUBLIC_SPACE_BASE_PATH=$NEXT_PUBLIC_SPACE_BASE_PATH

ENV NEXT_TELEMETRY_DISABLED 1
ENV TURBO_TELEMETRY_DISABLED 1

RUN yarn turbo run build

# *****************************************************************************
# STAGE 3: Copy the project and start it
# *****************************************************************************
# FROM makeplane/plane-aio-base AS runner
FROM makeplane/plane-aio-base:single-docker-image AS runner

USER root

WORKDIR /app

SHELL [ "/bin/bash", "-c" ]

COPY --from=installer /app/web/next.config.js ./web/
COPY --from=installer /app/web/package.json ./web/
COPY --from=installer /app/web/.next/standalone ./web
COPY --from=installer /app/web/.next/static ./web/.next/static
COPY --from=installer /app/web/public ./web/public

COPY --from=installer /app/space/next.config.js ./space/
COPY --from=installer /app/space/package.json ./space/
COPY --from=installer /app/space/.next/standalone ./space
COPY --from=installer /app/space/.next/static ./space/.next/static
COPY --from=installer /app/space/public ./space/public

COPY --from=installer /app/admin/next.config.js ./admin/
COPY --from=installer /app/admin/package.json ./admin/
COPY --from=installer /app/admin/.next/standalone ./admin
COPY --from=installer /app/admin/.next/static ./admin/.next/static
COPY --from=installer /app/admin/public ./admin/public

ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_ADMIN_BASE_URL=""
ENV NEXT_PUBLIC_ADMIN_BASE_URL=$NEXT_PUBLIC_ADMIN_BASE_URL

ARG NEXT_PUBLIC_ADMIN_BASE_PATH="/god-mode"
ENV NEXT_PUBLIC_ADMIN_BASE_PATH=$NEXT_PUBLIC_ADMIN_BASE_PATH

ARG NEXT_PUBLIC_SPACE_BASE_URL=""
ENV NEXT_PUBLIC_SPACE_BASE_URL=$NEXT_PUBLIC_SPACE_BASE_URL

ARG NEXT_PUBLIC_SPACE_BASE_PATH="/spaces"
ENV NEXT_PUBLIC_SPACE_BASE_PATH=$NEXT_PUBLIC_SPACE_BASE_PATH

ARG NEXT_PUBLIC_WEB_BASE_URL=""
ENV NEXT_PUBLIC_WEB_BASE_URL=$NEXT_PUBLIC_WEB_BASE_URL

ENV NEXT_TELEMETRY_DISABLED 1
ENV TURBO_TELEMETRY_DISABLED 1


# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 

COPY apiserver/requirements.txt ./api/
COPY apiserver/requirements ./api/requirements

# RUN python3.12 -m pip install --upgrade pip

# RUN echo "alias python=/usr/local/bin/python3.12" >> ~/.bashrc && \
#     echo "alias pip=/usr/local/bin/pip3.12" >> ~/.bashrc

RUN pip install -r ./api/requirements.txt --compile --no-cache-dir
# RUN apt-get install python3.12-venv -y

# RUN python3 -m venv /app/venv && \
#     source /app/venv/bin/activate && \
#     /app/venv/bin/pip install --upgrade pip && \
#     /app/venv/bin/pip install -r ./api/requirements.txt --compile --no-cache-dir

# Add in Django deps and generate Django's static files
COPY apiserver/manage.py ./api/manage.py
COPY apiserver/plane ./api/plane/
COPY apiserver/templates ./api/templates/

COPY apiserver/bin ./api/bin/

RUN chmod +x ./api/bin/*
RUN chmod -R 777 ./api/

COPY aio/supervisord.conf /app/supervisord.conf

RUN chown -R app-user:app-user /app

USER app-user

# RUN echo "alias python=/usr/local/bin/python3.12" >> ~/.bashrc && \
#     echo "alias pip=/usr/local/bin/pip3.12" >> ~/.bashrc

CMD ["sudo", "/usr/bin/supervisord", "-c", "/app/supervisord.conf"]
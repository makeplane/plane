FROM python:3.12.10-alpine

# set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 
ENV INSTANCE_CHANGELOG_URL=https://sites.plane.so/pages/691ef037bcfe416a902e48cb55f59891/

# Update system packages for security
RUN apk update && apk upgrade

WORKDIR /code

RUN apk add --no-cache --upgrade \
    "libpq" \
    "libxslt" \
    "xmlsec" \
    "ca-certificates" \
    "openssl"

COPY requirements.txt ./
COPY requirements ./requirements
RUN apk add --no-cache libffi-dev
RUN apk add --no-cache --virtual .build-deps \
    "bash~=5.2" \
    "g++" \
    "gcc" \
    "cargo" \
    "git" \
    "make" \
    "postgresql-dev" \
    "libc-dev" \
    "linux-headers" \
    && \
    pip install -r requirements.txt --compile --no-cache-dir \
    && \
    apk del .build-deps \
    && \
    rm -rf /var/cache/apk/*


# Add in Django deps and generate Django's static files
COPY manage.py manage.py
COPY plane plane/
COPY templates templates/
COPY package.json package.json

RUN apk --no-cache add "bash~=5.2"
COPY ./bin ./bin/

RUN mkdir -p /code/plane/logs
RUN chmod +x ./bin/*
RUN chmod -R 777 /code

# Expose container port and run entry point script
EXPOSE 8000

CMD ["./bin/docker-entrypoint-api.sh"]
# Production Docker Compose

Este repositório mantém um compose de produção em `docker-compose.prod.yml`. Ele usa imagens versionadas e deixa os dados em volumes nomeados do Docker, como no compose usado atualmente em produção.

## Imagens do Fork

O workflow `Build Production Docker Images` publica estas imagens no GitHub Container Registry:

- `ghcr.io/<owner>/<repo>/plane-frontend`
- `ghcr.io/<owner>/<repo>/plane-space`
- `ghcr.io/<owner>/<repo>/plane-admin`
- `ghcr.io/<owner>/<repo>/plane-live`
- `ghcr.io/<owner>/<repo>/plane-backend`
- `ghcr.io/<owner>/<repo>/plane-proxy`

As tags publicadas são:

- a branch sanitizada, por exemplo `main`, `preview` ou `canary`
- `sha-<short-sha>`
- `latest`, apenas na branch padrão
- a tag informada manualmente no input `app_release`, quando o workflow for executado por `workflow_dispatch`

## Variáveis da Produção

No servidor de produção, mantenha o `.env` fora do Git e configure as imagens que devem ser baixadas:

```dotenv
APP_RELEASE=main

PLANE_FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/plane-frontend
PLANE_SPACE_IMAGE=ghcr.io/<owner>/<repo>/plane-space
PLANE_ADMIN_IMAGE=ghcr.io/<owner>/<repo>/plane-admin
PLANE_LIVE_IMAGE=ghcr.io/<owner>/<repo>/plane-live
PLANE_BACKEND_IMAGE=ghcr.io/<owner>/<repo>/plane-backend
PLANE_PROXY_IMAGE=ghcr.io/<owner>/<repo>/plane-proxy
```

Configure também as URLs públicas absolutas, sempre com `https://`, para que o backend monte os redirects de autenticação corretamente:

```dotenv
APP_BASE_URL=https://plane.agncflamingo.com.br
WEB_URL=https://plane.agncflamingo.com.br
ADMIN_BASE_URL=https://plane.agncflamingo.com.br
SPACE_BASE_URL=https://plane.agncflamingo.com.br
LIVE_BASE_URL=https://plane.agncflamingo.com.br
CORS_ALLOWED_ORIGINS=https://plane.agncflamingo.com.br,http://127.0.0.1
```

As imagens de frontend embutem as variáveis públicas `VITE_*` durante o build. O workflow `Build Production Docker Images` usa `vars.PRODUCTION_APP_BASE_URL` para preencher essas variáveis; se a variável não existir, usa `https://plane.agncflamingo.com.br`.

Se o pacote GHCR estiver privado, faça login no servidor antes do pull:

```sh
docker login ghcr.io
```

## Preservando Dados Existentes

Os dados persistentes ficam nestes volumes:

- `pgdata`
- `redisdata`
- `uploads`
- `rabbitmq_data`
- `logs_api`
- `logs_worker`
- `logs_beat-worker`
- `logs_migrator`

Para não criar volumes novos sem perceber, rode o novo compose no mesmo diretório/projeto Docker Compose usado hoje em produção, ou mantenha o mesmo `COMPOSE_PROJECT_NAME` no `.env`.

Antes da primeira troca, confira os volumes atuais:

```sh
docker compose ls
docker volume ls
docker compose -f docker-compose.prod.yml config --volumes
```

Não use `docker compose down -v` em produção, porque esse comando remove volumes e pode apagar banco, uploads e filas.

## Deploy

Fluxo recomendado no servidor:

```sh
git pull
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up migrator
docker compose -f docker-compose.prod.yml up -d
```

Para rollback, altere `APP_RELEASE` no `.env` para a tag anterior e rode novamente:

```sh
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

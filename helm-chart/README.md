# plane

![Version: 0.0.1](https://img.shields.io/badge/Version-0.0.1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v0.12.2-dev](https://img.shields.io/badge/AppVersion-v0.12.2--dev-informational?style=flat-square)

🔥🔥🔥 Open Source JIRA, Linear and Height Alternative. Plane helps you track your issues, epics, and product roadmaps in the simplest way possible.

**Homepage:** <https://plane.so/>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| jordibeen | <jordi@been.gg> | <https://github.com/jordibeen> |

## Source Code

* <https://github.com/makeplane/plane>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://charts.bitnami.com/bitnami | postgresql | 12.1.6 |
| https://charts.bitnami.com/bitnami | redis | 17.9.4 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| nodeSelector | object | `{}` |  |
| planeApi.ingressRoute.enabled | bool | `false` |  |
| planeApi.ingressRoute.host | string | `""` |  |
| planeApi.ingressRoute.tls.secretName | string | `""` |  |
| planeApi.resources | object | `{}` |  |
| planeBackend.env.AWS_ACCESS_KEY_ID | string | `"access-key"` |  |
| planeBackend.env.AWS_REGION | string | `""` |  |
| planeBackend.env.AWS_S3_BUCKET_NAME | string | `"uploads"` |  |
| planeBackend.env.AWS_SECRET_ACCESS_KEY | string | `"secret-key"` |  |
| planeBackend.env.DATABASE_URL | string | `"postgresql://plane:plane@plane-postgresql/plane"` | Database connection string |
| planeBackend.env.DEBUG | int | `0` | Debug value for api server use it as 0 for production use |
| planeBackend.env.DEFAULT_EMAIL | string | `"captain@plane.so"` | Default Creds |
| planeBackend.env.DEFAULT_PASSWORD | string | `"password123"` |  |
| planeBackend.env.DOCKERIZED | int | `1` | Settings related to Docker |
| planeBackend.env.EMAIL_FROM | string | `"Team Plane <team@mailer.plane.so>"` |  |
| planeBackend.env.EMAIL_HOST | string | `""` | Email Settings |
| planeBackend.env.EMAIL_HOST_PASSWORD | string | `""` |  |
| planeBackend.env.EMAIL_HOST_USER | string | `""` |  |
| planeBackend.env.EMAIL_PORT | int | `587` |  |
| planeBackend.env.EMAIL_USE_SSL | string | `"0"` |  |
| planeBackend.env.EMAIL_USE_TLS | string | `"1"` |  |
| planeBackend.env.ENABLE_SIGNUP | int | `1` | SignUps |
| planeBackend.env.GITHUB_CLIENT_SECRET | string | `nil` | Github |
| planeBackend.env.GPT_ENGINE | string | `"gpt-3.5-turbo"` |  |
| planeBackend.env.NGINX_PORT | string | `nil` | Nginx Configuration |
| planeBackend.env.OPENAI_API_BASE | string | `"https://api.openai.com/v1"` |  |
| planeBackend.env.OPENAI_API_KEY | string | `"sk-"` |  |
| planeBackend.env.REDIS_URL | string | `"redis://plane-redis-master:6379/"` | Redis connection string |
| planeBackend.env.SECRET_KEY | string | `"secret"` | Secret key (generate one with `openssl rand -base64 42`) |
| planeBackend.env.SENTRY_DSN | string | `nil` | Error logs |
| planeBackend.env.USE_MINIO | int | `0` | Set to 1 If using the pre-configured minio setup  |
| planeBackend.env.WEB_URL | string | `"http://localhost:3000"` | Email Redirection URL |
| planeBackend.image.pullPolicy | string | `"IfNotPresent"` |  |
| planeBackend.image.pullSecret | string | `""` |  |
| planeBackend.image.repository | string | `"makeplane/plane-backend"` |  |
| planeBackend.image.tag | string | `"v0.12.2-dev"` |  |
| planeBeat.resources | object | `{}` |  |
| planeFrontend.env.NEXT_PUBLIC_API_BASE_URL | string | `"http://localhost:8000"` | API Base URL |
| planeFrontend.env.NEXT_PUBLIC_ENABLE_OAUTH | int | `0` | Enable/Disable OAUTH - default 0 for selfhosted instance  |
| planeFrontend.env.NEXT_PUBLIC_ENABLE_SENTRY | int | `0` | Enable/Disable sentry |
| planeFrontend.env.NEXT_PUBLIC_ENABLE_SESSION_RECORDER | int | `0` | Enable/Disable session recording  |
| planeFrontend.env.NEXT_PUBLIC_EXTRA_IMAGE_DOMAINS | string | `nil` | Extra image domains that need to be added for Next Image |
| planeFrontend.env.NEXT_PUBLIC_GITHUB_APP_NAME | string | `nil` | Github App Name for GitHub Integration |
| planeFrontend.env.NEXT_PUBLIC_GITHUB_ID | string | `nil` | Github ID for Github OAuth |
| planeFrontend.env.NEXT_PUBLIC_GOOGLE_CLIENTID | string | `nil` | Google Client ID for Google OAuth |
| planeFrontend.env.NEXT_PUBLIC_SENTRY_DSN | string | `nil` | Sentry DSN for error monitoring |
| planeFrontend.env.NEXT_PUBLIC_SLACK_CLIENT_ID | string | `nil` | Slack for Slack Integration |
| planeFrontend.env.NEXT_PUBLIC_TRACK_EVENTS | int | `0` | Enable/Disable event tracking |
| planeFrontend.image.pullPolicy | string | `"IfNotPresent"` |  |
| planeFrontend.image.pullSecret | string | `""` |  |
| planeFrontend.image.repository | string | `"makeplane/plane-frontend"` |  |
| planeFrontend.image.tag | string | `"v0.12.2-dev"` |  |
| planeFrontend.ingressRoute.enabled | bool | `false` |  |
| planeFrontend.ingressRoute.host | string | `""` |  |
| planeFrontend.ingressRoute.tls.secretName | string | `""` |  |
| planeFrontend.resources | object | `{}` |  |
| planeWorker.resources | object | `{}` |  |
| postgresql | object | see `values.yaml` | Configuration values for the postgresql dependency. ref: https://github.com/bitnami/charts/tree/main/bitnami/postgresql |
| redis | object | see `values.yaml` | Configuration values for the Redis dependency. ref: https://github.com/bitnami/charts/blob/master/bitnami/redis More documentation can be found here: https://artifacthub.io/packages/helm/bitnami/redis |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.2](https://github.com/norwoodj/helm-docs/releases/v1.11.2)

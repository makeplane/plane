# plane

![Version: 0.0.1](https://img.shields.io/badge/Version-0.0.1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.12.1](https://img.shields.io/badge/AppVersion-0.12.1-informational?style=flat-square)

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
| affinity | object | `{}` |  |
| nodeSelector | object | `{}` |  |
| planeApi.ingressRoute.enabled | bool | `false` |  |
| planeApi.ingressRoute.host | string | `""` |  |
| planeApi.ingressRoute.tls.secretName | string | `""` |  |
| planeApi.resources | object | `{}` |  |
| planeBackend.config.AWS_ACCESS_KEY_ID | string | `"access-key"` |  |
| planeBackend.config.AWS_REGION | string | `""` | AWS Settings |
| planeBackend.config.AWS_S3_BUCKET_NAME | string | `"uploads"` |  |
| planeBackend.config.AWS_SECRET_ACCESS_KEY | string | `"secret-key"` |  |
| planeBackend.config.DATABASE_URL | string | `"postgresql://plane:plane@plane-db/plane"` | Database Settings |
| planeBackend.config.DEBUG | int | `0` | Debug value for api server use it as 0 for production use |
| planeBackend.config.DEFAULT_EMAIL | string | `"captain@plane.so"` | Default Creds |
| planeBackend.config.DEFAULT_PASSWORD | string | `"password123"` |  |
| planeBackend.config.DOCKERIZED | int | `0` | Settings related to Docker |
| planeBackend.config.EMAIL_FROM | string | `"Team Plane <team@mailer.plane.so>"` |  |
| planeBackend.config.EMAIL_HOST | string | `""` | Email Settings |
| planeBackend.config.EMAIL_HOST_PASSWORD | string | `""` |  |
| planeBackend.config.EMAIL_HOST_USER | string | `""` |  |
| planeBackend.config.EMAIL_PORT | int | `587` |  |
| planeBackend.config.EMAIL_USE_SSL | string | `"0"` |  |
| planeBackend.config.EMAIL_USE_TLS | string | `"1"` |  |
| planeBackend.config.ENABLE_SIGNUP | int | `1` | SignUps |
| planeBackend.config.GITHUB_CLIENT_SECRET | string | `nil` | Github |
| planeBackend.config.GPT_ENGINE | string | `nil` |  |
| planeBackend.config.NEXT_PUBLIC_API_BASE_URL | string | `nil` | Auto generated and Required that will be generated from setup.sh |
| planeBackend.config.NGINX_PORT | string | `nil` | Nginx Configuration |
| planeBackend.config.OPENAI_API_KEY | string | `nil` | GPT settings |
| planeBackend.config.REDIS_URL | string | `"redis://plane-redis:6379/"` | Redis Settings |
| planeBackend.config.SECRET_KEY | string | `nil` |  |
| planeBackend.config.SENTRY_DSN | string | `nil` | Error logs |
| planeBackend.config.USE_MINIO | int | `0` | set to 1 If using the pre-configured minio setup  |
| planeBackend.config.WEB_URL | string | `nil` |  |
| planeBackend.image.pullPolicy | string | `"IfNotPresent"` |  |
| planeBackend.image.pullSecret | string | `""` |  |
| planeBackend.image.repository | string | `"makeplane/plane-backend"` |  |
| planeBackend.image.tag | string | `"latest"` |  |
| planeBeat.resources | object | `{}` |  |
| planeFrontend.config.NEXT_PUBLIC_ENABLE_OAUTH | int | `0` | Enable/Disable OAUTH - default 0 for selfhosted instance  |
| planeFrontend.config.NEXT_PUBLIC_ENABLE_SENTRY | int | `0` | Enable/Disable sentry |
| planeFrontend.config.NEXT_PUBLIC_ENABLE_SESSION_RECORDER | int | `0` | Enable/Disable session recording  |
| planeFrontend.config.NEXT_PUBLIC_EXTRA_IMAGE_DOMAINS | string | `nil` | Extra image domains that need to be added for Next Image |
| planeFrontend.config.NEXT_PUBLIC_GITHUB_APP_NAME | string | `nil` | Github App Name for GitHub Integration |
| planeFrontend.config.NEXT_PUBLIC_GITHUB_ID | string | `nil` | Github ID for Github OAuth |
| planeFrontend.config.NEXT_PUBLIC_GOOGLE_CLIENTID | string | `nil` | Google Client ID for Google OAuth |
| planeFrontend.config.NEXT_PUBLIC_SENTRY_DSN | string | `nil` | Sentry DSN for error monitoring |
| planeFrontend.config.NEXT_PUBLIC_SLACK_CLIENT_ID | string | `nil` | Slack for Slack Integration |
| planeFrontend.config.NEXT_PUBLIC_TRACK_EVENTS | int | `0` | Enable/Disable event tracking |
| planeFrontend.image.pullPolicy | string | `"IfNotPresent"` |  |
| planeFrontend.image.pullSecret | string | `""` |  |
| planeFrontend.image.repository | string | `"makeplane/plane-frontend"` |  |
| planeFrontend.image.tag | string | `"latest"` |  |
| planeFrontend.ingressRoute.enabled | bool | `false` |  |
| planeFrontend.ingressRoute.host | string | `""` |  |
| planeFrontend.ingressRoute.tls.secretName | string | `""` |  |
| planeFrontend.resources | object | `{}` |  |
| planeWorker.resources | object | `{}` |  |
| postgresql | object | see `values.yaml` | Configuration values for the postgresql dependency. ref: https://github.com/bitnami/charts/tree/main/bitnami/postgresql |
| redis | object | see `values.yaml` | Configuration values for the Redis dependency. ref: https://github.com/bitnami/charts/blob/master/bitnami/redis More documentation can be found here: https://artifacthub.io/packages/helm/bitnami/redis |
| tolerations | list | `[]` |  |
| topologySpreadConstraints | list | `[]` | TopologySpreadConstrains to be added to all deployments |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.2](https://github.com/norwoodj/helm-docs/releases/v1.11.2)

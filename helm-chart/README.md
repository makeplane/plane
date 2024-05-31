### Plane Helm Setup
---

Follow below steps to setup **Plane**

Add Helm Repo
```
helm repo add makeplane https://helm.plane.so/
```

You must refer the configuration variables before proceeding. This can be done by running the below command or visiting **Configuration** tab. 
```
helm show values plane-ce --repo https://helm.plane.so 
```


Basic Install
```
helm install \
    --create-namespace \
    --namespace plane-ns \
    --set ingress.appHost="plane.example.com" \
    --set ingress.minioHost="plane-minio.example.com" \
    my-plane makeplane/plane-ce
```

Customise Remote Postgress URL
```
    --set postgres.local_setup=false \
    --set env.pgdb_remote_url="postgress://[username]:[password]@[pg-host]/[db-name]" \
```

Customise Remote Redis URL
```
    --set redis.local_setup=false \
    --set env.remote_redis_url="redis://[redis-host]:[6379]" \
```

Customise Document Store - Change from Minio to AWS S3
```
    --set minio.local_setup=false \
    --set env.aws_access_key="xxxxxxx" \
    --set env.aws_secret_access_key="xxxxxxx" \
    --set env.aws_region="xxxxxxx" \
    --set env.docstore_bucket="xxxxxxx" \
```

Customise with SSL

_Before proceeding with SSL configuration, make sure you have followed the steps in "**SSL Certificate**" tab_
```
    --set ssl.createIssuer=true \
    --set ssl.issuer=cloudflare \
    --set ssl.token=xxxxxxxx \
    --set ssl.email="plane-admin@example.com" \
    --set ssl.generateCerts=true \

```

Configuration Settings Available

| Setting 	| Default 	| Required 	| Description 	|
|---	|:---:	|:---:	|---	|
| planeVersion 	| stable 	| Yes 	|  	|
| **Ingress Setup** 	|  	|  	|  	|
| ingress.appHost 	| 'plane.example.com' 	| Yes 	|  	|
| ingress.minioHost 	| 'plane-minio.example.com' 	|  	| (Optional) Required to open minio console interface 	|
| ingress.ingressClass 	| 'nginx' 	| Yes 	| can be any of the supported ingress controller class (eg. nginx, traefik, etc) 	|
| ingress.clientMaxBodySize 	| 5m 	| Yes 	| This is set at the ingress controller level to support max data from client. 	|
| **SSL Settings** 	|  	|  	|  	|
| ssl.createIssuer 	| false 	|  	| Set it to true to create Let's Encrypt Service based issuer 	|
| ssl.issuer 	| http 	|  	| (Yes, if createIssuer = true) Allowed - cloudflare, digitalocean, http 	|
| ssl.token 	|  	|  	| (Yes, if createIssuer = true) api token of dns provider, not required for http 	|
| ssl.server 	| https://acme-v02.api.letsencrypt.org/directory 	|  	| (Yes, if createIssuer = true)Lets Encrypt SSL Generation API.  Staging: https://acme-staging-v02.api.letsencrypt.org/directory 	|
| ssl.email 	| plane-admin@example.com 	|  	| (Yes, if createIssuer = true) Required by Let's Encrypt. Change to a valid email id 	|
| ssl.generateCerts 	| false 	|  	|  	|
| **Redis Setup** 	|  	|  	|  	|
| redis.local_setup 	| true 	|  	|  	|
| redis.image 	| redis:6.2.7-alpine 	|  	|  	|
| redis.servicePort 	| 6379 	|  	| Yes, if redis.local_setup=true 	|
| redis.storageClass 	| longhorn 	|  	| Yes, if redis.local_setup=true 	|
| redis.volumeSize 	| 1Gi 	|  	| Yes, if redis.local_setup=true 	|
| **Postgress DB Setup** 	|  	|  	|  	|
| postgres.local_setup 	| true 	|  	|  	|
| postgres.image 	| postgres:15.5-alpine 	|  	| Yes, if postgres.local_setup=true 	|
| postgres.servicePort 	| 5432 	|  	| Yes, if postgres.local_setup=true 	|
| postgres.cliConnectPort 	|  	| 	| Provide if you want to expose the NODE PORT for local connectivity 	|
| postgres.storageClass 	| longhorn 	|  	| Yes, if postgres.local_setup=true 	|
| postgres.volumeSize 	| 5Gi 	|  	| Yes, if postgres.local_setup=true 	|
| **Doc Store (Minio) Setup** 	|  	|  	|  	|
| minio.local_setup 	| true 	|  	| In case this is false, AWS-S3 will settings will be required 	|
| minio.image 	| minio/minio:latest 	|  	| Yes, if minio.local_setup=true 	|
| minio.storageClass 	| longhorn 	|  	| Yes, if minio.local_setup=true 	|
| minio.volumeSize 	| 5Gi 	|  	| Yes, if minio.local_setup=true 	|
| minio.root_user 	| admin 	|  	| Yes, if minio.local_setup=true 	|
| minio.root_password 	| password 	|  	| Yes, if minio.local_setup=true 	|
| **Web Deployment** 	|  	|  	|  	|
| web.replicas 	| 1 	| Yes 	| must be >=1 	|
| web.memoryLimit 	| 1000Mi 	|  	|  	|
| web.cpuLimit 	| 500m 	|  	|  	|
| **Space Deployment** 	|  	|  	|  	|
| space.replicas 	| 1 	| Yes 	| must be >=1 	|
| space.memoryLimit 	| 1000Mi 	|  	|  	|
| space.cpuLimit 	| 500m 	|  	|  	|
| **API Deployment** 	|  	|  	|  	|
| api.replicas 	| 1 	| Yes 	| must be >=1 	|
| api.memoryLimit 	| 1000Mi 	|  	|  	|
| api.cpuLimit 	| 500m 	|  	|  	|
| **Worker Deployment** 	|  	|  	|  	|
| worker.replicas 	| 1 	| Yes 	| must be >=1 	|
| worker.memoryLimit 	| 1000Mi 	|  	|  	|
| worker.cpuLimit 	| 500m 	|  	|  	|
| **Beat Worker Deployment** 	|  	|  	|  	|
| beatworker.replicas 	| 1 	| Yes 	| must be >=1 	|
| beatworker.memoryLimit 	| 1000Mi 	|  	|  	|
| beatworker.cpuLimit 	| 500m 	|  	|  	|
| **Common Environment Settings** 	|  	|  	|  	|
| env.pgdb_username 	| plane 	|  	|  Used for postgres.local_setup=true	|
| env.pgdb_password 	| plane 	|  	|  Used for postgres.local_setup=true	|
| env.pgdb_name 	| plane 	|  	|  Used for postgres.local_setup=true	|
| env.pgdb_remote_url 	| '' 	|  	| Provided with Postgress Remote DB URI when postgres.local_setup=false 	|
| env.remote_redis_url 	| '' 	|  	| Provided with Remote Redis URI when redis.local_setup=false 	|
| env.docstore_bucket 	| 'uploads' 	| YES 	| Minio / AWS-S3 Bucket Name 	|
| env.doc_upload_size_limit 	| 5242880 	| YES 	| Document Upload Size Limit (default to 5Mb) 	|
| env.aws_access_key 	| '' 	|  	| Required, in case minio.local_setup = false 	|
| env.aws_secret_access_key 	| '' 	|  	| Required, in case minio.local_setup = false 	|
| env.aws_region 	| '' 	|  	| Required, in case minio.local_setup = false 	|
| env.secret_key 	| '60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5' 	|  	| Random secret key for data encoding during transit. 	|
| env.sentry_dsn 	| '' 	|  	| Sentry DSN for error logging 	|
| env.sentry_environment 	| '' 	|  	| Sentry Environment Name 	|

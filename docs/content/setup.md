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
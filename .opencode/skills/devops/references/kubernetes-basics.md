# Kubernetes Core Concepts

## Cluster Architecture

```
CONTROL PLANE                    WORKER NODES
├── API Server (kubectl)         ├── Kubelet (node agent)
├── Scheduler (pod placement)    ├── Kube-proxy (networking)
├── Controller Manager           └── Container Runtime
└── etcd (cluster state)
```

## Pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: myapp:1.0
    ports:
    - containerPort: 8080
    resources:
      requests: { memory: "256Mi", cpu: "250m" }
      limits: { memory: "512Mi", cpu: "500m" }
```

## Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  selector:
    matchLabels: { app: myapp }
  template:
    metadata:
      labels: { app: myapp }
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
```

## Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP  # ClusterIP, NodePort, LoadBalancer
  selector: { app: myapp }
  ports:
  - port: 8080
    targetPort: 8080
```

## ConfigMap & Secret
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "postgres.svc.cluster.local"
---
apiVersion: v1
kind: Secret
type: Opaque
stringData:
  password: secretpassword
```

## Workload Types

| Type | Use Case |
|------|----------|
| Deployment | Stateless apps |
| StatefulSet | Databases |
| DaemonSet | One per node |
| Job | Batch tasks |
| CronJob | Scheduled |

## Labels
```yaml
labels:
  app: myapp
  version: v1.0.0
  tier: frontend
  environment: prod
```

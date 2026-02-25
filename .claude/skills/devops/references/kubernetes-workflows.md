# Kubernetes Workflows

## GitOps Architecture

```
Git Repository (desired state)
         │ Watches
         ▼
GitOps Agent (Argo CD / Flux)
         │ Syncs
         ▼
Kubernetes Cluster (actual state)
```

**Benefits:** Single source of truth, auditable, automated, easy rollback

## Argo CD Setup

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl port-forward svc/argocd-server -n argocd 8080:443
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Application Manifest
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp
    targetRevision: HEAD
    path: k8s/manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Deployment Patterns

### Rolling Update
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Blue-Green
```yaml
# Two deployments: myapp-blue, myapp-green
# Service selector switches between versions
selector:
  app: myapp
  version: blue  # Change to 'green' to switch
```

### Canary (with Istio)
```yaml
route:
- destination: { host: myapp, subset: v1 }
  weight: 90
- destination: { host: myapp, subset: v2 }
  weight: 10  # 10% canary
```

See `kubernetes-workflows-advanced.md` for CI/CD, Kustomize patterns.

# Kubernetes Workflows Advanced

## CI/CD Pipeline
```yaml
# GitHub Actions
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - run: docker build . -t $REGISTRY/$IMAGE:${{ github.sha }}
    - run: docker push $REGISTRY/$IMAGE:${{ github.sha }}

  deploy:
    needs: build
    steps:
    - uses: actions/checkout@v3
      with:
        repository: myorg/gitops-repo
        token: ${{ secrets.GITOPS_TOKEN }}
    - run: |
        sed -i 's|image:.*|image: $REGISTRY/$IMAGE:${{ github.sha }}|' k8s/deployment.yaml
        git commit -am "Update image" && git push
```

## Kustomize

```
kustomize/
├── base/
│   ├── kustomization.yaml
│   └── deployment.yaml
└── overlays/
    └── prod/
        └── kustomization.yaml
```

### Base
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
commonLabels:
  app: myapp
```

### Prod Overlay
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
replicas:
- name: myapp
  count: 5
```

```bash
kubectl apply -k overlays/prod/
```

## Flux CD
```bash
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/my-cluster
```

# Helm Package Management

## Core Concepts

- **Chart:** Helm package with K8s resource definitions
- **Repository:** Collection of charts
- **Release:** Deployed instance of a chart
- **Values:** Configuration that parameterizes charts

## Chart Structure

```
mychart/
├── Chart.yaml              # Metadata
├── values.yaml             # Default values
├── charts/                 # Dependencies
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl       # Template helpers
│   └── NOTES.txt
└── values.schema.json     # Validation (optional)
```

## Essential Commands

```bash
helm create mychart           # Create chart
helm lint mychart             # Validate
helm template myrelease ./mychart  # Render locally
helm install myrelease ./mychart --dry-run --debug  # Preview

helm install myrelease ./mychart
helm install myrelease ./mychart -f values-prod.yaml
helm install myrelease ./mychart --set replicaCount=3

helm upgrade myrelease ./mychart
helm rollback myrelease 1
helm list
helm uninstall myrelease
```

## Multi-Environment

```bash
# Files: values.yaml, values-dev.yaml, values-prod.yaml
helm install myapp ./mychart -f values.yaml -f values-prod.yaml
helm install myapp ./mychart --set replicaCount=3 --set image.tag=v1.2.3
```

## values.yaml Example

```yaml
replicaCount: 2
image:
  repository: myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 8080
resources:
  limits: { cpu: 500m, memory: 512Mi }
  requests: { cpu: 250m, memory: 256Mi }
```

## Dependencies

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "12.1.0"
    repository: "https://charts.bitnami.com/bitnami"
```

```bash
helm dependency update mychart
```

See `kubernetes-helm-advanced.md` for templates, hooks, and packaging.

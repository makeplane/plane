# Helm Chart: Plane Community

Click on the below link to access the helm chart instructions.

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/makeplane)](https://artifacthub.io/packages/helm/makeplane/plane-ce)

Quick install:

```bash
helm repo add makeplane https://helm.plane.so/
helm repo update
helm install plane makeplane/plane-ce --namespace plane-ce --create-namespace
```

See the [Kubernetes self-hosting guide](https://developers.plane.so/self-hosting/methods/kubernetes) for the values you need to set (domain, ingress, external services).

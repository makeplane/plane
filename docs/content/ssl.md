
If you are looking at generating Let's Encrypt SSL Certificate, preinstall Cert-Manager using below steps before moving to installing **Plane**
```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.1/cert-manager.crds.yaml

helm repo add jetstack https://charts.jetstack.io

helm install cert-manager --create-namespace --namespace cert-manager --version v1.13.1 jetstack/cert-manager --set startupapicheck.timeout=5m

helm uninstall cert-manager -n cert-manager

```

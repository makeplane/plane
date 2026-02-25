# kubectl Essential Commands

## Cluster & Node
```bash
kubectl cluster-info
kubectl get nodes
kubectl describe node <node-name>
kubectl top nodes
kubectl drain <node-name> --ignore-daemonsets
kubectl uncordon <node-name>
```

## Pod Operations
```bash
kubectl get pods -A                     # All namespaces
kubectl get pods -o wide                # Extended info
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs -f <pod-name>              # Follow
kubectl logs --previous <pod-name>      # Previous crash
kubectl exec -it <pod-name> -- /bin/bash
```

## Deployment
```bash
kubectl apply -f manifest.yaml
kubectl apply -f ./manifests/
kubectl apply -f manifest.yaml --dry-run=client -o yaml  # Preview
kubectl set image deployment/myapp app=myapp:v2
kubectl delete -f manifest.yaml
```

## Service & Network
```bash
kubectl port-forward service/myapp 8080:8080
kubectl get svc
kubectl exec -it <pod-name> -- curl http://service:8080
kubectl exec -it <pod-name> -- nslookup kubernetes.default
```

## Debugging (Get → Describe → Logs)
```bash
kubectl get pods -o wide
kubectl get events -n <ns> --sort-by='.lastTimestamp'
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c <container>
```

## Output & Filtering
```bash
kubectl get pods -o json
kubectl get pods -o yaml
kubectl get pods -l app=myapp,tier=frontend
kubectl get pods --field-selector=status.phase=Running
kubectl get pods -w                     # Watch
```

## Flags

| Flag | Purpose |
|------|---------|
| `-n` | Namespace |
| `-A` | All namespaces |
| `-o` | Output format |
| `-l` | Label selector |
| `-w` | Watch |

## Aliases
```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kd='kubectl describe'
alias kl='kubectl logs'
```

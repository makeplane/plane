# Kubernetes Troubleshooting

## Debugging Workflow

```bash
# 1. Overview
kubectl get pods -o wide
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# 2. Details
kubectl describe pod <pod-name>

# 3. Logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Crashed instance
kubectl logs <pod-name> -c <container>
```

## Common Pod States

| State | Cause | Solution |
|-------|-------|----------|
| Pending | No node resources | Check node capacity |
| ContainerCreating | Image pulling | Check image URI |
| CrashLoopBackOff | Container exits | Check logs, health checks |
| ImagePullBackOff | Failed image pull | Verify credentials |
| OOMKilled (137) | Out of memory | Increase memory limit |

## Service & Network

```bash
kubectl exec -it <pod-name> -- nslookup kubernetes.default
kubectl exec -it <pod-name> -- curl http://myservice:8080
kubectl get endpoints <service-name>
kubectl port-forward service/myservice 8080:8080
kubectl get networkpolicies -A
```

## Quick Fixes

| Problem | Command |
|---------|---------|
| Pod stuck | `kubectl delete pod <name> --grace-period=0 --force` |
| High CPU | `kubectl top pods -A --sort-by=cpu` |
| High memory | `kubectl top pods -A --sort-by=memory` |
| Restart | `kubectl rollout restart deployment/<name>` |
| Rollback | `kubectl rollout undo deployment/<name>` |

See `kubernetes-troubleshooting-advanced.md` for node issues, HPA, anti-patterns.

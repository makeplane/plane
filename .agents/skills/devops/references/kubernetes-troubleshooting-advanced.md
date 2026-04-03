# Kubernetes Troubleshooting Advanced

## Node Issues
```bash
kubectl describe node <node-name> | grep -A 5 "Conditions:"
kubectl top node <node-name>
kubectl top pods -A --sort-by=memory
kubectl drain <node-name> --ignore-daemonsets
kubectl uncordon <node-name>
```

## CrashLoopBackOff
```bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
kubectl get pod <pod-name> -o yaml | grep -A 5 resources:
```

## HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Anti-Patterns

**Using `latest` tag:**
```yaml
# ❌ image: myapp:latest
# ✅ image: myapp:v1.2.3
```

**Missing resources:**
```yaml
# ✅ Always set
resources:
  requests: { memory: "256Mi", cpu: "250m" }
  limits: { memory: "512Mi", cpu: "500m" }
```

**Missing health checks:**
```yaml
livenessProbe:
  httpGet: { path: /health, port: 8080 }
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
```

**Running as root:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
```

## Monitoring
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

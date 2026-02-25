# Kubernetes Security Advanced

## ClusterRole (cluster-wide)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["app-credentials"]  # Restrict to specific

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-binding
subjects:
- kind: User
  name: admin@example.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

## Secrets Management

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  username: admin
  password: secretpassword
```

### Mount as env
```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: password
```

### Mount as volume
```yaml
volumeMounts:
- name: secret-volume
  mountPath: /etc/secrets
  readOnly: true
volumes:
- name: secret-volume
  secret:
    secretName: db-credentials
```

## Allow DNS (Required for most apps)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - { protocol: UDP, port: 53 }
```

## Security Checklist

- [ ] RBAC with least-privilege roles
- [ ] Pod Security Standards (restricted)
- [ ] Network policies (default-deny + explicit allow)
- [ ] Run containers as non-root
- [ ] Read-only root filesystem
- [ ] Drop all capabilities
- [ ] Secrets for sensitive data
- [ ] Image scanning enabled
- [ ] Private container registry
- [ ] Resource quotas and limits
- [ ] Audit logging enabled
- [ ] Regular credential rotation

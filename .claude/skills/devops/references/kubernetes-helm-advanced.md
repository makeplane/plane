# Helm Advanced - Templates & Hooks

## Template Variables
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        {{- if .Values.resources }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        {{- end }}
```

## Helper Templates
```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mychart.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

## Hooks
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-post-install"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: post-install
        command: ["/bin/sh", "-c", "echo 'Done'"]
      restartPolicy: Never
```

Hook types: `pre-install`, `post-install`, `pre-upgrade`, `post-upgrade`

## Packaging
```bash
helm package mychart
helm repo index . --url https://charts.example.com
helm push mychart-1.0.0.tgz oci://registry.example.com/helm
helm repo add myrepo https://charts.example.com
helm install myapp myrepo/mychart
```

## Commands

| Command | Purpose |
|---------|---------|
| `helm create` | Create |
| `helm lint` | Validate |
| `helm template` | Render |
| `helm install` | Deploy |
| `helm upgrade` | Update |
| `helm rollback` | Revert |
| `helm uninstall` | Remove |

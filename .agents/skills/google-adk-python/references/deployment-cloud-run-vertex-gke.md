# Deployment: Cloud Run, Vertex AI, GKE

## Development Modes

```bash
adk web samples/agents/my_agent.py:agent --port 8080
adk run samples/agents/my_agent.py:agent "What is 2+2?" --streaming
adk api_server samples/agents/my_agent.py:agent --port 8000
```

Endpoints: `/chat`, `/stream`, `/health`

## Cloud Run

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
COPY src/ ./src/
RUN uv sync --frozen --no-cache
EXPOSE 8080
CMD ["uv", "run", "adk", "api_server", "src/my_agent.py:agent", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
export PROJECT_ID=my-project REGION=us-central1
gcloud builds submit --tag gcr.io/$PROJECT_ID/my-agent
gcloud run deploy my-agent \
  --image gcr.io/$PROJECT_ID/my-agent \
  --region $REGION \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY

# Secret Manager
echo -n "key" | gcloud secrets create google-api-key --data-file=-
gcloud run deploy my-agent --set-secrets GOOGLE_API_KEY=google-api-key:latest
```

## Vertex AI

```bash
adk deploy --target vertex --agent my_agent.py:agent --project my-project
```

```yaml
agent:
  name: my-agent
  model: gemini-2.5-flash
  region: us-central1
  scaling: {min_instances: 1, max_instances: 10}
  resources: {cpu: 2, memory: 4Gi}
```

```python
from google.cloud import aiplatform
aiplatform.init(project='my-project', location='us-central1')
endpoint = aiplatform.Endpoint('projects/123/locations/us-central1/endpoints/456')
response = endpoint.predict(instances=[{'prompt': 'What is 2+2?'}])
```

## GKE

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: {name: my-agent}
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: gcr.io/my-project/my-agent:latest
        ports: [{containerPort: 8080}]
        env:
        - name: GOOGLE_API_KEY
          valueFrom: {secretKeyRef: {name: google-api-key, key: key}}
        resources:
          requests: {memory: "2Gi", cpu: "1"}
          limits: {memory: "4Gi", cpu: "2"}
---
apiVersion: v1
kind: Service
metadata: {name: my-agent}
spec:
  type: LoadBalancer
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: {name: my-agent-hpa}
spec:
  scaleTargetRef: {kind: Deployment, name: my-agent}
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource: {name: cpu, target: {type: Utilization, averageUtilization: 70}}
```

```bash
gcloud container clusters create my-cluster --region us-central1 --num-nodes 3
gcloud container clusters get-credentials my-cluster --region us-central1
kubectl create secret generic google-api-key --from-literal=key=$GOOGLE_API_KEY
kubectl apply -f deployment.yaml
```

## Best Practices

```python
# config.py
import os
from dataclasses import dataclass

@dataclass
class Config:
  model_id: str = os.getenv('MODEL_ID', 'gemini-2.5-flash')
  api_key: str = os.getenv('GOOGLE_API_KEY')
  log_level: str = os.getenv('LOG_LEVEL', 'INFO')

# Health checks
@app.get('/health')
async def health(): return {'status': 'healthy'}

# Logging
from google.cloud import logging
client = logging.Client()
client.setup_logging()

# Rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post('/chat')
@limiter.limit('10/minute')
async def chat(request: Request, prompt: str):
  return {'response': (await agent.run(prompt)).text}
```

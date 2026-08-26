# Enterprise LLM Red Teaming Platform Deployment Guide

This guide covers deployment options for AWS, GCP, Azure, and Docker Compose environments.

## Local / Docker Compose Deployment
```bash
# Clone repository
git clone <your-repository-url>
cd promptfoo-redteam

# Start full stack (App, Redis, Prometheus)
docker-compose up -d
```
Access points:
- **Dashboard**: `http://localhost:3001/dashboard`
- **Prometheus**: `http://localhost:9090`
- **Metrics**: `http://localhost:3001/metrics`

---

## AWS Deployment (ECS / Fargate)
1. Push Docker image to Amazon ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   docker tag promptfoo-redteam:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/promptfoo-redteam:latest
   docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/promptfoo-redteam:latest
   ```
2. Create an ECS Task Definition with port mapping `3001` and deploy to ECS Fargate.

---

## GCP Deployment (Cloud Run)
1. Deploy directly to Google Cloud Run:
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/promptfoo-redteam
   gcloud run deploy promptfoo-redteam --image gcr.io/<PROJECT_ID>/promptfoo-redteam --platform managed --port 3001
   ```

---

## Azure Deployment (Container Apps)
1. Deploy to Azure Container Apps:
   ```bash
   az containerapp up --name promptfoo-redteam --resource-group rg-redteam --ingress external --target-port 3001 --source .
   ```

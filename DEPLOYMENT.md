# AWS Deployment & Architecture Guide for AntiPrice AI

This guide details the steps required to deploy the **AntiPrice AI** comparison platform to AWS in a highly-available, secure, and production-ready microservices architecture.

---

## 1. Target AWS Infrastructure Architecture

```
                                [ AWS ALB (Application Load Balancer) ]
                                                   |
                        +--------------------------+--------------------------+
                        |                                                     |
             [ ECS Fargate Frontends ]                              [ ECS Fargate Backends ]
         (Next.js App - Port 3000, Multi-AZ)                    (NestJS Core - Port 3001, Multi-AZ)
                        |                                                     |
                        |                               +---------------------+---------------------+
                        |                               |                     |                     |
                        v                               v                     v                     v
                 [ Amazon Aurora ]              [ AWS ElastiCache ]     [ OpenSearch Service ]  [ BullMQ Workloads ]
             (PostgreSQL compatible)                 (Redis)              (Elasticsearch)      (Playwright Clusters)
```

---

## 2. Infrastructure Setup Steps

### Step 1: Network & VPC Configurations
1. Create a VPC in the target region with:
   - **2 Public Subnets** (for Internet ALB access)
   - **2 Private Subnets** (for Frontend & Backend ECS services)
   - **2 Isolated Subnets** (for RDS Database, Redis cache, and OpenSearch clusters)
   - **NAT Gateways** configured on public subnets to allow private ECS services to execute Playwright scraping requests.

### Step 2: Database Setup (RDS & Prisma)
1. Launch an **Amazon Aurora PostgreSQL Serverless v2** cluster inside the isolated subnets.
2. Configure security groups to allow ingress traffic on port `5432` only from the ECS backend security group.
3. Fetch the database credentials and construct your `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<aurora-endpoint>:5432/antiprice_db?schema=public"
   ```
4. Run migrations from a secure bastion host or CI/CD builder:
   ```bash
   npx prisma migrate deploy
   ```

### Step 3: Cache Layer (Amazon ElastiCache Redis)
1. Spin up an **Amazon ElastiCache Serverless (Redis)** replication group.
2. In your backend environment settings, configure host details:
   ```env
   REDIS_HOST="<elasticache-primary-endpoint>"
   REDIS_PORT=6379
   ```

### Step 4: Search Engine (Amazon OpenSearch Service)
1. Configure an **Amazon OpenSearch Service** domain with Elasticsearch compatibility (v8+).
2. Ensure index security permits anonymous or authenticated search requests from the ECS Backend Fargate service.
3. Configure target hosts:
   ```env
   ELASTICSEARCH_URL="https://<opensearch-domain-endpoint>"
   ```

---

## 3. Container Registries & Build Operations

Push backend and frontend images to **Amazon ECR (Elastic Container Registry)**.

### ECR Image Compilation Scripts

#### 1. Compile and Push Backend
```bash
# Login to AWS ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com

# Build image
docker build -t antiprice-backend -f backend/Dockerfile ./backend

# Tag and push
docker tag antiprice-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/antiprice-backend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/antiprice-backend:latest
```

#### 2. Compile and Push Frontend
```bash
# Build image
docker build -t antiprice-frontend -f frontend/Dockerfile ./frontend

# Tag and push
docker tag antiprice-frontend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/antiprice-frontend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/antiprice-frontend:latest
```

---

## 4. ECS Fargate Service Deployments

Create **ECS Task Definitions** matching the following specifications:
- **Backend Task Specs**:
  - Memory: `1GB` RAM, CPU: `0.5 vCPU` (Requires memory for processing Chromium engines).
  - Environment variables: `DATABASE_URL`, `REDIS_HOST`, `ELASTICSEARCH_URL`, `OPENAI_API_KEY`.
- **Frontend Task Specs**:
  - Memory: `512MB` RAM, CPU: `0.25 vCPU`.
  - Port bindings: `3000`.

---

## 5. Security & Evasion Considerations
1. **IP Rotation / Proxy Settings**: AWS Fargate IPs are known to scrapers and might get blocked by Amazon/Flipkart. It is highly recommended to configure the proxy configurations in `BaseScraper` to route calls through residential proxy networks (e.g. BrightData, Oxylabs).
2. **Secrets Manager**: Load all keys (`DATABASE_URL`, `OPENAI_API_KEY`, etc.) using **AWS Secrets Manager** and map them to ECS task definition parameters on run time instead of committing them in raw configuration text.

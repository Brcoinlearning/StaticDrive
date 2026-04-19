# Supabase Self-Hosting Architecture

## Overview

Supabase is the Postgres development platform providing all the backend features you need to build a product. Self-hosting allows you to run Supabase on your own infrastructure, giving you full control over your data.

## Architecture Components

### Core Architecture

Supabase is a combination of open source tools specifically developed for enterprise-readiness:

- **Studio** - A dashboard for managing your self-hosted Supabase project
- **Kong** - Kong API gateway
- **Auth (GoTrue)** - JWT-based authentication API for user sign-ups, logins, and session management
- **PostgREST** - Web server that turns your Postgres database directly into a RESTful API
- **Realtime** - Elixir server that listens to Postgres database changes and broadcasts them to subscribed clients
- **Storage** - RESTful API for managing files in S3, with Postgres handling permissions
- **imgproxy** - Fast and secure image processing server
- **postgres-meta** - RESTful API for managing Postgres (fetch tables, add roles, run queries)
- **Postgres** - Object-relational database with over 30 years of active development
- **Edge Runtime** - Web server based on Deno runtime for running JavaScript, TypeScript, and WASM services
- **Logflare** - Log management and event analytics platform
- **Vector** - High-performance observability data pipeline for logs
- **Supavisor** - Supabase's Postgres connection pooler

### Architecture Diagram

The Kong API gateway sits in front of 7 services: GoTrue, PostgREST, Realtime, Storage, pg_meta, Functions, and pg_graphql. All the services talk to a single Postgres instance.

## Self-Hosting Methods

### Docker Deployment (Recommended)

The fastest and recommended way to self-host Supabase is using Docker. Docker is the easiest way to get started with self-hosted Supabase. It should take you less than 30 minutes to get up and running.

**Installation Steps:**

```bash
# Get the code
git clone --depth 1 https://github.com/supabase/supabase

# Make your new supabase project directory
mkdir supabase-project

# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project

# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env

# Switch to your project directory
cd supabase-project

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

### Other Deployment Options

There are several other options to deploy Supabase beyond Docker. Check the community page for alternative deployment methods.

## System Requirements

### Minimum Requirements

| Resource | Minimum | Recommended |
| --- | --- | --- |
| RAM | 4 GB | 8 GB+ |
| CPU | 2 cores | 4 cores+ |
| Disk | 50 GB SSD | 80 GB+ SSD |

These requirements are for running all Supabase components, suitable for development and small to medium production workloads.

### Resource Optimization

If you don't need specific services, you can remove them from `docker-compose.yml` to reduce resource requirements:
- Logflare (Analytics)
- Realtime
- Storage
- imgproxy
- Edge Runtime (Functions)

## Prerequisites

Before self-hosting Supabase, you need:

- Git
- Docker:
  - **Linux server/VPS**: Install Docker Engine and Docker Compose
  - **Linux desktop**: Install Docker Desktop
  - **macOS**: Install Docker Desktop
  - **Windows**: Install Docker Desktop

## Configuration

### Essential Configuration

All configuration is managed through environment variables in the `.env` file:

**Database Configuration:**
- `POSTGRES_PASSWORD`: Password for database roles
- `POSTGRES_DB`: Database name

**API Keys:**
- `JWT_SECRET`: Used by Auth, PostgREST, and other services to sign and verify JWTs
- `ANON_KEY`: Client-side API key with limited permissions
- `SERVICE_ROLE_KEY`: Server-side API key with full database access

**Security Keys:**
- `SECRET_KEY_BASE`: Encryption key for Realtime and Supavisor communications
- `VAULT_ENC_KEY`: Encryption key for Supavisor configuration storage
- `PG_META_CRYPTO_KEY`: Encryption key for Studio connection strings

**Access URLs:**
- `SUPABASE_PUBLIC_URL`: Base URL for accessing Supabase externally
- `API_EXTERNAL_URL`: Base URL of Auth service as seen externally
- `SITE_URL`: Default redirect URL for Auth

### Advanced Configuration

**Studio Authentication:**
- `DASHBOARD_PASSWORD`: Password for Studio dashboard
- `DASHBOARD_USERNAME`: Username for Studio dashboard

**Email Configuration:**
- `SMTP_ADMIN_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SENDER_NAME`

## Service Access

### API Endpoints

Each API is available through the same API gateway:

- **REST**: `http://<your-domain>:8000/rest/v1/`
- **Auth**: `http://<your-domain>:8000/auth/v1/`
- **Storage**: `http://<your-domain>:8000/storage/v1/`
- **Realtime**: `http://<your-domain>:8000/realtime/v1/`

### Database Access

**Session-based connections:**
```bash
psql 'postgres://postgres.[POOLER_TENANT_ID]:[POSTGRES_PASSWORD]@[your-domain]:5432/postgres'
```

**Pooled transactional connections:**
```bash
psql 'postgres://postgres.[POOLER_TENANT_ID]:[POSTGRES_PASSWORD]@[your-domain]:6543/postgres'
```

### Studio Access

Access Supabase Studio through the API gateway on port `8000`:
- URL: `http://example.com:8000` or `http://<your-ip>:8000`

## Self-Hosting vs Other Options

### Self-hosted Supabase vs Supabase CLI

- **Self-hosted Supabase**: Production-ready deployment on your infrastructure
- **Supabase CLI**: Local development and testing only

### Self-hosted Supabase vs Managed Supabase

- **Self-hosted**: Full control, compliance-friendly, isolated environment
- **Managed**: Fully hosted and operated by Supabase team

## Your Responsibilities When Self-Hosting

When you self-host, you are responsible for:

- Server provisioning and maintenance
- Security hardening and keeping OS and services updated
- Maintaining the Postgres database
- Backups and disaster recovery
- Monitoring and uptime

## Telemetry

Self-hosted Supabase (Docker) does not phone home or collect any telemetry.

The Supabase CLI is a separate tool and collects usage telemetry. You can opt out by:
- Running `supabase telemetry disable`
- Setting `SUPABASE_TELEMETRY_DISABLED=1`

## Support

Self-hosted Supabase is community-supported:

- **GitHub Discussions** - Questions, feature requests, and workarounds
- **GitHub Issues** - Known issues
- **Discord** - Real-time chat and community support
- **Reddit** - Official Supabase subreddit

## Updates

Stable releases of the Docker Compose setup are published approximately once a month. To update:

1. Apply the latest changes from the repository
2. Restart the services
3. Update image tags in docker-compose.yml if needed

All Supabase images are available on Docker Hub.

## Security Considerations

### Production Deployment

For production deployments:
- Use HTTPS with valid TLS certificates
- Implement proper reverse proxy (Caddy or Nginx)
- Use secrets management systems
- Configure proper firewall rules
- Implement monitoring and alerting

### Recommended Secrets Managers

- Doppler
- Infisical
- Azure Key Vault
- AWS Secrets Manager
- GCP Secrets Manager
- HashiCorp Vault

## Enterprise Self-Hosting

For enterprise deployments, contact the Supabase Growth Team to discuss:
- Use case requirements
- Feedback and design partnership opportunities
- Enterprise support options
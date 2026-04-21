FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl unzip ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY scripts/install_pocketbase.sh scripts/start_pocketbase.sh scripts/preflight.sh ./scripts/
COPY pb_migrations ./pb_migrations
COPY .env.example ./

RUN PB_VERSION=0.22.0 ./scripts/install_pocketbase.sh

EXPOSE 8090

CMD ["./scripts/start_pocketbase.sh"]

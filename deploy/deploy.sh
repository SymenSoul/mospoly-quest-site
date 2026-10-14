#!/bin/sh
set -eu

case "${1:-}" in
  staging)    SERVICE=frontend-stage ;;
  production) SERVICE=frontend-prod ;;
  *) echo "usage: $0 staging|production" >&2; exit 1 ;;
esac

cd /opt/quest
COMPOSE_FILE=/opt/quest/deploy/docker-compose.yml
# На сервере Compose-файл обычно находится в deploy/; поддерживаем и прежнюю раскладку в корне.
if [ ! -f "$COMPOSE_FILE" ]; then
  COMPOSE_FILE=/opt/quest/docker-compose.yml
fi

# Общая сеть между Caddy и отдельным Compose-проектом Django.
docker network inspect quest_backend >/dev/null 2>&1 || docker network create quest_backend

docker compose -f "$COMPOSE_FILE" pull "$SERVICE"
docker compose -f "$COMPOSE_FILE" up -d caddy "$SERVICE"

# Проверяем текущий Caddyfile и применяем его без потери данных Caddy.
docker compose -f "$COMPOSE_FILE" exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose -f "$COMPOSE_FILE" exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

docker image prune -f
echo "deployed $SERVICE"

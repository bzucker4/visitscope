#!/usr/bin/env bash
# Local WordPress + WooCommerce bootstrap for Atlas Relics.
# Requires Docker Compose. Does not touch production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
	cp .env.example .env
	echo "Created .env from .env.example. Edit local passwords before sharing this machine."
fi

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required for this setup script." >&2
	exit 1
fi

docker compose up -d db wordpress

echo "Waiting for WordPress..."
until docker compose exec -T wordpress bash -c 'curl -sf http://localhost >/dev/null'; do
	sleep 3
done

SITE_URL="http://localhost:${WORDPRESS_PORT:-8080}"

docker compose run --rm wpcli core install \
	--url="$SITE_URL" \
	--title="Atlas Relics" \
	--admin_user=admin \
	--admin_password=admin \
	--admin_email=local@example.com \
	--skip-email || true

docker compose run --rm wpcli plugin install woocommerce --activate || true
docker compose run --rm wpcli theme activate atlas-relics
docker compose run --rm wpcli plugin activate atlas-relics-core
docker compose run --rm wpcli rewrite structure '/%postname%/' --hard
docker compose run --rm wpcli option update blogdescription "Tools, reflections, and artifacts for exploring the inner life."
docker compose run --rm wpcli eval 'if ( class_exists( "Atlas_Relics_Core_Demo_Content" ) ) { Atlas_Relics_Core_Demo_Content::install(); }'

echo
echo "Local site: $SITE_URL"
echo "Admin:      $SITE_URL/wp-admin  (admin / admin)"
echo "Change the local password immediately. Never use these credentials in production."

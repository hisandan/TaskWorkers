.PHONY: build db seed backend frontend api-client test test-unit test-integration test-e2e

# Instala dependencias (back y front), sincroniza los tipos de la API y construye el frontend en frontend/dist/
build:
	cd backend && uv sync
	cd frontend && pnpm install
	$(MAKE) api-client
	cd frontend && pnpm build

# Postgres en Docker
db:
	docker compose up -d db

# Crea las tablas y carga datos de demo
seed:
	cd backend && uv run python -m app.seed

# Exporta el OpenAPI del backend y genera los tipos TS en frontend/src/api/api.generated.ts
api-client:
	cd backend && uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > ../frontend/openapi.json
	cd frontend && pnpm exec openapi-typescript openapi.json -o src/api/api.generated.ts

# FastAPI en modo dev -> Swagger en http://localhost:8000/docs
backend:
	cd backend && uv run fastapi dev

# Astro en modo dev -> http://localhost:4321
frontend:
	cd frontend && pnpm dev

# Tests (ver docs/testing.md)
test: test-unit test-integration

test-unit:
	cd backend && uv run pytest tests/unit

# Requiere `make db`
test-integration:
	cd backend && uv run pytest tests/integration

# Requiere la app levantada (db, seed, backend, frontend). `HEADED=1` abre el navegador
test-e2e:
	cd e2e && pnpm test $(if $(HEADED),--headed)

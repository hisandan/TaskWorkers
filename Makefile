.PHONY: db seed backend frontend api-client

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

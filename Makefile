.PHONY: db backend api-client

# Postgres en Docker
db:
	docker compose up -d db

# FastAPI en modo dev -> Swagger en http://localhost:8000/docs
backend:
	cd backend && uv run fastapi dev

# Exporta el OpenAPI del backend y genera el cliente TS tipado en frontend/src/client
api-client:
	cd backend && uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > ../frontend/openapi.json
	cd frontend && pnpm dlx @hey-api/openapi-ts -i openapi.json -o src/client

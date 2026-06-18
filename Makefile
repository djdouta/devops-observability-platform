# ==============================================================================
# Validación
# ==============================================================================

compose-validate:
	docker compose config

prometheus-validate:
	docker run --rm \
		-v $(PWD)/prometheus:/etc/prometheus \
		--entrypoint promtool \
		prom/prometheus \
		check config /etc/prometheus/prometheus.yml

prometheus-rules:
	docker run --rm \
		-v $(PWD)/prometheus:/etc/prometheus \
		--entrypoint promtool \
		prom/prometheus \
		check rules /etc/prometheus/alert.rules.yml

# ==============================================================================
# Linting
# ==============================================================================

lint-yaml:
	yamllint .

lint-docker:
	hadolint ./apps/alert-receiver/Dockerfile
	hadolint ./apps/node-app/Dockerfile

lint-js:
	npx eslint .

format-check:
	npx prettier --check .

# ==============================================================================
# Docker
# ==============================================================================

volumes-create:
	docker volume create observability-stack_node-logs
	docker volume create observability-stack_grafana-data
	docker volume create observability-stack_loki-data
	docker volume create observability-stack_prometheus-data
	docker volume create observability-stack_alertmanager-data

docker-build:
	docker compose build

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

# ==============================================================================
# Health checks
# ==============================================================================

check-prometheus:
	curl -f http://localhost:9090/metrics

check-targets:
	@for i in 1 2 3 4 5; do \
		TARGETS=$$(curl -s http://localhost:9090/api/v1/targets); \
		echo "$$TARGETS" | grep '"health":"up"' && exit 0; \
		echo "Targets not ready yet, retrying..."; \
		sleep 5; \
	done; \
	echo "Prometheus targets did not come up healthy"; \
	exit 1

check-grafana:
	curl -f http://localhost:3000/login

# ==============================================================================
# Targets maestros
# ==============================================================================

lint: lint-yaml lint-docker lint-js format-check

check: compose-validate prometheus-validate prometheus-rules lint volumes-create docker-up check-prometheus check-targets check-grafana

.PHONY: compose-validate prometheus-validate prometheus-rules \
        lint-yaml lint-docker lint-js format-check \
        volumes-create docker-build docker-up docker-down \
        check-prometheus check-targets check-grafana \
        lint check
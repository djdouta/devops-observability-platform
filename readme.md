DevOps Observability Platform

A production-style observability and monitoring platform built with Docker, Prometheus, Grafana, Loki, Alloy, Alertmanager, Slack integrations, and synthetic load testing using k6.

This project simulates a real-world monitored application environment and was designed as hands-on DevOps / SRE training focused on observability, alerting, reliability, and infrastructure operations.

Architecture
Client Traffic
      │
      ▼
 ┌───────────┐
 │  Node App │
 └─────┬─────┘
       │
       ├── Metrics ───────────────► Prometheus
       │                               │
       │                               ▼
       │                         Alertmanager
       │                               │
       │                               ▼
       │                             Slack
       │
       └── Logs ─► Alloy ─► Loki ─► Grafana
                                      ▲
                                      │
                                Dashboards
Stack
    Monitoring & Observability
        Prometheus
        Grafana
        Loki
        Grafana Alloy
        Alertmanager
    Infrastructure & Containers
        Docker
        Docker Compose
        Linux / WSL2
    Load Testing
        k6
    Application Layer
        Node.js
        Express.js
Features
    Metrics Collection
        HTTP request counters
        Request duration histograms
        Error rate monitoring
        Route-level metrics
        Simulated business traffic
    Centralized Logging
        Structured JSON logs
        Correlation IDs
        Log aggregation with Loki
        Log shipping with Alloy
        Log exploration through Grafana
Alerting
    Implemented Alerts
    Alert	            Description
    HighErrorRate	    Detects elevated 5xx error rate
    HighLatencyByRoute	Detects p95 latency degradation
    ServiceDown	Detects unavailable services

Slack Integration
    Critical and warning alerts are automatically routed to Slack channels through Alertmanager webhooks.

Healthchecks & Reliability
    Docker healthchecks
    Automatic container restart policies
    Synthetic traffic validation
    Failure simulation testing
Load Testing
    Traffic generation with k6 including:
    Concurrent virtual users
    Randomized endpoint traffic
    Latency simulation
    Error simulation


Project Structure
devops-observability-platform/
│
├── docker-compose.yml
├── .env.example
│
├── monitoring-app/
│   ├── node-app/
│   └── alert-receiver/
│
├── prometheus/
│   ├── prometheus.yml
│   └── alert.rules.yml
│
├── alertmanager/
│   └── alertmanager.yml
│
├── loki/
│   └── loki-config.yml
│
├── alloy/
│   └── config.alloy
│
├── k6/
│   └── load-test.js
│
└── README.md
Quick Start
Clone repository
git clone <repo-url>
cd devops-observability-platform
Configure environment variables

Create a .env file:

SLACK_WEBHOOK=your_slack_webhook
Start platform
docker compose up -d --build
Services
Service	URL
Node App	http://localhost:3000
Grafana	http://localhost:3001
Prometheus	http://localhost:9090
Alertmanager	http://localhost:9093
Loki	http://localhost:3100
Grafana Dashboards

The platform includes dashboards for:

Request throughput
Error rates
Latency percentiles
Route-level observability
Centralized logs
Alert visibility
Simulating Failures
Generate load
docker compose run --rm k6
Simulate high latency

Artificial delays can be introduced into endpoints to trigger latency alerts.

Simulate failures

Endpoints can randomly generate HTTP 500 responses to trigger error-rate alerts.

Example Alert Flow
Application Failure
        │
        ▼
Prometheus detects condition
        │
        ▼
Alertmanager groups alert
        │
        ▼
Slack notification sent
        │
        ▼
Logs available in Grafana/Loki

Technical Concepts Practiced
    Observability
    Metrics
    Distributed logging
    SRE alerting strategies
    Docker networking
    Healthchecks
    Synthetic monitoring
    Incident simulation
    Container lifecycle management
    Infrastructure troubleshooting

Future Improvements
    GitHub Actions CI/CD
    Kubernetes deployment
    ArgoCD GitOps
    Terraform infrastructure provisioning
    Trivy image scanning
    SonarQube integration
    Helm charts
    AWS deployment
    OpenTelemetry tracing

<!-- Screenshots
Grafana dashboards
Loki logs
Slack alerts
Prometheus targets
Alertmanager UI
Learning Goals -->

This project was created as a practical DevOps / SRE learning platform focused on gaining hands-on experience with production-style monitoring, observability, and reliability engineering workflows.

License

MIT License
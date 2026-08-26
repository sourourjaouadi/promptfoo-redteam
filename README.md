# Enterprise LLM Security & Red Teaming Platform

[![CI/CD Pipeline](https://github.com/promptfoo-redteam/actions/workflows/ci.yml/badge.svg)](https://github.com/promptfoo-redteam/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue.svg)](Dockerfile)
[![OWASP Top 10 Aligned](https://img.shields.io/badge/OWASP-LLM_Top_10-red.svg)](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

An enterprise-grade, research-quality security evaluation platform for Large Language Models (LLMs). Built on top of **Promptfoo**, **Express.js**, **SQLite**, and **Docker**, this platform enables security teams and AI researchers to systematically benchmark model robustness against 30+ advanced attack vectors, evaluate guardrail efficacy, and generate compliance-ready vulnerability reports.

---

## 🌟 Key Features

- **30+ Advanced Attack Scenarios**:
  - **Prompt Injection**: Direct instruction overrides, token smuggling (Unicode/Base64), context confusion, indirect URL injection, semantic confusion.
  - **Jailbreak Techniques**: DAN v10.0, Evil Confidant persona, roleplay novel bypasses, hypothetical scenarios, authority impersonation, ROT13/Hex encoding tricks.
  - **Data Extraction**: API key leaks, training data completion, model architecture disclosure, database credential harvesting.
  - **Adversarial Inputs**: Unicode homoglyph substitution, full-width characters, JSON/XML tag injection, split token boundary attacks.
  - **Defense Testing**: LlamaGuard integration, output sanitization checks, error stack trace analysis.
- **CVSS-like LLM Vulnerability Scoring**:
  - Scores findings from `0.0` to `10.0` with standard severity ratings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - Mapped directly to **OWASP LLM Top 10** (`LLM01`–`LLM10`) and **NIST AI Risk Management Framework**.
- **Research Analytics & Statistical Rigor**:
  - 95% Confidence Intervals for resilience rates.
  - False Positive Rate tracking and standard deviation calculation.
  - Export capabilities in **CSV**, **JSON**, and HTML format.
- **Enterprise Architecture**:
  - Security audit logging (`audit_log` SQLite table).
  - JWT Authentication middleware and RBAC.
  - Prometheus metrics endpoint (`/metrics`) for monitoring.
  - Docker Compose orchestration with Redis and Prometheus.
  - GitHub Actions CI/CD automation.

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone <your-repository-url>
cd promptfoo-redteam

docker-compose up -d
```
Access the services:
- **Interactive Security Dashboard**: [http://localhost:3001/dashboard](http://localhost:3001/dashboard)
- **Prometheus Metrics**: [http://localhost:3001/metrics](http://localhost:3001/metrics)

---

### Option 2: Local Node.js Setup

```bash
npm install
npm start
```
Open [http://localhost:3001/dashboard](http://localhost:3001/dashboard) in your browser.

---

## 🧪 Running Security Test Suites via CLI

You can also run individual attack configs directly using Promptfoo CLI:

```bash
# Run advanced prompt injection variants
npm run test:injection

# Run jailbreak variations
npx promptfoo eval --config config/jailbreak_variants.yaml

# Run data extraction tests
npx promptfoo eval --config config/data_extraction.yaml

# Run defense testing suite
npx promptfoo eval --config config/defense.yaml
```

---

## 📊 Dashboard & Analytics

The real-time dashboard provides:
1. **Model Resiliency Metrics**: Success rates with 95% confidence intervals.
2. **CVSS Threat Breakdown**: Real-time severity classification and OWASP/NIST mapping.
3. **Multi-Model Selector**: Compare Llama 2, Mistral, Neural Chat, and GPT-4.
4. **Security Audit Log**: Immutable tracking of evaluation triggers, actions, and user sessions.

---

## 📁 Repository Layout

```
promptfoo-redteam/
├── config/
│   ├── injection.yaml           # Base injection tests
│   ├── injection_variants.yaml  # 10 advanced injection scenarios
│   ├── jailbreak_variants.yaml  # 8 jailbreak & persona bypasses
│   ├── data_extraction.yaml     # 5 secret extraction tests
│   ├── adversarial_inputs.yaml  # 6 encoding & boundary exploits
│   ├── defense.yaml             # 3 defense & guardrail tests
│   └── models.yaml              # Multi-model configuration matrix
├── docs/
│   ├── attack_vectors.md        # Comprehensive attack vector specs
│   └── deployment.md            # AWS, GCP, Azure, Docker deployment guides
├── src/
│   ├── api.js                   # Enterprise Express API & endpoints
│   ├── database.js              # SQLite schema, audit logs, and metrics
│   ├── dashboard.html           # Modern security analytics UI
│   ├── middleware/auth.js       # JWT authentication & RBAC
│   └── services/
│       ├── vulnScore.js         # CVSS scoring & OWASP/NIST mapping
│       └── analytics.js         # Research statistics & export logic
├── Dockerfile                   # Production container definition
├── docker-compose.yml           # App, Redis, Prometheus orchestration
└── package.json                 # Node dependencies and scripts
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

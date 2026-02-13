# Paddle Overview

Paddle Billing = merchant-of-record platform handling payments, tax compliance, localization, subscriptions globally.

## Authentication

```bash
# API Key in Authorization header
curl -X GET "https://api.paddle.com/products" \
  -H "Authorization: Bearer {api_key}"
```

Environment:
- Production: `api.paddle.com`
- Sandbox: `sandbox-api.paddle.com`

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Paddle ID** | Unique identifier for all entities (`pro_xxx`, `pri_xxx`, `txn_xxx`) |
| **MoR** | Paddle is merchant-of-record, handles tax/compliance |
| **Localization** | Auto currency/language based on customer location |

## SDK Installation

```bash
# Node.js
npm install @paddle/paddle-node-sdk

# Python
pip install paddle-python-sdk

# PHP
composer require paddle/paddle-php-sdk

# Go
go get github.com/PaddleHQ/paddle-go-sdk
```

## Entity Prefixes

| Entity | Prefix | Example |
|--------|--------|---------|
| Product | `pro_` | `pro_01gsz4vmqbjk3x4vvtafffd540` |
| Price | `pri_` | `pri_01gsz8z1q1n00f12qt82y31smh` |
| Customer | `ctm_` | `ctm_01grnn4zta5a1mf02jjze7y2ys` |
| Subscription | `sub_` | `sub_01gv2z5ht1mk2y6bsgv2mjryyn` |
| Transaction | `txn_` | `txn_01gv2z5ht1mk2y6bsgv2mjryyn` |

## Quick Links

- API Reference: https://developer.paddle.com/api-reference/overview
- Paddle.js: `references/paddle/paddle-js.md`
- Webhooks: `references/paddle/webhooks.md`
- Subscriptions: `references/paddle/subscriptions.md`
- External llms.txt: https://developer.paddle.com/llms.txt

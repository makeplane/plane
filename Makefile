# Convenience targets for local development.
#
# Team Operations Dashboard QA (isolated API :8100, web :3100):
#   make dashboard-qa          — stack + seed + web (one terminal, foreground)
#   make dashboard-qa-restart  — after crash / login broken / connection reset
#   make dashboard-qa-status   — see what is up
#
# Login: alice@acme.so / password123 — http://127.0.0.1:3100/acme-qa/dashboards/

.PHONY: help dashboard-qa dashboard-qa-up dashboard-qa-down dashboard-qa-seed \
	dashboard-qa-web dashboard-qa-restart dashboard-qa-rebuild-api dashboard-qa-status

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sed 's/:.*## / — /'

dashboard-qa: ## Start QA API stack, seed, and web (foreground; Ctrl+C stops web only)
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh dev

dashboard-qa-up: ## Docker compose up + wait until API accepts requests
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh up

dashboard-qa-down: ## Stop QA stack and background web process
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh down

dashboard-qa-seed: ## Re-seed acme-qa and flush Redis (fixes INSTANCE_NOT_CONFIGURED cache)
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh seed

dashboard-qa-web: ## Web dev server only (requires API already up)
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh web

dashboard-qa-restart: ## Soft-restart QA API container only (keeps Redis sessions)
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh restart

dashboard-qa-rebuild-api: ## Rebuild QA API image after apps/api changes (no seed)
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh rebuild-api

dashboard-qa-status: ## Print API / instance / web health
	@chmod +x dashboard-qa.sh
	@./dashboard-qa.sh status

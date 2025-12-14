.PHONY: help start stop restart status logs clean install build

# Default environment (development or production)
ENV ?= development

# PM2 ecosystem config file
ECOSYSTEM := ecosystem.config.js

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Start all application processes with PM2
	@echo "Starting application processes (ENV=$(ENV))..."
	@pm2 start $(ECOSYSTEM) --env $(ENV)
	@pm2 save || true
	@echo "✓ Application started. Use 'make status' to check process status."

stop: ## Stop all application processes
	@echo "Stopping all application processes..."
	@pm2 stop all
	@echo "✓ All processes stopped."

restart: ## Restart all application processes
	@echo "Restarting all application processes..."
	@pm2 restart all
	@echo "✓ All processes restarted."

status: ## Show status of all PM2 processes
	@pm2 status

logs: ## Show logs from all processes (use LOGS=api to filter by process name)
	@if [ -n "$(LOGS)" ]; then \
		pm2 logs $(LOGS) --lines 50; \
	else \
		pm2 logs --lines 50; \
	fi

clean: ## Stop and delete all PM2 processes
	@echo "Cleaning up all PM2 processes..."
	@pm2 delete all || true
	@pm2 kill || true
	@echo "✓ All processes cleaned up."

install: ## Install dependencies for all packages
	@echo "Installing dependencies..."
	@pnpm install
	@echo "✓ Dependencies installed."

build: ## Build frontend and admin applications
	@echo "Building frontend applications..."
	@pnpm build
	@echo "✓ Build complete."

dev: start ## Alias for start (development mode)

prod: ## Start in production mode
	@$(MAKE) start ENV=production

# Individual process management
start-api: ## Start only the API process
	@pm2 start $(ECOSYSTEM) --only api --env $(ENV)

start-web: ## Start only the web frontend process
	@pm2 start $(ECOSYSTEM) --only web --env $(ENV)

start-admin: ## Start only the admin process
	@pm2 start $(ECOSYSTEM) --only admin --env $(ENV)

start-worker: ## Start only the Celery worker process
	@pm2 start $(ECOSYSTEM) --only celery-worker --env $(ENV)

start-beat: ## Start only the Celery beat process
	@pm2 start $(ECOSYSTEM) --only celery-beat --env $(ENV)

# Database and migrations
migrate: ## Run database migrations
	@cd apps/api && source venv/bin/activate && python manage.py migrate
	@echo "✓ Migrations complete."

makemigrations: ## Create new database migrations
	@cd apps/api && source venv/bin/activate && python manage.py makemigrations
	@echo "✓ Migrations created."

# Setup commands
setup: install ## Install dependencies and set up the project
	@echo "✓ Setup complete."

setup-server: ## Run server setup script (requires sudo)
	@echo "Running server setup script..."
	@sudo ./setup-server.sh

deploy: ## Run deployment script
	@./deploy.sh

# Health checks
health: ## Check health of all services
	@echo "Checking API health..."
	@curl -s http://localhost:8000/api/configs/ > /dev/null && echo "✓ API is healthy" || echo "✗ API is not responding"
	@echo "Checking web frontend..."
	@curl -s http://localhost:3000 > /dev/null && echo "✓ Web frontend is healthy" || echo "✗ Web frontend is not responding"
	@echo "Checking admin interface..."
	@curl -s http://localhost:8000/god-mode/ > /dev/null && echo "✓ Admin interface is healthy" || echo "✗ Admin interface is not responding"

# Nginx reverse proxy commands
nginx-start: ## Start nginx reverse proxy
	@echo "Starting nginx..."
	@sudo systemctl start nginx || sudo nginx
	@echo "✓ Nginx started"

nginx-stop: ## Stop nginx reverse proxy
	@echo "Stopping nginx..."
	@sudo systemctl stop nginx || sudo nginx -s stop
	@echo "✓ Nginx stopped"

nginx-restart: ## Restart nginx reverse proxy
	@echo "Restarting nginx..."
	@sudo systemctl restart nginx || (sudo nginx -s reload && echo "✓ Nginx reloaded")
	@echo "✓ Nginx restarted"

nginx-reload: ## Reload nginx configuration
	@echo "Reloading nginx configuration..."
	@sudo nginx -t && sudo systemctl reload nginx || sudo nginx -s reload
	@echo "✓ Nginx configuration reloaded"

nginx-test: ## Test nginx configuration
	@echo "Testing nginx configuration..."
	@sudo nginx -t

nginx-setup: ## Set up nginx reverse proxy (install and configure)
	@./nginx/install.sh
	@echo "✓ Nginx setup complete"

nginx-install: nginx-setup ## Alias for nginx-setup

ssl-setup: ## Set up SSL certificates (self-signed for development)
	@./nginx/setup-ssl.sh
	@echo "✓ SSL certificates set up"

ssl-letsencrypt: ## Set up Let's Encrypt SSL (requires DOMAIN and EMAIL)
	@if [ -z "$(DOMAIN)" ] || [ -z "$(EMAIL)" ]; then \
		echo "Error: DOMAIN and EMAIL are required"; \
		echo "Usage: make ssl-letsencrypt DOMAIN=example.com EMAIL=admin@example.com"; \
		exit 1; \
	fi
	@./nginx/setup-ssl.sh --letsencrypt --domain $(DOMAIN) --email $(EMAIL)
	@echo "✓ Let's Encrypt certificate set up"


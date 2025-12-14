/**
 * PM2 Ecosystem Configuration for FamilyFlow
 * 
 * This configuration manages all application processes:
 * - Django API server (Gunicorn in production, runserver in development)
 * - Celery worker
 * - Celery beat scheduler
 * - Frontend static file server
 * 
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 * 
 * Note: In production, entrypoint scripts (created in Phase 1.3) will handle
 * database readiness checks, migrations, and Gunicorn startup.
 * For development, processes start directly.
 */

module.exports = {
  apps: [
    // Django API Server
    // Development: Uses Django runserver directly
    // Production: Uses entrypoint script which handles Gunicorn and setup tasks
    {
      name: "api",
      // Production uses entrypoint script which handles Gunicorn and setup tasks
      // Development can use runserver directly or entrypoint script
      script: "./apps/api/bin/entrypoint-api.sh",
      args: "",
      cwd: "./apps/api",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      
      // Wait for database to be ready (works with wait_for_db management command)
      // API entrypoint script will handle this, but PM2 can also wait
      wait_ready: false, // Set to true once entrypoint script sends ready signal
      listen_timeout: 30000, // 30 seconds to wait for ready signal
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Logging configuration
      error_file: "~/.pm2/logs/api-error.log",
      out_file: "~/.pm2/logs/api-out.log",
      log_file: "~/.pm2/logs/api-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Environment variables (loaded from .env file)
      env_file: "./apps/api/.env",
      
      // Development environment
      env_development: {
        NODE_ENV: "development",
        DJANGO_SETTINGS_MODULE: "plane.settings.local",
        DEBUG: "1",
        PORT: 8000,
        // Note: Entrypoint script automatically uses runserver in development mode
        // (detected via DJANGO_SETTINGS_MODULE=plane.settings.local or DEBUG=1)
      },
      
      // Production environment
      env_production: {
        NODE_ENV: "production",
        DJANGO_SETTINGS_MODULE: "plane.settings.production",
        DEBUG: "0",
        PORT: process.env.PORT || 8000,
        GUNICORN_WORKERS: process.env.GUNICORN_WORKERS || "4",
        // Production entrypoint script handles:
        // - Database readiness checks (wait_for_db)
        // - Migration checks (wait_for_migrations)
        // - Instance registration
        // - Static file collection
        // - Gunicorn server startup
      },
      
      // Watch mode (development only)
      watch: false,
      ignore_watch: ["node_modules", "*.log", "*.pyc", "__pycache__", ".git"],
      
      // Advanced options
      kill_timeout: 5000,
      shutdown_with_message: true,
      
      // Process dependencies: API should start after Redis is ready
      // These are handled by entrypoint scripts or systemd for infrastructure services
    },

    // Celery Worker
    // Uses entrypoint script which handles database readiness checks
    {
      name: "celery-worker",
      script: "./apps/api/bin/entrypoint-worker.sh",
      args: "",
      cwd: "./apps/api",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      
      // Celery doesn't support wait_ready, but entrypoint script handles dependencies
      wait_ready: false,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Logging configuration
      error_file: "~/.pm2/logs/celery-worker-error.log",
      out_file: "~/.pm2/logs/celery-worker-out.log",
      log_file: "~/.pm2/logs/celery-worker-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Environment variables
      env_file: "./apps/api/.env",
      
      env_development: {
        NODE_ENV: "development",
        DJANGO_SETTINGS_MODULE: "plane.settings.local",
      },
      
      env_production: {
        NODE_ENV: "production",
        DJANGO_SETTINGS_MODULE: "plane.settings.production",
      },
      
      // Startup delay to ensure Redis is ready
      // Entrypoint script will handle database readiness, but Redis
      // should be started by systemd before PM2 starts
      listen_timeout: 10000,
      
      kill_timeout: 5000,
    },

    // Celery Beat Scheduler
    // Uses entrypoint script which handles database readiness checks
    {
      name: "celery-beat",
      script: "./apps/api/bin/entrypoint-beat.sh",
      args: "",
      cwd: "./apps/api",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      
      wait_ready: false,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Logging configuration
      error_file: "~/.pm2/logs/celery-beat-error.log",
      out_file: "~/.pm2/logs/celery-beat-out.log",
      log_file: "~/.pm2/logs/celery-beat-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Environment variables
      env_file: "./apps/api/.env",
      
      env_development: {
        NODE_ENV: "development",
        DJANGO_SETTINGS_MODULE: "plane.settings.local",
      },
      
      env_production: {
        NODE_ENV: "production",
        DJANGO_SETTINGS_MODULE: "plane.settings.production",
      },
      
      // Startup delay to ensure dependencies are ready
      listen_timeout: 10000,
      
      kill_timeout: 5000,
    },

    // Frontend Static File Server
    // Serves built static files from apps/web/build/client
    {
      name: "web",
      script: "pnpm",
      args: "start",
      cwd: "./apps/web",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      
      // Frontend can start independently (connects to API via HTTP)
      wait_ready: false,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Logging configuration
      error_file: "~/.pm2/logs/web-error.log",
      out_file: "~/.pm2/logs/web-out.log",
      log_file: "~/.pm2/logs/web-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Environment variables (frontend uses VITE_ prefixed vars)
      env_file: "./apps/web/.env",
      
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
        // VITE_API_BASE_URL should be set in .env file
      },
      
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        // VITE_API_BASE_URL should be set in .env file
        // Frontend build must be completed before starting:
        // cd apps/web && pnpm build
      },
      
      kill_timeout: 5000,
    },

    // Admin App (God Mode)
    // Serves the admin interface at /god-mode
    {
      name: "admin",
      script: "pnpm",
      args: "dev",
      cwd: "./apps/admin",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      
      wait_ready: false,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Logging configuration
      error_file: "~/.pm2/logs/admin-error.log",
      out_file: "~/.pm2/logs/admin-out.log",
      log_file: "~/.pm2/logs/admin-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Environment variables
      env_file: "./apps/admin/.env",
      
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
        VITE_ADMIN_BASE_PATH: "/god-mode",
        // VITE_API_BASE_URL should be set in .env file
      },
      
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        VITE_ADMIN_BASE_PATH: "/god-mode",
        // VITE_API_BASE_URL should be set in .env file
        // Admin build must be completed before starting:
        // cd apps/admin && pnpm build
      },
      
      kill_timeout: 5000,
    },
  ],
};

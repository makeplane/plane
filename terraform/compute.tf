# =============================================================================
# Cloud Run Services
# =============================================================================

locals {
  web_url            = "https://${var.domain}"
  api_base_url       = "https://${var.domain}/api"
  admin_base_url     = "https://${var.domain}/god-mode"
  space_base_url     = "https://${var.domain}/spaces"
  cors_origins       = "https://${var.domain}"

  # Common environment variables for API-based services
  common_api_env = {
    REDIS_URL              = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}/"
    # Use Redis as Celery broker (instead of RabbitMQ)
    AMQP_URL               = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}/1"
    AWS_REGION             = "auto"
    AWS_S3_ENDPOINT_URL    = "https://storage.googleapis.com"
    AWS_S3_BUCKET_NAME     = google_storage_bucket.plane_uploads.name
    USE_MINIO              = "0"
    FILE_SIZE_LIMIT        = "5242880"
    WEB_URL                = local.web_url
    CORS_ALLOWED_ORIGINS   = local.cors_origins
    DEBUG                  = "0"
    DJANGO_SETTINGS_MODULE = "plane.settings.production"
    SENTRY_DSN             = ""
    SENTRY_ENVIRONMENT     = "production"
    ENABLE_SIGNUP          = "1"
    ENABLE_EMAIL_PASSWORD  = "1"
    ENABLE_MAGIC_LINK_LOGIN = "0"
    LICENSE_ENGINE_BASE_URL = ""
  }
}

# =============================================================================
# Web App
# =============================================================================
resource "google_cloud_run_v2_service" "plane_web" {
  name     = "plane-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/web:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      env {
        name  = "API_BASE_URL"
        value = local.api_base_url
      }
      env {
        name  = "ADMIN_BASE_URL"
        value = local.admin_base_url
      }
      env {
        name  = "SPACE_BASE_URL"
        value = local.space_base_url
      }
      env {
        name  = "WEB_URL"
        value = local.web_url
      }
      env {
        name  = "NEXT_PUBLIC_API_BASE_URL"
        value = local.api_base_url
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Admin Panel
# =============================================================================
resource "google_cloud_run_v2_service" "plane_admin" {
  name     = "plane-admin"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/admin:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      env {
        name  = "API_BASE_URL"
        value = local.api_base_url
      }
      env {
        name  = "WEB_URL"
        value = local.web_url
      }
      env {
        name  = "NEXT_PUBLIC_API_BASE_URL"
        value = local.api_base_url
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Space (Public Workspaces)
# =============================================================================
resource "google_cloud_run_v2_service" "plane_space" {
  name     = "plane-space"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/space:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      env {
        name  = "API_BASE_URL"
        value = local.api_base_url
      }
      env {
        name  = "WEB_URL"
        value = local.web_url
      }
      env {
        name  = "NEXT_PUBLIC_API_BASE_URL"
        value = local.api_base_url
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Live (Real-time Collaboration)
# =============================================================================
resource "google_cloud_run_v2_service" "plane_live" {
  name     = "plane-live"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/live:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        cpu_idle = false  # Keep warm for WebSocket connections
      }

      env {
        name  = "API_BASE_URL"
        value = local.api_base_url
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}/"
      }
      env {
        name = "LIVE_SERVER_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "CORS_ALLOWED_ORIGINS"
        value = local.cors_origins
      }
      env {
        name  = "LIVE_BASE_PATH"
        value = "/live"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# API
# =============================================================================
resource "google_cloud_run_v2_service" "plane_api" {
  name     = "plane-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.plane_db.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/api:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2000m"
          memory = "2Gi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 30
        tcp_socket {
          port = 8080
        }
      }

      liveness_probe {
        http_get {
          path = "/"
          port = 8080
        }
        initial_delay_seconds = 30
        period_seconds        = 30
        timeout_seconds       = 10
        failure_threshold     = 3
      }

      command = ["/bin/sh", "-c"]
      args = [
        "export DATABASE_URL=\"postgres://${google_sql_user.plane_user.name}:$DB_PASSWORD@/plane?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}\" && python manage.py wait_for_db && gunicorn -w $${GUNICORN_WORKERS:-2} -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:8080 --access-logfile - --timeout 120"
      ]

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      # Database
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      # Application secret
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }

      # Storage credentials from Secret Manager
      env {
        name = "AWS_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_access_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AWS_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_secret_key.secret_id
            version = "latest"
          }
        }
      }

      # Common environment variables
      dynamic "env" {
        for_each = local.common_api_env
        content {
          name  = env.key
          value = env.value
        }
      }

      env {
        name  = "GUNICORN_WORKERS"
        value = "2"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Worker (Background Tasks)
# =============================================================================
resource "google_cloud_run_v2_service" "plane_worker" {
  name     = "plane-worker"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 3
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.plane_db.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/api:latest"

      ports {
        container_port = 8080
      }

      command = ["/bin/sh", "-c"]
      args = [
        "(while true; do echo -e \"HTTP/1.1 200 OK\\r\\n\\r\\nOK\" | nc -l -p 8080; done) & export DATABASE_URL=\"postgres://${google_sql_user.plane_user.name}:$DB_PASSWORD@/plane?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}\" && ./bin/docker-entrypoint-worker.sh"
      ]

      resources {
        limits = {
          cpu    = "2000m"
          memory = "2Gi"
        }
        cpu_idle = false
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AWS_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_access_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AWS_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_secret_key.secret_id
            version = "latest"
          }
        }
      }

      dynamic "env" {
        for_each = local.common_api_env
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Beat (Scheduled Tasks)
# =============================================================================
resource "google_cloud_run_v2_service" "plane_beat" {
  name     = "plane-beat"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.plane_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.plane_db.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/api:latest"

      ports {
        container_port = 8080
      }

      command = ["/bin/sh", "-c"]
      args = [
        "(while true; do echo -e \"HTTP/1.1 200 OK\\r\\n\\r\\nOK\" | nc -l -p 8080; done) & export DATABASE_URL=\"postgres://${google_sql_user.plane_user.name}:$DB_PASSWORD@/plane?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}\" && ./bin/docker-entrypoint-beat.sh"
      ]

      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi"
        }
        cpu_idle = false
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AWS_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_access_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AWS_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.storage_secret_key.secret_id
            version = "latest"
          }
        }
      }

      dynamic "env" {
        for_each = local.common_api_env
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# Migrator Job
# =============================================================================
resource "google_cloud_run_v2_job" "plane_migrator" {
  name     = "plane-migrator"
  location = var.region

  template {
    template {
      service_account = google_service_account.plane_sa.email
      timeout         = "600s"

      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "ALL_TRAFFIC"
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.plane_db.connection_name]
        }
      }

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/api:latest"

        command = ["./bin/docker-entrypoint-migrator.sh"]

        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }

        env {
          name  = "DATABASE_URL"
          value = "postgres://${google_sql_user.plane_user.name}:${google_secret_manager_secret_version.db_password_val.secret_data}@/${google_sql_database.plane_database.name}?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}"
        }

        env {
          name = "SECRET_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secret_key.secret_id
              version = "latest"
            }
          }
        }

        dynamic "env" {
          for_each = local.common_api_env
          content {
            name  = env.key
            value = env.value
          }
        }

        env {
          name = "AWS_ACCESS_KEY_ID"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.storage_access_key.secret_id
              version = "latest"
            }
          }
        }
        env {
          name = "AWS_SECRET_ACCESS_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.storage_secret_key.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# =============================================================================
# IAM - Allow Load Balancer to invoke Cloud Run services
# =============================================================================

# Web - Allow LB
resource "google_cloud_run_v2_service_iam_member" "web_invoker" {
  name     = google_cloud_run_v2_service.plane_web.name
  location = google_cloud_run_v2_service.plane_web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Admin - Allow LB (IAP handles auth)
resource "google_cloud_run_v2_service_iam_member" "admin_invoker" {
  name     = google_cloud_run_v2_service.plane_admin.name
  location = google_cloud_run_v2_service.plane_admin.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# API - Allow LB
resource "google_cloud_run_v2_service_iam_member" "api_invoker" {
  name     = google_cloud_run_v2_service.plane_api.name
  location = google_cloud_run_v2_service.plane_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Space - Allow LB
resource "google_cloud_run_v2_service_iam_member" "space_invoker" {
  name     = google_cloud_run_v2_service.plane_space.name
  location = google_cloud_run_v2_service.plane_space.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Live - Allow LB
resource "google_cloud_run_v2_service_iam_member" "live_invoker" {
  name     = google_cloud_run_v2_service.plane_live.name
  location = google_cloud_run_v2_service.plane_live.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

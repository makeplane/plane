# Cloud Run (Web)
resource "google_cloud_run_v2_service" "plane_web" {
  name     = "plane-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  
  template {
    service_account = google_service_account.plane_sa.email
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/web:latest"
      
      env {
        name = "API_BASE_URL"
        value = "https://plane-api-PLACEHOLDER.a.run.app" # Circular dep if we use interpolation here easily
      }
      env {
        name = "WEB_URL"
        value = "https://plane-web-PLACEHOLDER.a.run.app"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# Cloud Run (API)
resource "google_cloud_run_v2_service" "plane_api" {
  name     = "plane-api"
  location = var.region
  
  template {
    service_account = google_service_account.plane_sa.email
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
      
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name = "DATABASE_URL"
        value = "postgres://${google_sql_user.plane_user.name}:${google_secret_manager_secret_version.db_password_val.secret_data}@localhost:5432/${google_sql_database.plane_database.name}?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}"
      }
      env {
        name = "REDIS_URL"
        value = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}/"
      }
      # Storage
      env {
        name = "AWS_REGION"
        value = "US"
      }
      env {
        name = "AWS_ACCESS_KEY_ID"
        value = "hmac-access-key" # Need HMAC key for GCS? Or use GCS native? Plane supports S3. GCS has S3 interop.
        # Plane typically uses MinIO or S3.
        # For GCS S3 Interop, we need to generate HMAC keys.
        # Or check if Plane supports native GCS.
        # ENV example shows AWS_*.
      }
      env {
        name = "AWS_SECRET_ACCESS_KEY"
        value = "hmac-secret-key"
      }
      env {
        name = "AWS_S3_ENDPOINT_URL"
        value = "https://storage.googleapis.com"
      }
      env {
        name = "AWS_S3_BUCKET_NAME"
        value = google_storage_bucket.plane_uploads.name
      }
      
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
}

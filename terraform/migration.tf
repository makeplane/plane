# Cloud Run Job for Migration
resource "google_cloud_run_v2_job" "migration" {
  name     = "plane-migration"
  location = var.region
  
  template {
    template {
      service_account = google_service_account.plane_sa.email
      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "ALL_TRAFFIC"
      }
      
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo/api:latest"
        command = ["./bin/docker-entrypoint-migrator.sh"]
        
        env {
          name = "DATABASE_URL"
          value = "postgres://${google_sql_user.plane_user.name}:${google_secret_manager_secret_version.db_password_val.secret_data}@localhost:5432/${google_sql_database.plane_database.name}?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}"
        }
        
        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
      
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.plane_db.connection_name]
        }
      }
    }
  }
  
  depends_on = [google_project_service.apis, google_sql_database_instance.plane_db]
}

# Cloud SQL (Postgres)
resource "google_sql_database_instance" "plane_db" {
  name             = "plane-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
    
    backup_configuration {
      enabled                        = true
      start_time                     = "02:00" # UTC
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }
  }
  
  deletion_protection = true # PREVENT ACCIDENTAL DELETION
  depends_on = [google_project_service.apis, google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_user" "plane_user" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
  password = google_secret_manager_secret_version.db_password_val.secret_data
}

resource "google_sql_database" "plane_database" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
}

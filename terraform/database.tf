# Cloud SQL (Postgres)
resource "google_sql_database_instance" "plane_db" {
  name             = "plane-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro" # Free tier eligible-ish
    ip_configuration {
      ipv4_enabled = true # Ideally private, but for simplicity
    }
  }
  
  deletion_protection = false # For dev
  depends_on = [google_project_service.apis]
}

resource "google_sql_user" "plane_user" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
  password = "changeme123" # Should use Secret Manager
}

resource "google_sql_database" "plane_database" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
}

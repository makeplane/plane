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
  }
  
  deletion_protection = false
  depends_on = [google_project_service.apis, google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_user" "plane_user" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
  password = "changeme123" 
}

resource "google_sql_database" "plane_database" {
  name     = "plane"
  instance = google_sql_database_instance.plane_db.name
}

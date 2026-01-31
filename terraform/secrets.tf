# Secrets
resource "google_secret_manager_secret" "db_password" {
  secret_id = "plane-db-password"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password_val" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = "changeme123" # Initial value, should be rotated
}

resource "google_secret_manager_secret" "secret_key" {
  secret_id = "plane-secret-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "secret_key_val" {
  secret      = google_secret_manager_secret.secret_key.id
  secret_data = "generate-a-better-random-key-here" 
}

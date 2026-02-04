# Random Passwords
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "app_secret" {
  length           = 64
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

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
  secret_data = random_password.db_password.result
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
  secret_data = random_password.app_secret.result
}

# =============================================================================
# Storage Credentials (HMAC keys stored securely)
# =============================================================================

resource "google_secret_manager_secret" "storage_access_key" {
  secret_id = "plane-storage-access-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "storage_access_key_val" {
  secret      = google_secret_manager_secret.storage_access_key.id
  secret_data = google_storage_hmac_key.plane_key.access_id
}

resource "google_secret_manager_secret" "storage_secret_key" {
  secret_id = "plane-storage-secret-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "storage_secret_key_val" {
  secret      = google_secret_manager_secret.storage_secret_key.id
  secret_data = google_storage_hmac_key.plane_key.secret
}

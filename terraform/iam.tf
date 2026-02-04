# Service Account for Cloud Run
resource "google_service_account" "plane_sa" {
  account_id   = "plane-sa"
  display_name = "Plane Service Account"
}

# Permissions
resource "google_project_iam_member" "sa_roles" {

  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin",
    "roles/redis.editor", # To connect to Redis
    "roles/logging.logWriter"
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.plane_sa.email}"
}


resource "google_storage_hmac_key" "plane_key" {
  service_account_email = google_service_account.plane_sa.email
}



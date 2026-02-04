# Cloud Storage (MinIO Replacement)
resource "google_storage_bucket" "plane_uploads" {
  name          = "${var.project_id}-uploads"
  location      = "US"
  force_destroy = false # Prevent deleting bucket with data

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  # CORS configuration for file uploads from web frontend
  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    response_header = ["Content-Type", "Content-Length", "Content-Disposition", "Cache-Control"]
    max_age_seconds = 3600
  }
}

# Cloud Storage (MinIO Replacement)
resource "google_storage_bucket" "plane_uploads" {
  name          = "${var.project_id}-uploads"
  location      = "US"
  force_destroy = true
  
  uniform_bucket_level_access = true
}

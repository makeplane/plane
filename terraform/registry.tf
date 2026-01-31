resource "google_artifact_registry_repository" "plane_repo" {
  location      = var.region
  repository_id = "plane-repo"
  description   = "Docker repository for Plane"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}

# Cloud Run (Web)
resource "google_cloud_run_v2_service" "plane_web" {
  name     = "plane-web"
  location = var.region
  ingress = "INGRESS_TRAFFIC_ALL"
  
  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder until we build
      env {
        name = "API_BASE_URL"
        value = "CHANGE_ME"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

# Cloud Run (API)
resource "google_cloud_run_v2_service" "plane_api" {
  name     = "plane-api"
  location = var.region
  
  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      env {
        name = "DATABASE_URL"
        value = "CHANGE_ME"
      }
      env {
        name = "REDIS_URL"
        value = "CHANGE_ME"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

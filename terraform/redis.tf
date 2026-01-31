# Memorystore (Redis)
resource "google_redis_instance" "plane_redis" {
  name           = "plane-redis"
  memory_size_gb = 1
  region         = var.region
  
  depends_on = [google_project_service.apis]
}

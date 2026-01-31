# Memorystore (Redis)
resource "google_redis_instance" "plane_redis" {
  name           = "plane-redis"
  memory_size_gb = 1
  region         = var.region
  
  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  
  depends_on = [google_project_service.apis, google_service_networking_connection.private_vpc_connection]
}

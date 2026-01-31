# Cloud Run (Web)
resource "google_cloud_run_v2_service" "plane_web" {
  name     = "plane-web"
  location = var.region
  ingress = "INGRESS_TRAFFIC_ALL"
  
  template {
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }
    
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" 
      env {
        name = "API_BASE_URL"
        value = "https://plane-api-PLACEHOLDER.a.run.app" # Needs to be updated after API creation or via specialized variable
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
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }
    
    # Annotation for Cloud SQL
    annotations = {
      "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.plane_db.connection_name
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      
      # Dynamic Injection
      env {
        name = "DATABASE_URL"
        value = "postgres://plane:changeme123@localhost:5432/plane?host=/cloudsql/${google_sql_database_instance.plane_db.connection_name}"
      }
      env {
        name = "REDIS_URL"
        value = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

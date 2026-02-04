# =============================================================================
# Outputs
# =============================================================================

output "load_balancer_ip" {
  description = "Static IP address for the load balancer - point your DNS here"
  value       = google_compute_global_address.plane_lb_ip.address
}

output "plane_url" {
  description = "Primary URL for Plane"
  value       = "https://${var.domain}"
}

output "admin_url" {
  description = "Admin panel URL (protected by IAP if enabled)"
  value       = "https://${var.domain}/god-mode"
}

output "api_url" {
  description = "API base URL"
  value       = "https://${var.domain}/api"
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.plane_db.connection_name
}

output "cloud_sql_private_ip" {
  description = "Cloud SQL private IP address"
  value       = google_sql_database_instance.plane_db.private_ip_address
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.plane_redis.host
}

output "storage_bucket" {
  description = "GCS bucket for uploads"
  value       = google_storage_bucket.plane_uploads.name
}

output "service_account_email" {
  description = "Service account email used by Cloud Run"
  value       = google_service_account.plane_sa.email
}

output "artifact_registry" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/plane-repo"
}

# Cloud Run service URLs (direct, for debugging)
output "cloud_run_services" {
  description = "Direct Cloud Run service URLs (bypasses load balancer)"
  value = {
    web    = google_cloud_run_v2_service.plane_web.uri
    admin  = google_cloud_run_v2_service.plane_admin.uri
    api    = google_cloud_run_v2_service.plane_api.uri
    space  = google_cloud_run_v2_service.plane_space.uri
    live   = google_cloud_run_v2_service.plane_live.uri
    worker = google_cloud_run_v2_service.plane_worker.uri
    beat   = google_cloud_run_v2_service.plane_beat.uri
  }
}

output "ssl_certificate_status" {
  description = "SSL certificate provisioning status"
  value       = google_compute_managed_ssl_certificate.plane_cert.certificate_id
}

output "iap_enabled" {
  description = "Whether IAP is enabled for admin panel"
  value       = var.enable_iap
}

output "dns_instructions" {
  description = "DNS configuration instructions"
  value       = <<-EOT

    ========================================
    DNS CONFIGURATION REQUIRED
    ========================================

    Create an A record pointing to the load balancer IP:

      ${var.domain}  →  ${google_compute_global_address.plane_lb_ip.address}

    SSL certificate will auto-provision once DNS propagates.
    This may take 15-60 minutes after DNS is configured.

    Check certificate status:
      gcloud compute ssl-certificates describe plane-ssl-cert --global

  EOT
}

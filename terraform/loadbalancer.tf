# =============================================================================
# External HTTPS Load Balancer with Cloud Armor and Managed SSL
# =============================================================================

# Reserve a global static IP
resource "google_compute_global_address" "plane_lb_ip" {
  name = "plane-lb-ip"
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "plane_policy" {
  name = "plane-security-policy"

  # Default rule - allow traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }

  # Allow god-mode admin panel
  rule {
    action   = "allow"
    priority = "100"
    match {
      expr {
        expression = "request.path.matches('/god-mode.*')"
      }
    }
    description = "Allow god-mode admin panel"
  }

  # Allow admin setup endpoints (bypass WAF for legitimate instance setup)
  rule {
    action   = "allow"
    priority = "101"
    match {
      expr {
        expression = "request.path.matches('/api/instances/.*')"
      }
    }
    description = "Allow admin/instance API endpoints"
  }

  # Allow auth endpoints (login, signup, password reset)
  rule {
    action   = "allow"
    priority = "102"
    match {
      expr {
        expression = "request.path.matches('/auth/.*')"
      }
    }
    description = "Allow authentication endpoints"
  }

  # Allow all API endpoints (internal application calls)
  rule {
    action   = "allow"
    priority = "103"
    match {
      expr {
        expression = "request.path.matches('/api/.*')"
      }
    }
    description = "Allow API endpoints"
  }

  # Block common attack patterns
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  rule {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection"
  }

  rule {
    action   = "deny(403)"
    priority = "1002"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
    description = "Block Local File Inclusion"
  }

  rule {
    action   = "deny(403)"
    priority = "1003"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      }
    }
    description = "Block Remote File Inclusion"
  }

  # Rate limiting rule
  rule {
    action   = "throttle"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Rate limit all traffic"
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 500
        interval_sec = 60
      }
    }
  }
}

# Serverless NEGs for Cloud Run services
resource "google_compute_region_network_endpoint_group" "web_neg" {
  name                  = "plane-web-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.plane_web.name
  }
}

resource "google_compute_region_network_endpoint_group" "admin_neg" {
  name                  = "plane-admin-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.plane_admin.name
  }
}

resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "plane-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.plane_api.name
  }
}

resource "google_compute_region_network_endpoint_group" "space_neg" {
  name                  = "plane-space-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.plane_space.name
  }
}

resource "google_compute_region_network_endpoint_group" "live_neg" {
  name                  = "plane-live-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.plane_live.name
  }
}

# Backend Services
resource "google_compute_backend_service" "web_backend" {
  name                  = "plane-web-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.plane_policy.id

  backend {
    group = google_compute_region_network_endpoint_group.web_neg.id
  }
}

resource "google_compute_backend_service" "admin_backend" {
  name                  = "plane-admin-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.plane_policy.id

  # IAP Configuration for admin
  dynamic "iap" {
    for_each = var.enable_iap ? [1] : []
    content {
      oauth2_client_id     = google_iap_client.plane_client[0].client_id
      oauth2_client_secret = google_iap_client.plane_client[0].secret
    }
  }

  backend {
    group = google_compute_region_network_endpoint_group.admin_neg.id
  }
}

resource "google_compute_backend_service" "api_backend" {
  name                  = "plane-api-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.plane_policy.id

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
}

resource "google_compute_backend_service" "space_backend" {
  name                  = "plane-space-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.plane_policy.id

  backend {
    group = google_compute_region_network_endpoint_group.space_neg.id
  }
}

resource "google_compute_backend_service" "live_backend" {
  name                  = "plane-live-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.plane_policy.id

  backend {
    group = google_compute_region_network_endpoint_group.live_neg.id
  }
}

# URL Map - Route traffic to appropriate backends
resource "google_compute_url_map" "plane_url_map" {
  name            = "plane-url-map"
  default_service = google_compute_backend_service.web_backend.id

  host_rule {
    hosts        = [var.domain]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.web_backend.id

    path_rule {
      paths   = ["/api/*", "/api"]
      service = google_compute_backend_service.api_backend.id
    }

    path_rule {
      paths   = ["/auth/*", "/auth"]
      service = google_compute_backend_service.api_backend.id
    }

    path_rule {
      paths   = ["/god-mode/*", "/god-mode"]
      service = google_compute_backend_service.admin_backend.id
    }

    path_rule {
      paths   = ["/spaces/*", "/spaces"]
      service = google_compute_backend_service.space_backend.id
    }

    path_rule {
      paths   = ["/live/*", "/live"]
      service = google_compute_backend_service.live_backend.id
    }
  }
}

# Managed SSL Certificate
resource "google_compute_managed_ssl_certificate" "plane_cert" {
  name = "plane-ssl-cert-${replace(var.domain, ".", "-")}"

  managed {
    domains = [var.domain]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS Target Proxy
resource "google_compute_target_https_proxy" "plane_https_proxy" {
  name             = "plane-https-proxy"
  url_map          = google_compute_url_map.plane_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.plane_cert.id]
}

# HTTP to HTTPS Redirect
resource "google_compute_url_map" "https_redirect" {
  name = "plane-https-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect_proxy" {
  name    = "plane-http-redirect-proxy"
  url_map = google_compute_url_map.https_redirect.id
}

# Forwarding Rules
resource "google_compute_global_forwarding_rule" "https_forwarding" {
  name                  = "plane-https-forwarding"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.plane_https_proxy.id
  ip_address            = google_compute_global_address.plane_lb_ip.id
}

resource "google_compute_global_forwarding_rule" "http_forwarding" {
  name                  = "plane-http-forwarding"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_redirect_proxy.id
  ip_address            = google_compute_global_address.plane_lb_ip.id
}

# =============================================================================
# Identity-Aware Proxy (IAP) for Admin Panel
# =============================================================================

# IAP Brand (OAuth consent screen)
resource "google_iap_brand" "plane_brand" {
  count             = var.enable_iap ? 1 : 0
  support_email     = data.google_project.current.billing_account != null ? "admin@${var.domain}" : "noreply@${var.project_id}.iam.gserviceaccount.com"
  application_title = "Plane Admin"
  project           = var.project_id
}

# IAP Client
resource "google_iap_client" "plane_client" {
  count        = var.enable_iap ? 1 : 0
  display_name = "Plane Admin IAP Client"
  brand        = google_iap_brand.plane_brand[0].name
}

data "google_project" "current" {
  project_id = var.project_id
}

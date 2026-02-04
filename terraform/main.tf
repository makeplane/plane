provider "google" {
  project = var.project_id
  region  = var.region
}

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "domain" {
  description = "Primary domain for Plane (e.g., plane.example.com)"
  type        = string
}

variable "enable_iap" {
  description = "Enable Identity-Aware Proxy for admin panel"
  type        = bool
  default     = true
}

# Enable APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "compute.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "vpcaccess.googleapis.com",
    "iap.googleapis.com",
    "certificatemanager.googleapis.com",
    "monitoring.googleapis.com"
  ])
  project = var.project_id
  service = each.key
  disable_on_destroy = false
}

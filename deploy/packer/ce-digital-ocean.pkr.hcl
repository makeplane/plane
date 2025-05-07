packer {
  required_plugins {
    digitalocean = {
      version = ">= 1.0.4"
      source  = "github.com/digitalocean/digitalocean"
    }
  }
}

# Variables for AWS credentials
variable "do_token" {
  type    = string
  default = "do-token"
}

variable "do_region" {
  type    = string
  default = "BLR1"
}

variable "ami_name_prefix" {
  type    = string
  default = "plane"
}

# Local variables for reuse
locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}



source "digitalocean" "plane_do_droplet" {
  api_token    = var.do_token
  image        = "ubuntu-22-04-x64"
  region       = var.do_region
  size         = "s-2vcpu-4gb"
  ssh_username = "root"
  droplet_name = "${var.ami_name_prefix}-${local.timestamp}"
  snapshot_name = "${var.ami_name_prefix}-${local.timestamp}"
  tags = [
    "plane-ce",
  ]
}

# Build block defining what to install and configure
build {
  sources = [
    "source.digitalocean.plane_do_droplet"
  ]

  # Copy application files
  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color",
      "CI=true",
      "HISTSIZE=0",
      "HISTFILESIZE=0",
      "HISTFILE=/dev/null"
    ]
    inline = [
      "ufw --force enable",
      "ufw allow http",
      "ufw allow https",
      "ufw allow ssh",
      "sudo mkdir -p /opt/plane/tars /opt/plane/extracted"
    ]
  }

  provisioner "file" {
    source      = "plane-dist/"
    destination = "/opt/plane/tars"
  }

  # Set proper permissions and verify installation
  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color",
      "HISTSIZE=0",
      "HISTFILESIZE=0",
      "HISTFILE=/dev/null"
    ]
    inline = [
      "sudo mkdir -p /opt/plane/svc",
      "sudo chmod -R 755 /opt/plane",

      # Extract the application files
      "echo 'Depacking admin folder'",
      "sudo tar -xzf /opt/plane/tars/admin-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/admin-dist/ /opt/plane/admin",
      "sudo cp /opt/plane/tars/admin.env /opt/plane/admin/admin.env",

      "echo 'Depacking web folder'",
      "sudo tar -xzf /opt/plane/tars/web-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/web-dist/ /opt/plane/web",
      "sudo cp /opt/plane/tars/web.env /opt/plane/web/web.env",

      "echo 'Depacking space folder'",
      "sudo tar -xzf /opt/plane/tars/space-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/space-dist/ /opt/plane/space",
      "sudo cp /opt/plane/tars/space.env /opt/plane/space/space.env",

      "echo 'Depacking live folder'",
      "sudo tar -xzf /opt/plane/tars/live-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/live-dist/ /opt/plane/live",
      "sudo cp /opt/plane/tars/live.env /opt/plane/live/live.env",

      "echo 'Depacking backend folder'",    
      "sudo tar -xzf /opt/plane/tars/backend-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/backend-dist/ /opt/plane/backend",
      "sudo cp /opt/plane/tars/backend.env /opt/plane/backend/backend.env",

      "echo 'Copying services'",
      "sudo cp /opt/plane/tars/*.service /opt/plane/svc/",

      "echo 'Copying Caddyfile'",
      "sudo cp /opt/plane/tars/Caddyfile /opt/plane/Caddyfile",

      "echo 'Copying plane-ce.sh'",
      "sudo cp /opt/plane/tars/plane-ce.sh /usr/local/bin/plane",
      "sudo chmod +x /usr/local/bin/plane",

      "echo 'Removing extracted folder'",
      "sudo rm -rf /opt/plane/extracted",
      # "sudo rm -rf /opt/plane/tars",

      # Set proper permissions and verify installation
      "echo 'Setting proper permissions...'",
      "sudo chmod -R 755 /opt/plane",
      # Verify installation
      "echo 'Verifying assets copied...'",
      "ls -la /opt/plane",
      "for dir in admin web space live backend; do ls -la /opt/plane/$dir; done",
      "echo 'Assets copied successfully'"
    ]
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color",
      "CI=true",
      "HISTSIZE=0",
      "HISTFILESIZE=0",
      "HISTFILE=/dev/null"
    ]
    inline = [
      "bash -c '. /usr/local/bin/plane && install_prerequisites'",
    ]
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color",
      "CI=true",
      "HISTSIZE=0",
      "HISTFILESIZE=0",
      "HISTFILE=/dev/null"
    ]
    inline = [
      "sudo systemctl enable ssh",
      "sudo systemctl start ssh"
    ]
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color",
      "CI=true",
      "HISTSIZE=0",
      "HISTFILESIZE=0",
      "HISTFILE=/dev/null"
    ]
    inline = [
      "curl -L https://github.com/digitalocean/marketplace-partners/raw/master/scripts/90-cleanup.sh | bash",
      "sudo apt-get purge droplet-agent -y",
      "sudo rm -rf /var/log/*.log",
      "curl -L https://github.com/digitalocean/marketplace-partners/raw/master/scripts/99-img-check.sh | bash",
    ]
  }

  # Post-processor for potential AMI modifications
  post-processor "manifest" {
    output = "ce-digital-ocean-manifest.json"
    strip_path = true
  }
} 
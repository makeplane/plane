packer {
  required_plugins {
    digitalocean = {
      version = ">= 1.0.4"
      source  = "github.com/digitalocean/digitalocean"
    }
  }
}

# Variables for AWS credentials
variable "api_token" {
  type    = string
  default = "api_token"
}


variable "region" {
  type    = string
  default = "BLR1"
}

variable "image" {
  type    = string
  default = "ubuntu-22-04-x64"
}

variable "instance_type" {
  type    = string
  default = "s-2vcpu-4gb"
}

variable "user_name" {
  type    = string
  default = "root"
}

variable "ami_name_prefix" {
  type    = string
  default = "plane"
}

variable "prime_host" {
  type    = string
  default = "https://prime.plane.so"
}

variable "manifest_file_name" {
  type    = string
  default = "ee-docker-digital-ocean-manifest.json"
}


# Local variables for reuse
locals {
  timestamp  = regex_replace(timestamp(), "[- TZ:]", "")
  build_time = formatdate("YYYYMMDD-hhmm", timestamp())
  
  # Common environment variables for all shell provisioners
  common_env_vars = [
    "DEBIAN_FRONTEND=noninteractive",
    "TERM=xterm-256color",
    "SHELL=/bin/bash"
  ]
  
  # Common shell settings
  # shell_settings = "set +H +e; set -o pipefail; set -e"
}

source "digitalocean" "plane_digital_ocean_ami" {
  snapshot_name = "${var.ami_name_prefix}-${local.timestamp}"
  api_token    = var.api_token
  image        = var.image
  region       = var.region
  size         = var.instance_type
  ssh_username = var.user_name
}

# Build block defining what to install and configure
build {
  sources = [
    "source.digitalocean.plane_digital_ocean_ami"
  ]

  # Copy application files
  provisioner "shell" {
    name             = "system-setup"
    environment_vars = local.common_env_vars
    inline  = [
      # local.shell_settings,
      # Sleep for 1 minute
      "sleep 90",
      "sudo rm -rf /var/lib/apt/lists/*",
      "sudo mkdir -p /var/lib/apt/lists/partial",
      "for i in {1..3}; do sudo apt-get update && break || sleep 10; done",
      "sudo apt-get install -y cloud-init",
      "curl -fsSL https://get.docker.com | sudo sh -",
      "sudo apt-get install -y uidmap",
      "mkdir -p /tmp/cloud-init",
    ]
    timeout = "15m"
  }

  # set prime host to instance environment variable
  provisioner "shell" {
    name             = "set-environment"
    environment_vars = local.common_env_vars
    inline = [
      # local.shell_settings,
      "sudo bash -c 'echo PRIME_HOST=${var.prime_host} >> /etc/environment'"
    ]
  }

  provisioner "file" {
    source      = "plane-dist/"
    destination = "/tmp/cloud-init"
  }

  provisioner "shell" {
    name             = "configure-cloud-init"
    environment_vars = local.common_env_vars
    inline = [
      # local.shell_settings,
      "sudo mv /tmp/cloud-init/99_plane.cfg /etc/cloud/cloud.cfg.d/99_plane.cfg",
      "sudo mv /tmp/cloud-init/digitalocean-plane-setup /usr/local/bin/verify-plane-setup",
      "sudo chmod +x /usr/local/bin/verify-plane-setup"
    ]
  }

  provisioner "shell" {
    name = "verify-plane-setup"
    environment_vars = concat(local.common_env_vars, [
      "PRIME_HOST=${var.prime_host}"
    ])
    inline = [
      # local.shell_settings,
      "sudo /usr/local/bin/verify-plane-setup --prime-host=${var.prime_host}",
    ]
    timeout = "30m"
  }

  provisioner "shell" {
    name             = "uninstall-prime-cli"
    environment_vars = local.common_env_vars
    inline = [
      # local.shell_settings,
      "sudo prime-cli uninstall -s",
    ]
  }

  provisioner "shell" {
    name             = "cleanup-files"
    environment_vars = local.common_env_vars
    inline = [
      # local.shell_settings,
      "sudo rm /etc/update-motd.d/99-plane-status",
      "sudo rm /var/lib/cloud/instance/plane-setup-complete",
      "sudo rm /var/lib/cloud/instance/plane-setup-status",
      "sudo rm /var/log/plane-setup.log",
      "sudo rm -rf /tmp/cloud-init",
      "sudo rm -rf /root/.ssh/authorized_keys",
      "sudo rm -f /root/.*_history",
    ]
  }

  provisioner "shell" {
    name             = "final-cleanup"
    environment_vars = local.common_env_vars
    execute_command  = "chmod +x {{ .Path }}; {{ .Vars }} /bin/bash -i {{ .Path }}"
    inline = [
      # local.shell_settings,
      # Configure firewall
      "ufw --force enable",
      "ufw allow http",
      "ufw allow https", 
      "ufw allow ssh",
      # Clear shell history
      "history -c 2>/dev/null || true",
      "history -w 2>/dev/null || true",
      "rm -f ~/.bash_history /root/.bash_history",
      "export HISTSIZE=0",
      "export HISTFILESIZE=0",
      "unset HISTFILE",
      # Run DigitalOcean cleanup scripts
      "curl -fsSL https://github.com/digitalocean/marketplace-partners/raw/master/scripts/90-cleanup.sh | bash",
      "sudo apt-get purge droplet-agent -y || true",
      "sudo rm -rf /var/log/*.log /opt/containerd",
      "curl -fsSL https://github.com/digitalocean/marketplace-partners/raw/master/scripts/99-img-check.sh | bash",
      "history -c 2>/dev/null || true",
    ]
  }
  
  # Post-processor for potential AMI modifications
  post-processor "manifest" {
    output = var.manifest_file_name
    strip_path = true
    custom_data = {
      "ami_name" = "${var.ami_name_prefix}-${local.timestamp}",
      "prime_host" = var.prime_host,
      "build_time" = local.build_time
    }
  }
} 
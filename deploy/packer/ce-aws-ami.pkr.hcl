packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Variables for AWS credentials
variable "aws_access_key" {
  type    = string
  default = "aws-access-key"
}

variable "aws_secret_key" {
  type    = string
  default = "aws-secret-access-key"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ami_name_prefix" {
  type    = string
  default = "plane"
}

variable "vpc_cidr" {
  type    = string
  default = "10.22.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.22.1.0/24"
}

variable "base_image_owner" {
  type    = string
  default = "099720109477"
}

# Local variables for reuse
locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

# Source block defining the base image and configuration
source "amazon-ebs" "plane_aws_ami" {
  access_key    = var.aws_access_key
  secret_key    = var.aws_secret_key
  region        = var.aws_region
  ami_name      = "${var.ami_name_prefix}-${local.timestamp}"
  instance_type = "t3a.micro"

  vpc_filter {
    filters = {
      "cidr": var.vpc_cidr
    }
  }

  subnet_filter {
    filters = {
      "cidr": var.subnet_cidr
    }
  }

  associate_public_ip_address = true

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = [var.base_image_owner]
  }
  
  ssh_username = "ubuntu"
  
  tags = {
    Name        = "${var.ami_name_prefix}-${local.timestamp}"
    Environment = "Production"
    Builder     = "Packer"
  }
}

# Build block defining what to install and configure
build {
  name = "${var.ami_name_prefix}-${local.timestamp}"
  sources = [
    "source.amazon-ebs.plane_aws_ami"
  ]


  # Copy application files
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/plane/artifacts",
      "sudo chown -R ubuntu:ubuntu /opt/plane"
    ]
  }

  provisioner "file" {
    source      = "plane-dist/"
    destination = "/opt/plane/artifacts"
  }

  # Set proper permissions and verify installation
  provisioner "shell" {
    inline = [
      "sudo chown -R ubuntu:ubuntu /opt/plane",
      "sudo chmod -R 755 /opt/plane",
      "mkdir -p /opt/plane/{admin,web,space,live,backend}",
      # Extract the application files
      "tar -xzf /opt/plane/artifacts/admin-dist.tar.gz -C /opt/plane/admin",
      "tar -xzf /opt/plane/artifacts/web-dist.tar.gz -C /opt/plane/web",
      "tar -xzf /opt/plane/artifacts/space-dist.tar.gz -C /opt/plane/space",
      "tar -xzf /opt/plane/artifacts/live-dist.tar.gz -C /opt/plane/live",
      "tar -xzf /opt/plane/artifacts/backend-dist.tar.gz -C /opt/plane/backend",
      # Set proper permissions and verify installation
      "sudo chown -R ubuntu:ubuntu /opt/plane",
      "sudo chmod -R 755 /opt/plane",
      # Verify installation
      "echo 'Verifying assets copied...'",
      "for dir in admin web space live backend; do ls -la /opt/plane/$dir; done",
      "echo 'Assets copied successfully'"
    ]
  }


  # Update and install basic requirements
  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive"
    ]
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y software-properties-common cloud-init rsyslog",
      "sudo add-apt-repository -y ppa:deadsnakes/ppa",
      "sudo apt-get update",
      "sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip",
      "sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1",
      "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
      ". $HOME/.nvm/nvm.sh",
      "nvm install 20",
      "corepack enable yarn",
      # Verify installations
      "python3 --version",
      "node --version",
      "yarn --version",
      # Enable and verify system services
      "sudo systemctl enable rsyslog",
      "sudo systemctl enable cloud-init",
      # Add custom logging
  #     "sudo tee /etc/rsyslog.d/plane.conf > /dev/null <<EOL\nlocal0.* /var/log/plane.log\nEOL",
  #     "sudo systemctl restart rsyslog",
  #     # Create initialization check script
  #     "sudo tee /usr/local/bin/check-plane-init > /dev/null <<EOL\n#!/bin/bash\necho \"[\\$(date)] Starting Plane initialization check\" | logger -t plane-init\nfor dir in admin web space live backend; do\n  if [ ! -d \"/opt/plane/\\$dir\" ]; then\n    echo \"[\\$(date)] Error: /opt/plane/\\$dir not found\" | logger -t plane-init\n    exit 1\n  fi\ndone\necho \"[\\$(date)] Plane initialization completed successfully\" | logger -t plane-init\nEOL",
  #     "sudo chmod +x /usr/local/bin/check-plane-init",
  #     # Add to cloud-init
  #     "sudo tee /etc/cloud/cloud.cfg.d/99-plane-init.cfg > /dev/null <<EOL\nruncmd:\n - [ /usr/local/bin/check-plane-init ]\nEOL"
    ]
  }

  # # Copy application files
  # provisioner "shell" {
  #   inline = [
  #     "sudo mkdir -p /opt/plane/{admin,web,space,live,backend}",
  #     "sudo chown -R ubuntu:ubuntu /opt/plane"
  #   ]
  # }

  # provisioner "file" {
  #   source      = "plane/"
  #   destination = "/opt/plane"
  # }

  # # Set proper permissions and verify installation
  # provisioner "shell" {
  #   inline = [
  #     "sudo chown -R ubuntu:ubuntu /opt/plane",
  #     "sudo chmod -R 755 /opt/plane",
  #     "echo 'Verifying Plane installation...'",
  #     "for dir in admin web space live backend; do ls -la /opt/plane/$dir; done",
  #     "/usr/local/bin/check-plane-init",
  #     "echo 'Installation verification complete'"
  #   ]
  # }

  # Post-processor for potential AMI modifications
  post-processor "manifest" {
    output = "manifest.json"
    strip_path = true
  }
} 
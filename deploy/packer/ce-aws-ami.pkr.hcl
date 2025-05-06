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
  instance_type = "t3a.medium"

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
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color"
    ]
    inline = [
      "sudo mkdir -p /opt/plane/tars /opt/plane/extracted",
      "sudo chown -R ubuntu:ubuntu /opt/plane"
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
      "TERM=xterm-256color"
    ]
    inline = [
      "sudo mkdir -p /opt/plane/svc",
      "sudo chown -R ubuntu:ubuntu /opt/plane",
      "sudo chmod -R 755 /opt/plane",
      # Extract the application files
      "echo 'Depacking admin files...'",
      "sudo tar -xzf /opt/plane/tars/admin-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/admin-dist/ /opt/plane/admin",
      "sudo cp /opt/plane/tars/admin.env /opt/plane/admin/admin.env",

      "echo 'Depacking web files...'",
      "sudo tar -xzf /opt/plane/tars/web-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/web-dist/ /opt/plane/web",
      "sudo cp /opt/plane/tars/web.env /opt/plane/web/web.env",

      "echo 'Depacking space files...'",
      "sudo tar -xzf /opt/plane/tars/space-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/space-dist/ /opt/plane/space",
      "sudo cp /opt/plane/tars/space.env /opt/plane/space/space.env",

      "echo 'Depacking live files...'",
      "sudo tar -xzf /opt/plane/tars/live-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/live-dist/ /opt/plane/live",
      "sudo cp /opt/plane/tars/live.env /opt/plane/live/live.env",

      "echo 'Depacking backend files...'",    
      "sudo tar -xzf /opt/plane/tars/backend-dist.tar.gz -C /opt/plane/extracted",
      "sudo mv /opt/plane/extracted/backend-dist/ /opt/plane/backend",
      "sudo cp /opt/plane/tars/backend.env /opt/plane/backend/backend.env",

      "echo 'Copying services...'",
      "sudo cp /opt/plane/tars/*.service /opt/plane/svc/",

      "echo 'Copying Caddyfile...'",
      "sudo cp /opt/plane/tars/Caddyfile /opt/plane/Caddyfile",

      "echo 'Copying plane-ce.sh...'",
      "sudo cp /opt/plane/tars/plane-ce.sh /usr/local/bin/plane",
      "sudo chmod +x /usr/local/bin/plane",

      "echo 'Removing extracted files...'",
      "sudo rm -rf /opt/plane/extracted",
      # "sudo rm -rf /opt/plane/tars",

      # Set proper permissions and verify installation
      "echo 'Setting proper permissions...'",
      "sudo chown -R ubuntu:ubuntu /opt/plane",
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
      "TERM=xterm-256color"
    ]
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y python3-apt"  # Install basic requirements
    ]
  }
  # Update and install basic requirements
  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "TERM=xterm-256color"
    ]
    inline = [
      # "sudo apt-get update",
      "/usr/local/bin/plane install",
      "sudo systemctl enable ssh",
      "sudo systemctl start ssh"
    ]
  }

  # Post-processor for potential AMI modifications
  post-processor "manifest" {
    output = "manifest.json"
    strip_path = true
  }
} 
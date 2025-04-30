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
    owners      = ["099720109477"] # Canonical's AWS account ID
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

  # Update and install basic requirements
  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive"
    ]
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y software-properties-common",
      "sudo add-apt-repository -y ppa:deadsnakes/ppa",
      "sudo apt-get update",
      "sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip",
      "sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1",
      "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
      ". $HOME/.nvm/nvm.sh",
      "nvm install 20",
      "corepack enable yarn"
    ]
  }

  # Copy application files
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/plane/{admin,web,space,live,backend}",
      "sudo chown -R ubuntu:ubuntu /opt/plane"
    ]
  }

  provisioner "file" {
    source      = "plane/"
    destination = "/opt/plane"
  }

  # Set proper permissions
  provisioner "shell" {
    inline = [
      "sudo chown -R ubuntu:ubuntu /opt/plane",
      "sudo chmod -R 755 /opt/plane",
      "echo 'All components installed in /opt/plane:' && ls -la /opt/plane/"
    ]
  }

  # Add more provisioners here for:
  # 1. Installing Docker and Docker Compose
  # 2. Setting up Nginx configuration
  # 3. Deploying Plane components
  # 4. Setting up systemd services
  
  # Example provisioner for copying files
  # provisioner "file" {
  #   source      = "configs/"
  #   destination = "/tmp/"
  # }

  # Post-processor for potential AMI modifications
  post-processor "manifest" {
    output = "manifest.json"
    strip_path = true
  }
} 
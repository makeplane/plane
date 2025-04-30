packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Local variables for reuse
locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

# Source block defining the base image and configuration
source "amazon-ebs" "plane_ce" {
  ami_name      = "plane-ce-${local.timestamp}"
  instance_type = "t2.micro"
  region        = "us-east-1"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["426043895157"] # Canonical's AWS account ID
  }
  
  ssh_username = "ubuntu"
  
  tags = {
    Name        = "Plane CE"
    Environment = "Production"
    Builder     = "Packer"
  }
}

# Build block defining what to install and configure
build {
  name = "plane-ce"
  sources = [
    "source.amazon-ebs.plane_ce"
  ]

  # Update and install basic requirements
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y software-properties-common",
      "sudo add-apt-repository -y ppa:deadsnakes/ppa",
      "sudo apt-get update",
      "sudo apt-get install -y python3.12=3.12.5* python3.12-venv python3.12-dev python3-pip",
      "sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1",
      "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
      ". $HOME/.nvm/nvm.sh",
      "nvm install 20",
      "corepack enable yarn"
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
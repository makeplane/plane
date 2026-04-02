#!/usr/bin/env python3
"""
Cloudflare Worker Deployment Utility

Automates Cloudflare Worker deployments with wrangler.toml configuration handling,
multi-environment support, and comprehensive error handling.

Usage:
    python cloudflare-deploy.py --env production --dry-run
    python cloudflare-deploy.py --project ./my-worker --env staging
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class CloudflareDeployError(Exception):
    """Custom exception for Cloudflare deployment errors."""
    pass


class CloudflareDeploy:
    """Handle Cloudflare Worker deployments with wrangler CLI."""

    def __init__(self, project_dir: Path, env: Optional[str] = None,
                 dry_run: bool = False, verbose: bool = False):
        """
        Initialize CloudflareDeploy.

        Args:
            project_dir: Path to Worker project directory
            env: Environment name (production, staging, dev)
            dry_run: Preview deployment without actually deploying
            verbose: Enable verbose output
        """
        self.project_dir = Path(project_dir).resolve()
        self.env = env
        self.dry_run = dry_run
        self.verbose = verbose
        self.wrangler_toml = self.project_dir / "wrangler.toml"

    def validate_project(self) -> bool:
        """
        Validate project directory and wrangler.toml existence.

        Returns:
            True if valid, False otherwise

        Raises:
            CloudflareDeployError: If validation fails
        """
        if not self.project_dir.exists():
            raise CloudflareDeployError(
                f"Project directory does not exist: {self.project_dir}"
            )

        if not self.wrangler_toml.exists():
            raise CloudflareDeployError(
                f"wrangler.toml not found in: {self.project_dir}"
            )

        return True

    def check_wrangler_installed(self) -> bool:
        """
        Check if wrangler CLI is installed.

        Returns:
            True if installed, False otherwise
        """
        try:
            result = subprocess.run(
                ["wrangler", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            if self.verbose:
                print(f"Wrangler version: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def run_command(self, cmd: List[str], check: bool = True) -> Tuple[int, str, str]:
        """
        Run shell command and capture output.

        Args:
            cmd: Command and arguments as list
            check: Raise exception on non-zero exit code

        Returns:
            Tuple of (exit_code, stdout, stderr)

        Raises:
            CloudflareDeployError: If command fails and check=True
        """
        if self.verbose:
            print(f"Running: {' '.join(cmd)}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.project_dir,
                check=check
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            if check:
                raise CloudflareDeployError(
                    f"Command failed: {' '.join(cmd)}\n{e.stderr}"
                )
            return e.returncode, e.stdout, e.stderr

    def get_worker_name(self) -> str:
        """
        Extract worker name from wrangler.toml.

        Returns:
            Worker name

        Raises:
            CloudflareDeployError: If name cannot be extracted
        """
        try:
            with open(self.wrangler_toml, 'r') as f:
                for line in f:
                    if line.strip().startswith('name'):
                        # Parse: name = "worker-name"
                        return line.split('=')[1].strip().strip('"\'')
        except Exception as e:
            raise CloudflareDeployError(f"Failed to read worker name: {e}")

        raise CloudflareDeployError("Worker name not found in wrangler.toml")

    def build_deploy_command(self) -> List[str]:
        """
        Build wrangler deploy command with appropriate flags.

        Returns:
            Command as list of strings
        """
        cmd = ["wrangler", "deploy"]

        if self.env:
            cmd.extend(["--env", self.env])

        if self.dry_run:
            cmd.append("--dry-run")

        return cmd

    def deploy(self) -> bool:
        """
        Execute deployment.

        Returns:
            True if successful

        Raises:
            CloudflareDeployError: If deployment fails
        """
        # Validate
        self.validate_project()

        if not self.check_wrangler_installed():
            raise CloudflareDeployError(
                "wrangler CLI not installed. Install: npm install -g wrangler"
            )

        worker_name = self.get_worker_name()
        env_suffix = f" ({self.env})" if self.env else ""
        mode = "DRY RUN" if self.dry_run else "DEPLOY"

        print(f"\n{mode}: {worker_name}{env_suffix}")
        print(f"Project: {self.project_dir}\n")

        # Build and run command
        cmd = self.build_deploy_command()
        exit_code, stdout, stderr = self.run_command(cmd)

        # Output results
        if stdout:
            print(stdout)
        if stderr:
            print(stderr, file=sys.stderr)

        if exit_code == 0:
            status = "would be deployed" if self.dry_run else "deployed successfully"
            print(f"\n✓ Worker {status}")
            return True
        else:
            raise CloudflareDeployError("Deployment failed")


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Deploy Cloudflare Worker with wrangler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cloudflare-deploy.py
  python cloudflare-deploy.py --env production
  python cloudflare-deploy.py --project ./my-worker --env staging
  python cloudflare-deploy.py --dry-run
  python cloudflare-deploy.py --env prod --verbose
        """
    )

    parser.add_argument(
        "--project",
        type=str,
        default=".",
        help="Path to Worker project directory (default: current directory)"
    )

    parser.add_argument(
        "--env",
        type=str,
        choices=["production", "staging", "dev"],
        help="Environment to deploy to (production, staging, dev)"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview deployment without actually deploying"
    )

    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    try:
        deployer = CloudflareDeploy(
            project_dir=args.project,
            env=args.env,
            dry_run=args.dry_run,
            verbose=args.verbose
        )

        success = deployer.deploy()
        sys.exit(0 if success else 1)

    except CloudflareDeployError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nDeployment cancelled by user", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

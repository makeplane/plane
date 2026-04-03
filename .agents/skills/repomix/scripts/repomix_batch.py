#!/usr/bin/env python3
"""
Batch process multiple repositories using Repomix.

This script processes multiple repositories (local or remote) using the repomix CLI tool.
Supports configuration through environment variables loaded from multiple .env file locations.
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import argparse


@dataclass
class RepomixConfig:
    """Configuration for repomix execution."""
    style: str = "xml"
    output_dir: str = "repomix-output"
    remove_comments: bool = False
    include_pattern: Optional[str] = None
    ignore_pattern: Optional[str] = None
    no_security_check: bool = False
    verbose: bool = False


class EnvLoader:
    """Load environment variables from multiple .env file locations."""

    @staticmethod
    def load_env_files() -> Dict[str, str]:
        """
        Load environment variables from .env files in order of precedence.

        Order: process.env > skill/.env > skills/.env > .claude/.env

        Returns:
            Dictionary of environment variables
        """
        env_vars = {}
        script_dir = Path(__file__).parent.resolve()

        # Define search paths in reverse order (lowest to highest priority)
        search_paths = [
            script_dir.parent.parent.parent / ".env",  # .claude/.env
            script_dir.parent.parent / ".env",          # skills/.env
            script_dir.parent / ".env",                 # skill/.env (repomix/.env)
        ]

        # Load from files (lower priority first)
        for env_path in search_paths:
            if env_path.exists():
                env_vars.update(EnvLoader._parse_env_file(env_path))

        # Override with process environment (highest priority)
        env_vars.update(os.environ)

        return env_vars

    @staticmethod
    def _parse_env_file(path: Path) -> Dict[str, str]:
        """
        Parse a .env file and return key-value pairs.

        Args:
            path: Path to .env file

        Returns:
            Dictionary of environment variables
        """
        env_vars = {}
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    # Skip comments and empty lines
                    if not line or line.startswith('#'):
                        continue
                    # Parse KEY=VALUE
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        # Remove quotes if present
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        env_vars[key] = value
        except Exception as e:
            print(f"Warning: Failed to parse {path}: {e}", file=sys.stderr)

        return env_vars


class RepomixBatchProcessor:
    """Process multiple repositories with repomix."""

    def __init__(self, config: RepomixConfig):
        """
        Initialize batch processor.

        Args:
            config: Repomix configuration
        """
        self.config = config
        self.env_vars = EnvLoader.load_env_files()

    def check_repomix_installed(self) -> bool:
        """
        Check if repomix is installed and accessible.

        Returns:
            True if repomix is installed, False otherwise
        """
        try:
            result = subprocess.run(
                ["repomix", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
                env=self.env_vars
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    def process_repository(
        self,
        repo_path: str,
        output_name: Optional[str] = None,
        is_remote: bool = False
    ) -> Tuple[bool, str]:
        """
        Process a single repository with repomix.

        Args:
            repo_path: Path to local repository or remote repository URL
            output_name: Custom output filename (optional)
            is_remote: Whether repo_path is a remote URL

        Returns:
            Tuple of (success, message)
        """
        # Create output directory if it doesn't exist
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Determine output filename
        if output_name:
            output_file = output_dir / output_name
        else:
            if is_remote:
                # Extract repo name from URL
                repo_name = repo_path.rstrip('/').split('/')[-1]
            else:
                repo_name = Path(repo_path).name

            extension = self._get_extension(self.config.style)
            output_file = output_dir / f"{repo_name}-output.{extension}"

        # Build repomix command
        cmd = self._build_command(repo_path, output_file, is_remote)

        if self.config.verbose:
            print(f"Executing: {' '.join(cmd)}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                env=self.env_vars
            )

            if result.returncode == 0:
                return True, f"Successfully processed {repo_path} -> {output_file}"
            else:
                error_msg = result.stderr or result.stdout or "Unknown error"
                return False, f"Failed to process {repo_path}: {error_msg}"

        except subprocess.TimeoutExpired:
            return False, f"Timeout processing {repo_path} (exceeded 5 minutes)"
        except Exception as e:
            return False, f"Error processing {repo_path}: {str(e)}"

    def _build_command(
        self,
        repo_path: str,
        output_file: Path,
        is_remote: bool
    ) -> List[str]:
        """
        Build repomix command with configuration options.

        Args:
            repo_path: Path to repository
            output_file: Output file path
            is_remote: Whether this is a remote repository

        Returns:
            Command as list of strings
        """
        cmd = ["npx" if is_remote else "repomix"]

        if is_remote:
            cmd.extend(["repomix", "--remote", repo_path])
        else:
            cmd.append(repo_path)

        # Add configuration options
        cmd.extend(["--style", self.config.style])
        cmd.extend(["-o", str(output_file)])

        if self.config.remove_comments:
            cmd.append("--remove-comments")

        if self.config.include_pattern:
            cmd.extend(["--include", self.config.include_pattern])

        if self.config.ignore_pattern:
            cmd.extend(["-i", self.config.ignore_pattern])

        if self.config.no_security_check:
            cmd.append("--no-security-check")

        if self.config.verbose:
            cmd.append("--verbose")

        return cmd

    @staticmethod
    def _get_extension(style: str) -> str:
        """
        Get file extension for output style.

        Args:
            style: Output style (xml, markdown, json, plain)

        Returns:
            File extension
        """
        extensions = {
            "xml": "xml",
            "markdown": "md",
            "json": "json",
            "plain": "txt"
        }
        return extensions.get(style, "xml")

    def process_batch(
        self,
        repositories: List[Dict[str, str]]
    ) -> Dict[str, List[str]]:
        """
        Process multiple repositories.

        Args:
            repositories: List of repository configurations
                Each dict should contain:
                - 'path': Repository path or URL
                - 'output': Optional output filename
                - 'remote': Optional boolean for remote repos

        Returns:
            Dictionary with 'success' and 'failed' lists
        """
        results = {"success": [], "failed": []}

        for repo in repositories:
            repo_path = repo.get("path")
            if not repo_path:
                results["failed"].append("Missing 'path' in repository config")
                continue

            output_name = repo.get("output")
            is_remote = repo.get("remote", False)

            success, message = self.process_repository(
                repo_path,
                output_name,
                is_remote
            )

            if success:
                results["success"].append(message)
            else:
                results["failed"].append(message)

            print(message)

        return results


def load_repositories_from_file(file_path: str) -> List[Dict[str, str]]:
    """
    Load repository configurations from JSON file.

    Expected format:
    [
        {"path": "/path/to/repo", "output": "custom.xml"},
        {"path": "owner/repo", "remote": true},
        ...
    ]

    Args:
        file_path: Path to JSON file

    Returns:
        List of repository configurations
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            else:
                print(f"Error: Expected array in {file_path}", file=sys.stderr)
                return []
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Error: Failed to read {file_path}: {e}", file=sys.stderr)
        return []


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Batch process multiple repositories with repomix"
    )

    # Input options
    parser.add_argument(
        "repos",
        nargs="*",
        help="Repository paths or URLs to process"
    )
    parser.add_argument(
        "-f", "--file",
        help="JSON file containing repository configurations"
    )

    # Output options
    parser.add_argument(
        "--style",
        choices=["xml", "markdown", "json", "plain"],
        default="xml",
        help="Output format (default: xml)"
    )
    parser.add_argument(
        "-o", "--output-dir",
        default="repomix-output",
        help="Output directory (default: repomix-output)"
    )

    # Processing options
    parser.add_argument(
        "--remove-comments",
        action="store_true",
        help="Remove comments from source files"
    )
    parser.add_argument(
        "--include",
        help="Include pattern (glob)"
    )
    parser.add_argument(
        "--ignore",
        help="Ignore pattern (glob)"
    )
    parser.add_argument(
        "--no-security-check",
        action="store_true",
        help="Disable security checks"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--remote",
        action="store_true",
        help="Treat all repos as remote URLs"
    )

    args = parser.parse_args()

    # Create configuration
    config = RepomixConfig(
        style=args.style,
        output_dir=args.output_dir,
        remove_comments=args.remove_comments,
        include_pattern=args.include,
        ignore_pattern=args.ignore,
        no_security_check=args.no_security_check,
        verbose=args.verbose
    )

    # Initialize processor
    processor = RepomixBatchProcessor(config)

    # Check if repomix is installed
    if not processor.check_repomix_installed():
        print("Error: repomix is not installed or not in PATH", file=sys.stderr)
        print("Install with: npm install -g repomix", file=sys.stderr)
        return 1

    # Collect repositories to process
    repositories = []

    # Load from file if specified
    if args.file:
        repositories.extend(load_repositories_from_file(args.file))

    # Add command line repositories
    if args.repos:
        for repo_path in args.repos:
            repositories.append({
                "path": repo_path,
                "remote": args.remote
            })

    # Validate we have repositories to process
    if not repositories:
        print("Error: No repositories specified", file=sys.stderr)
        print("Use: repomix_batch.py <repo1> <repo2> ...", file=sys.stderr)
        print("Or: repomix_batch.py -f repos.json", file=sys.stderr)
        return 1

    # Process batch
    print(f"Processing {len(repositories)} repositories...")
    results = processor.process_batch(repositories)

    # Print summary
    print("\n" + "=" * 50)
    print(f"Success: {len(results['success'])}")
    print(f"Failed: {len(results['failed'])}")

    if results['failed']:
        print("\nFailed repositories:")
        for failure in results['failed']:
            print(f"  - {failure}")

    return 0 if not results['failed'] else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Better Auth Initialization Script

Interactive script to initialize Better Auth configuration.
Supports multiple databases, ORMs, and authentication methods.

.env loading order: process.env > skill/.env > skills/.env > .claude/.env
"""

import os
import sys
import json
import secrets
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class EnvConfig:
    """Environment configuration holder."""
    secret: str
    url: str
    database_url: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None


class BetterAuthInit:
    """Better Auth configuration initializer."""

    def __init__(self, project_root: Optional[Path] = None):
        """
        Initialize the Better Auth configuration tool.

        Args:
            project_root: Project root directory. Auto-detected if not provided.
        """
        self.project_root = project_root or self._find_project_root()
        self.env_config: Optional[EnvConfig] = None

    @staticmethod
    def _find_project_root() -> Path:
        """
        Find project root by looking for package.json.

        Returns:
            Path to project root.

        Raises:
            RuntimeError: If project root cannot be found.
        """
        current = Path.cwd()
        while current != current.parent:
            if (current / "package.json").exists():
                return current
            current = current.parent

        raise RuntimeError("Could not find project root (no package.json found)")

    def _load_env_files(self) -> Dict[str, str]:
        """
        Load environment variables from .env files in order.

        Loading order: process.env > skill/.env > skills/.env > .claude/.env

        Returns:
            Dictionary of environment variables.
        """
        env_vars = {}

        # Define search paths in reverse priority order
        skill_dir = Path(__file__).parent.parent
        env_paths = [
            self.project_root / ".claude" / ".env",
            self.project_root / ".claude" / "skills" / ".env",
            skill_dir / ".env",
        ]

        # Load from files (lowest priority first)
        for env_path in env_paths:
            if env_path.exists():
                env_vars.update(self._parse_env_file(env_path))

        # Override with process environment (highest priority)
        env_vars.update(os.environ)

        return env_vars

    @staticmethod
    def _parse_env_file(path: Path) -> Dict[str, str]:
        """
        Parse .env file into dictionary.

        Args:
            path: Path to .env file.

        Returns:
            Dictionary of key-value pairs.
        """
        env_vars = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        # Remove quotes if present
                        value = value.strip().strip('"').strip("'")
                        env_vars[key.strip()] = value
        except Exception as e:
            print(f"Warning: Could not parse {path}: {e}")

        return env_vars

    @staticmethod
    def generate_secret(length: int = 32) -> str:
        """
        Generate cryptographically secure random secret.

        Args:
            length: Length of secret in bytes.

        Returns:
            Hex-encoded secret string.
        """
        return secrets.token_hex(length)

    def prompt_database(self) -> Dict[str, Any]:
        """
        Prompt user for database configuration.

        Returns:
            Database configuration dictionary.
        """
        print("\nDatabase Configuration")
        print("=" * 50)
        print("1. Direct Connection (PostgreSQL/MySQL/SQLite)")
        print("2. Drizzle ORM")
        print("3. Prisma")
        print("4. Kysely")
        print("5. MongoDB")

        choice = input("\nSelect database option (1-5): ").strip()

        db_configs = {
            "1": self._prompt_direct_db,
            "2": self._prompt_drizzle,
            "3": self._prompt_prisma,
            "4": self._prompt_kysely,
            "5": self._prompt_mongodb,
        }

        handler = db_configs.get(choice)
        if not handler:
            print("Invalid choice. Defaulting to direct PostgreSQL.")
            return self._prompt_direct_db()

        return handler()

    def _prompt_direct_db(self) -> Dict[str, Any]:
        """Prompt for direct database connection."""
        print("\nDatabase Type:")
        print("1. PostgreSQL")
        print("2. MySQL")
        print("3. SQLite")

        db_type = input("Select (1-3): ").strip()

        if db_type == "3":
            db_path = input("SQLite file path [./dev.db]: ").strip() or "./dev.db"
            return {
                "type": "sqlite",
                "import": "import Database from 'better-sqlite3';",
                "config": f'database: new Database("{db_path}")'
            }
        elif db_type == "2":
            db_url = input("MySQL connection string: ").strip()
            return {
                "type": "mysql",
                "import": "import { createPool } from 'mysql2/promise';",
                "config": f"database: createPool({{ connectionString: process.env.DATABASE_URL }})",
                "env_var": ("DATABASE_URL", db_url)
            }
        else:
            db_url = input("PostgreSQL connection string: ").strip()
            return {
                "type": "postgresql",
                "import": "import { Pool } from 'pg';",
                "config": "database: new Pool({ connectionString: process.env.DATABASE_URL })",
                "env_var": ("DATABASE_URL", db_url)
            }

    def _prompt_drizzle(self) -> Dict[str, Any]:
        """Prompt for Drizzle ORM configuration."""
        print("\nDrizzle Provider:")
        print("1. PostgreSQL")
        print("2. MySQL")
        print("3. SQLite")

        provider = input("Select (1-3): ").strip()
        provider_map = {"1": "pg", "2": "mysql", "3": "sqlite"}
        provider_name = provider_map.get(provider, "pg")

        return {
            "type": "drizzle",
            "provider": provider_name,
            "import": "import { drizzleAdapter } from 'better-auth/adapters/drizzle';\nimport { db } from '@/db';",
            "config": f"database: drizzleAdapter(db, {{ provider: '{provider_name}' }})"
        }

    def _prompt_prisma(self) -> Dict[str, Any]:
        """Prompt for Prisma configuration."""
        print("\nPrisma Provider:")
        print("1. PostgreSQL")
        print("2. MySQL")
        print("3. SQLite")

        provider = input("Select (1-3): ").strip()
        provider_map = {"1": "postgresql", "2": "mysql", "3": "sqlite"}
        provider_name = provider_map.get(provider, "postgresql")

        return {
            "type": "prisma",
            "provider": provider_name,
            "import": "import { prismaAdapter } from 'better-auth/adapters/prisma';\nimport { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();",
            "config": f"database: prismaAdapter(prisma, {{ provider: '{provider_name}' }})"
        }

    def _prompt_kysely(self) -> Dict[str, Any]:
        """Prompt for Kysely configuration."""
        return {
            "type": "kysely",
            "import": "import { kyselyAdapter } from 'better-auth/adapters/kysely';\nimport { db } from '@/db';",
            "config": "database: kyselyAdapter(db, { provider: 'pg' })"
        }

    def _prompt_mongodb(self) -> Dict[str, Any]:
        """Prompt for MongoDB configuration."""
        mongo_uri = input("MongoDB connection string: ").strip()
        db_name = input("Database name: ").strip()

        return {
            "type": "mongodb",
            "import": "import { mongodbAdapter } from 'better-auth/adapters/mongodb';\nimport { client } from '@/db';",
            "config": f"database: mongodbAdapter(client, {{ databaseName: '{db_name}' }})",
            "env_var": ("MONGODB_URI", mongo_uri)
        }

    def prompt_auth_methods(self) -> List[str]:
        """
        Prompt user for authentication methods.

        Returns:
            List of selected auth method codes.
        """
        print("\nAuthentication Methods")
        print("=" * 50)
        print("Select authentication methods (space-separated, e.g., '1 2 3'):")
        print("1. Email/Password")
        print("2. GitHub OAuth")
        print("3. Google OAuth")
        print("4. Discord OAuth")
        print("5. Two-Factor Authentication (2FA)")
        print("6. Passkeys (WebAuthn)")
        print("7. Magic Link")
        print("8. Username")

        choices = input("\nYour selection: ").strip().split()
        return [c for c in choices if c in "12345678"]

    def generate_auth_config(
        self,
        db_config: Dict[str, Any],
        auth_methods: List[str],
    ) -> str:
        """
        Generate auth.ts configuration file content.

        Args:
            db_config: Database configuration.
            auth_methods: Selected authentication methods.

        Returns:
            Generated TypeScript configuration code.
        """
        imports = ["import { betterAuth } from 'better-auth';"]
        plugins = []
        plugin_imports = []
        config_parts = []

        # Database import
        if db_config.get("import"):
            imports.append(db_config["import"])

        # Email/Password
        if "1" in auth_methods:
            config_parts.append("""  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  }""")

        # OAuth providers
        social_providers = []
        if "2" in auth_methods:
            social_providers.append("""    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }""")

        if "3" in auth_methods:
            social_providers.append("""    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }""")

        if "4" in auth_methods:
            social_providers.append("""    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }""")

        if social_providers:
            config_parts.append(f"  socialProviders: {{\n{',\\n'.join(social_providers)}\n  }}")

        # Plugins
        if "5" in auth_methods:
            plugin_imports.append("import { twoFactor } from 'better-auth/plugins';")
            plugins.append("twoFactor()")

        if "6" in auth_methods:
            plugin_imports.append("import { passkey } from 'better-auth/plugins';")
            plugins.append("passkey()")

        if "7" in auth_methods:
            plugin_imports.append("import { magicLink } from 'better-auth/plugins';")
            plugins.append("""magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: Implement email sending
        console.log(`Magic link for ${email}: ${url}`);
      }
    })""")

        if "8" in auth_methods:
            plugin_imports.append("import { username } from 'better-auth/plugins';")
            plugins.append("username()")

        # Combine all imports
        all_imports = imports + plugin_imports

        # Build config
        config_body = ",\n".join(config_parts)

        if plugins:
            plugins_str = ",\n    ".join(plugins)
            config_body += f",\n  plugins: [\n    {plugins_str}\n  ]"

        # Final output
        return f"""{chr(10).join(all_imports)}

export const auth = betterAuth({{
  {db_config["config"]},
{config_body}
}});
"""

    def generate_env_file(
        self,
        db_config: Dict[str, Any],
        auth_methods: List[str]
    ) -> str:
        """
        Generate .env file content.

        Args:
            db_config: Database configuration.
            auth_methods: Selected authentication methods.

        Returns:
            Generated .env file content.
        """
        env_vars = [
            f"BETTER_AUTH_SECRET={self.generate_secret()}",
            "BETTER_AUTH_URL=http://localhost:3000",
        ]

        # Database URL
        if db_config.get("env_var"):
            key, value = db_config["env_var"]
            env_vars.append(f"{key}={value}")

        # OAuth credentials
        if "2" in auth_methods:
            env_vars.extend([
                "GITHUB_CLIENT_ID=your_github_client_id",
                "GITHUB_CLIENT_SECRET=your_github_client_secret",
            ])

        if "3" in auth_methods:
            env_vars.extend([
                "GOOGLE_CLIENT_ID=your_google_client_id",
                "GOOGLE_CLIENT_SECRET=your_google_client_secret",
            ])

        if "4" in auth_methods:
            env_vars.extend([
                "DISCORD_CLIENT_ID=your_discord_client_id",
                "DISCORD_CLIENT_SECRET=your_discord_client_secret",
            ])

        return "\n".join(env_vars) + "\n"

    def run(self) -> None:
        """Run interactive initialization."""
        print("=" * 50)
        print("Better Auth Configuration Generator")
        print("=" * 50)

        # Load existing env
        env_vars = self._load_env_files()

        # Prompt for configuration
        db_config = self.prompt_database()
        auth_methods = self.prompt_auth_methods()

        # Generate files
        auth_config = self.generate_auth_config(db_config, auth_methods)
        env_content = self.generate_env_file(db_config, auth_methods)

        # Display output
        print("\n" + "=" * 50)
        print("Generated Configuration")
        print("=" * 50)

        print("\n--- auth.ts ---")
        print(auth_config)

        print("\n--- .env ---")
        print(env_content)

        # Offer to save
        save = input("\nSave configuration files? (y/N): ").strip().lower()
        if save == "y":
            self._save_files(auth_config, env_content)
        else:
            print("Configuration not saved.")

    def _save_files(self, auth_config: str, env_content: str) -> None:
        """
        Save generated configuration files.

        Args:
            auth_config: auth.ts content.
            env_content: .env content.
        """
        # Save auth.ts
        auth_locations = [
            self.project_root / "lib" / "auth.ts",
            self.project_root / "src" / "lib" / "auth.ts",
            self.project_root / "utils" / "auth.ts",
            self.project_root / "auth.ts",
        ]

        print("\nWhere to save auth.ts?")
        for i, loc in enumerate(auth_locations, 1):
            print(f"{i}. {loc}")
        print("5. Custom path")

        choice = input("Select (1-5): ").strip()
        if choice == "5":
            custom_path = input("Enter path: ").strip()
            auth_path = Path(custom_path)
        else:
            idx = int(choice) - 1 if choice.isdigit() else 0
            auth_path = auth_locations[idx]

        auth_path.parent.mkdir(parents=True, exist_ok=True)
        auth_path.write_text(auth_config, encoding="utf-8")
        print(f"Saved: {auth_path}")

        # Save .env
        env_path = self.project_root / ".env"
        if env_path.exists():
            backup = self.project_root / ".env.backup"
            env_path.rename(backup)
            print(f"Backed up existing .env to {backup}")

        env_path.write_text(env_content, encoding="utf-8")
        print(f"Saved: {env_path}")

        print("\nNext steps:")
        print("1. Run: npx @better-auth/cli generate")
        print("2. Apply database migrations")
        print("3. Mount API handler in your framework")
        print("4. Create client instance")


def main() -> int:
    """
    Main entry point.

    Returns:
        Exit code (0 for success, 1 for error).
    """
    try:
        initializer = BetterAuthInit()
        initializer.run()
        return 0
    except KeyboardInterrupt:
        print("\n\nOperation cancelled.")
        return 1
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

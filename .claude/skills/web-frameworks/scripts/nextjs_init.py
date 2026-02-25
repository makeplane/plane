#!/usr/bin/env python3
"""
Next.js Project Initialization Script

Initialize new Next.js project with best practices, TypeScript, and optimized configuration.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional


class NextJSInitializer:
    """Initialize Next.js project with best practices."""

    def __init__(
        self,
        name: str,
        directory: Optional[Path] = None,
        typescript: bool = True,
        app_router: bool = True,
        src_dir: bool = False,
        tailwind: bool = False,
        eslint: bool = True,
        import_alias: str = "@/*",
    ):
        """
        Initialize NextJSInitializer.

        Args:
            name: Project name
            directory: Target directory (default: current directory / name)
            typescript: Enable TypeScript
            app_router: Use App Router (recommended)
            src_dir: Use src/ directory
            tailwind: Include Tailwind CSS
            eslint: Include ESLint
            import_alias: Import alias pattern
        """
        self.name = name
        self.directory = directory or Path.cwd() / name
        self.typescript = typescript
        self.app_router = app_router
        self.src_dir = src_dir
        self.tailwind = tailwind
        self.eslint = eslint
        self.import_alias = import_alias

    def validate_name(self) -> None:
        """Validate project name."""
        if not self.name:
            raise ValueError("Project name cannot be empty")

        if not self.name.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Project name can only contain letters, numbers, hyphens, and underscores"
            )

        if self.name[0].isdigit():
            raise ValueError("Project name cannot start with a number")

    def check_directory(self) -> None:
        """Check if target directory exists."""
        if self.directory.exists():
            raise FileExistsError(f"Directory '{self.directory}' already exists")

    def create_directory_structure(self) -> None:
        """Create project directory structure."""
        print(f"Creating directory structure in {self.directory}...")

        # Create base directories
        self.directory.mkdir(parents=True, exist_ok=True)

        # Determine app/pages directory location
        base_dir = self.directory / "src" if self.src_dir else self.directory

        if self.app_router:
            app_dir = base_dir / "app"
            app_dir.mkdir(parents=True, exist_ok=True)
            (app_dir / "favicon.ico").touch()
            self._create_app_router_files(app_dir)
        else:
            pages_dir = base_dir / "pages"
            pages_dir.mkdir(parents=True, exist_ok=True)
            self._create_pages_router_files(pages_dir)

        # Create additional directories
        (self.directory / "public").mkdir(exist_ok=True)
        (base_dir / "components").mkdir(parents=True, exist_ok=True)
        (base_dir / "lib").mkdir(parents=True, exist_ok=True)

    def _create_app_router_files(self, app_dir: Path) -> None:
        """Create App Router files."""
        ext = "tsx" if self.typescript else "jsx"

        # Create layout
        layout_content = self._get_layout_content()
        (app_dir / f"layout.{ext}").write_text(layout_content, encoding='utf-8')

        # Create page
        page_content = self._get_page_content()
        (app_dir / f"page.{ext}").write_text(page_content, encoding='utf-8')

        # Create global styles
        if self.tailwind:
            globals_content = self._get_tailwind_globals()
        else:
            globals_content = self._get_basic_globals()
        (app_dir / "globals.css").write_text(globals_content, encoding='utf-8')

    def _create_pages_router_files(self, pages_dir: Path) -> None:
        """Create Pages Router files."""
        ext = "tsx" if self.typescript else "jsx"

        # Create _app
        app_content = self._get_app_content()
        (pages_dir / f"_app.{ext}").write_text(app_content, encoding='utf-8')

        # Create index
        index_content = self._get_index_content()
        (pages_dir / f"index.{ext}").write_text(index_content, encoding='utf-8')

    def create_config_files(self) -> None:
        """Create configuration files."""
        print("Creating configuration files...")

        # package.json
        package_json = self._get_package_json()
        (self.directory / "package.json").write_text(
            json.dumps(package_json, indent=2), encoding='utf-8'
        )

        # next.config.js
        next_config = self._get_next_config()
        (self.directory / "next.config.js").write_text(next_config, encoding='utf-8')

        # tsconfig.json
        if self.typescript:
            tsconfig = self._get_tsconfig()
            (self.directory / "tsconfig.json").write_text(
                json.dumps(tsconfig, indent=2), encoding='utf-8'
            )

        # .eslintrc.json
        if self.eslint:
            eslint_config = self._get_eslint_config()
            (self.directory / ".eslintrc.json").write_text(
                json.dumps(eslint_config, indent=2), encoding='utf-8'
            )

        # tailwind.config
        if self.tailwind:
            tailwind_config = self._get_tailwind_config()
            ext = "ts" if self.typescript else "js"
            (self.directory / f"tailwind.config.{ext}").write_text(tailwind_config, encoding='utf-8')

            postcss_config = self._get_postcss_config()
            (self.directory / "postcss.config.js").write_text(postcss_config, encoding='utf-8')

        # .gitignore
        gitignore = self._get_gitignore()
        (self.directory / ".gitignore").write_text(gitignore, encoding='utf-8')

        # README.md
        readme = self._get_readme()
        (self.directory / "README.md").write_text(readme, encoding='utf-8')

    def _get_package_json(self) -> dict:
        """Generate package.json content."""
        dependencies = {
            "next": "latest",
            "react": "latest",
            "react-dom": "latest",
        }

        dev_dependencies = {}

        if self.typescript:
            dev_dependencies.update(
                {
                    "typescript": "^5.0.0",
                    "@types/node": "^20.0.0",
                    "@types/react": "^18.0.0",
                    "@types/react-dom": "^18.0.0",
                }
            )

        if self.eslint:
            dev_dependencies["eslint"] = "^8.0.0"
            dev_dependencies["eslint-config-next"] = "latest"

        if self.tailwind:
            dependencies["tailwindcss"] = "^3.3.0"
            dependencies["autoprefixer"] = "^10.0.0"
            dependencies["postcss"] = "^8.0.0"

        return {
            "name": self.name,
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint" if self.eslint else None,
            },
            "dependencies": dependencies,
            "devDependencies": dev_dependencies,
        }

    def _get_layout_content(self) -> str:
        """Generate layout.tsx content."""
        import_css = (
            "import './globals.css'\n" if not self.tailwind else "import './globals.css'\n"
        )

        if self.typescript:
            return f"""{import_css}
export const metadata = {{
  title: '{self.name}',
  description: 'Generated by Next.js',
}}

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <html lang="en">
      <body>{{children}}</body>
    </html>
  )
}}
"""
        return f"""{import_css}
export const metadata = {{
  title: '{self.name}',
  description: 'Generated by Next.js',
}}

export default function RootLayout({{ children }}) {{
  return (
    <html lang="en">
      <body>{{children}}</body>
    </html>
  )
}}
"""

    def _get_page_content(self) -> str:
        """Generate page.tsx content."""
        return """export default function Home() {
  return (
    <main>
      <h1>Welcome to Next.js!</h1>
      <p>Get started by editing this page.</p>
    </main>
  )
}
"""

    def _get_next_config(self) -> str:
        """Generate next.config.js content."""
        return """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add your image domains here
    ],
  },
}

module.exports = nextConfig
"""

    def _get_tsconfig(self) -> dict:
        """Generate tsconfig.json content."""
        return {
            "compilerOptions": {
                "target": "ES2020",
                "lib": ["dom", "dom.iterable", "esnext"],
                "allowJs": True,
                "skipLibCheck": True,
                "strict": True,
                "noEmit": True,
                "esModuleInterop": True,
                "module": "esnext",
                "moduleResolution": "bundler",
                "resolveJsonModule": True,
                "isolatedModules": True,
                "jsx": "preserve",
                "incremental": True,
                "plugins": [{"name": "next"}],
                "paths": {self.import_alias: ["./*"]},
            },
            "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            "exclude": ["node_modules"],
        }

    def _get_eslint_config(self) -> dict:
        """Generate .eslintrc.json content."""
        return {"extends": "next/core-web-vitals"}

    def _get_tailwind_config(self) -> str:
        """Generate tailwind.config content."""
        if self.typescript:
            return """import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
"""
        return """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"""

    def _get_postcss_config(self) -> str:
        """Generate postcss.config.js content."""
        return """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""

    def _get_tailwind_globals(self) -> str:
        """Generate globals.css with Tailwind."""
        return """@tailwind base;
@tailwind components;
@tailwind utilities;
"""

    def _get_basic_globals(self) -> str:
        """Generate basic globals.css."""
        return """* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}
"""

    def _get_gitignore(self) -> str:
        """Generate .gitignore content."""
        return """# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
"""

    def _get_readme(self) -> str:
        """Generate README.md content."""
        return f"""# {self.name}

This is a [Next.js](https://nextjs.org/) project bootstrapped with next.js initialization script.

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
"""

    def _get_app_content(self) -> str:
        """Generate _app content for Pages Router."""
        return """export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
"""

    def _get_index_content(self) -> str:
        """Generate index content for Pages Router."""
        return """export default function Home() {
  return (
    <main>
      <h1>Welcome to Next.js!</h1>
      <p>Get started by editing this page.</p>
    </main>
  )
}
"""

    def initialize(self) -> None:
        """Run full initialization process."""
        try:
            print(f"Initializing Next.js project: {self.name}")
            print(f"TypeScript: {self.typescript}")
            print(f"App Router: {self.app_router}")
            print(f"Tailwind CSS: {self.tailwind}")
            print(f"ESLint: {self.eslint}")
            print()

            self.validate_name()
            self.check_directory()
            self.create_directory_structure()
            self.create_config_files()

            print()
            print(f"✓ Project initialized successfully!")
            print()
            print(f"Next steps:")
            print(f"  cd {self.name}")
            print(f"  npm install")
            print(f"  npm run dev")
            print()

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Initialize Next.js project with best practices"
    )
    parser.add_argument("name", help="Project name")
    parser.add_argument(
        "--directory", type=Path, help="Target directory (default: ./<name>)"
    )
    parser.add_argument(
        "--no-typescript", action="store_true", help="Disable TypeScript"
    )
    parser.add_argument(
        "--pages-router", action="store_true", help="Use Pages Router instead of App Router"
    )
    parser.add_argument("--src-dir", action="store_true", help="Use src/ directory")
    parser.add_argument("--tailwind", action="store_true", help="Include Tailwind CSS")
    parser.add_argument("--no-eslint", action="store_true", help="Disable ESLint")
    parser.add_argument(
        "--import-alias", default="@/*", help="Import alias pattern (default: @/*)"
    )

    args = parser.parse_args()

    initializer = NextJSInitializer(
        name=args.name,
        directory=args.directory,
        typescript=not args.no_typescript,
        app_router=not args.pages_router,
        src_dir=args.src_dir,
        tailwind=args.tailwind,
        eslint=not args.no_eslint,
        import_alias=args.import_alias,
    )

    initializer.initialize()


if __name__ == "__main__":
    main()

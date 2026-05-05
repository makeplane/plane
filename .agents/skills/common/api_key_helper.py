#!/usr/bin/env python3
"""
Common API Key Detection Helper for Gemini Skills

Supports both Google AI Studio and Vertex AI endpoints.

API Key Detection Order:
1. Process environment variable
2. Project root .env file
3. ./.claude/.env
4. ./.claude/skills/.env
5. Skill directory .env file

Vertex AI Configuration:
- GEMINI_USE_VERTEX: Set to "true" to use Vertex AI endpoint
- VERTEX_PROJECT_ID: GCP project ID (required for Vertex AI)
- VERTEX_LOCATION: GCP region (default: us-central1)
"""

import os
import re
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List


def find_api_key(skill_dir: Optional[Path] = None) -> Optional[str]:
    """
    Find GEMINI_API_KEY using 5-step lookup:
    1. Process environment
    2. Project root .env
    3. ./.claude/.env
    4. ./.claude/skills/.env
    5. Skill directory .env

    Args:
        skill_dir: Path to skill directory (optional, auto-detected if None)

    Returns:
        API key string or None if not found
    """
    # Step 1: Check process environment
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print("✓ Using API key from environment variable", file=sys.stderr)
        return api_key

    # Determine paths
    if skill_dir is None:
        skill_dir = Path(__file__).parent.parent
    project_dir = skill_dir.parent.parent.parent  # 3 levels up from skill dir

    # Step 2: Check project root .env
    project_env = project_dir / '.env'
    if project_env.exists():
        api_key = load_env_file(project_env)
        if api_key:
            print(f"✓ Using API key from {project_env}", file=sys.stderr)
            return api_key

    # Step 3: Check ./.claude/.env
    claude_env = project_dir / '.claude' / '.env'
    if claude_env.exists():
        api_key = load_env_file(claude_env)
        if api_key:
            print(f"✓ Using API key from {claude_env}", file=sys.stderr)
            return api_key

    # Step 4: Check ./.claude/skills/.env
    claude_skills_env = project_dir / '.claude' / 'skills' / '.env'
    if claude_skills_env.exists():
        api_key = load_env_file(claude_skills_env)
        if api_key:
            print(f"✓ Using API key from {claude_skills_env}", file=sys.stderr)
            return api_key

    # Step 5: Check skill directory .env
    skill_env = skill_dir / '.env'
    if skill_env.exists():
        api_key = load_env_file(skill_env)
        if api_key:
            print(f"✓ Using API key from {skill_env}", file=sys.stderr)
            return api_key

    return None


def load_env_file(env_path: Path) -> Optional[str]:
    """
    Load GEMINI_API_KEY from .env file

    Args:
        env_path: Path to .env file

    Returns:
        API key or None
    """
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GEMINI_API_KEY='):
                    # Extract value, removing quotes if present
                    value = line.split('=', 1)[1].strip()
                    value = value.strip('"').strip("'")
                    if value:
                        return value
    except Exception as e:
        print(f"Warning: Error reading {env_path}: {e}", file=sys.stderr)

    return None


def load_env_var(env_path: Path, var_name: str) -> Optional[str]:
    """
    Load a specific environment variable from .env file

    Args:
        env_path: Path to .env file
        var_name: Name of the environment variable

    Returns:
        Variable value or None
    """
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith(f'{var_name}='):
                    value = line.split('=', 1)[1].strip()
                    value = value.strip('"').strip("'")
                    if value:
                        return value
    except Exception as e:
        print(f"Warning: Error reading {env_path}: {e}", file=sys.stderr)

    return None


def find_env_var(var_name: str, skill_dir: Optional[Path] = None) -> Optional[str]:
    """
    Find environment variable using 5-step lookup (same as API key)

    Args:
        var_name: Name of environment variable
        skill_dir: Path to skill directory (optional)

    Returns:
        Variable value or None
    """
    # Step 1: Check process environment
    value = os.getenv(var_name)
    if value:
        return value

    # Determine paths
    if skill_dir is None:
        skill_dir = Path(__file__).parent.parent
    project_dir = skill_dir.parent.parent.parent

    # Step 2-5: Check .env files in order
    env_files = [
        project_dir / '.env',
        project_dir / '.claude' / '.env',
        project_dir / '.claude' / 'skills' / '.env',
        skill_dir / '.env'
    ]

    for env_path in env_files:
        if env_path.exists():
            value = load_env_var(env_path, var_name)
            if value:
                return value

    return None


def find_all_api_keys(skill_dir: Optional[Path] = None) -> List[str]:
    """
    Find all Gemini API keys for rotation.

    Searches for:
    - GEMINI_API_KEY (primary, required)
    - GEMINI_API_KEY_2, GEMINI_API_KEY_3, ... (additional, optional)

    Uses the same 5-step lookup as find_api_key().

    Args:
        skill_dir: Path to skill directory (optional, auto-detected if None)

    Returns:
        List of API keys (may be empty if none found)
    """
    keys: List[str] = []
    seen: set = set()  # Deduplicate keys

    # Determine paths
    if skill_dir is None:
        skill_dir = Path(__file__).parent.parent
    project_dir = skill_dir.parent.parent.parent

    # Collect all .env file paths in priority order
    env_files = [
        project_dir / '.env',
        project_dir / '.claude' / '.env',
        project_dir / '.claude' / 'skills' / '.env',
        skill_dir / '.env'
    ]

    def add_key(key: Optional[str]) -> None:
        """Add key if valid and not duplicate."""
        if key and key not in seen:
            seen.add(key)
            keys.append(key)

    # Step 1: Check process environment for all GEMINI_API_KEY* vars
    for env_key, value in os.environ.items():
        if env_key == 'GEMINI_API_KEY' or re.match(r'^GEMINI_API_KEY_\d+$', env_key):
            add_key(value)

    # Step 2-5: Check .env files
    for env_path in env_files:
        if not env_path.exists():
            continue

        # Load all GEMINI_API_KEY* from this file
        file_keys = _load_all_api_keys_from_file(env_path)
        for key in file_keys:
            add_key(key)

    return keys


def _load_all_api_keys_from_file(env_path: Path) -> List[str]:
    """
    Load all GEMINI_API_KEY* variables from an .env file.

    Args:
        env_path: Path to .env file

    Returns:
        List of API keys found in the file
    """
    keys: List[str] = []
    pattern = re.compile(r'^GEMINI_API_KEY(_\d+)?=(.+)$')

    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or not line:
                    continue

                match = pattern.match(line)
                if match:
                    value = match.group(2).strip()
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    if value and value != 'your_api_key_here':
                        keys.append(value)
    except Exception as e:
        print(f"Warning: Error reading {env_path}: {e}", file=sys.stderr)

    return keys


def get_key_rotator(skill_dir: Optional[Path] = None, verbose: bool = False):
    """
    Get a KeyRotator instance with all available API keys.

    Args:
        skill_dir: Path to skill directory (optional)
        verbose: Whether to enable verbose logging

    Returns:
        KeyRotator instance or None if no keys found
    """
    # Import here to avoid circular dependency
    from api_key_rotator import KeyRotator

    keys = find_all_api_keys(skill_dir)
    if not keys:
        return None

    return KeyRotator(keys=keys, verbose=verbose)


def get_vertex_config(skill_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Get Vertex AI configuration from environment variables

    Args:
        skill_dir: Path to skill directory (optional)

    Returns:
        Dictionary with Vertex AI configuration:
        {
            'use_vertex': bool,
            'project_id': str or None,
            'location': str (default: 'us-central1')
        }
    """
    use_vertex_str = find_env_var('GEMINI_USE_VERTEX', skill_dir)
    use_vertex = use_vertex_str and use_vertex_str.lower() in ('true', '1', 'yes')

    config = {
        'use_vertex': use_vertex,
        'project_id': find_env_var('VERTEX_PROJECT_ID', skill_dir) if use_vertex else None,
        'location': find_env_var('VERTEX_LOCATION', skill_dir) or 'us-central1'
    }

    return config


def get_api_key_or_exit(skill_dir: Optional[Path] = None) -> str:
    """
    Get API key or exit with helpful error message

    Args:
        skill_dir: Path to skill directory (optional, auto-detected if None)

    Returns:
        API key string
    """
    api_key = find_api_key(skill_dir)

    if not api_key:
        print("\n❌ Error: GEMINI_API_KEY not found!", file=sys.stderr)
        print("\n📋 Please set your API key using one of these methods (in priority order):", file=sys.stderr)

        if skill_dir is None:
            skill_dir = Path(__file__).parent.parent
        project_dir = skill_dir.parent.parent.parent

        print("\n1️⃣  Environment variable (recommended for development):", file=sys.stderr)
        print("   export GEMINI_API_KEY='your-api-key'", file=sys.stderr)

        print("\n2️⃣  Project root .env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.env", file=sys.stderr)

        print("\n3️⃣  .claude/.env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.claude/.env", file=sys.stderr)

        print("\n4️⃣  .claude/skills/.env file (shared across all Gemini skills):", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.claude/skills/.env", file=sys.stderr)

        print("\n5️⃣  Skill directory .env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {skill_dir}/.env", file=sys.stderr)

        print("\n🔑 Get your API key at: https://aistudio.google.com/apikey", file=sys.stderr)
        print("\n💡 Tip: Add .env files to .gitignore to avoid committing API keys", file=sys.stderr)
        sys.exit(1)

    return api_key


def get_client(skill_dir: Optional[Path] = None):
    """
    Get appropriate Gemini client (AI Studio or Vertex AI)

    Args:
        skill_dir: Path to skill directory (optional)

    Returns:
        genai.Client or vertexai client
    """
    vertex_config = get_vertex_config(skill_dir)

    if vertex_config['use_vertex']:
        # Use Vertex AI
        import vertexai
        from vertexai.generative_models import GenerativeModel

        if not vertex_config['project_id']:
            print("\n❌ Error: VERTEX_PROJECT_ID required when GEMINI_USE_VERTEX=true!", file=sys.stderr)
            print("\n📋 Set your GCP project ID:", file=sys.stderr)
            print("   export VERTEX_PROJECT_ID='your-project-id'", file=sys.stderr)
            print("   Or add to .env file: VERTEX_PROJECT_ID=your-project-id", file=sys.stderr)
            sys.exit(1)

        print(f"✓ Using Vertex AI endpoint", file=sys.stderr)
        print(f"  Project: {vertex_config['project_id']}", file=sys.stderr)
        print(f"  Location: {vertex_config['location']}", file=sys.stderr)

        vertexai.init(
            project=vertex_config['project_id'],
            location=vertex_config['location']
        )

        return {'type': 'vertex', 'config': vertex_config}
    else:
        # Use AI Studio
        from google import genai

        api_key = get_api_key_or_exit(skill_dir)
        client = genai.Client(api_key=api_key)

        return {'type': 'aistudio', 'client': client}


if __name__ == '__main__':
    # Test the API key detection
    api_key = get_api_key_or_exit()
    print(f"✓ Found API key: {api_key[:8]}..." + "*" * (len(api_key) - 8))

    # Test Vertex AI config
    vertex_config = get_vertex_config()
    if vertex_config['use_vertex']:
        print(f"\n✓ Vertex AI enabled:")
        print(f"  Project: {vertex_config['project_id']}")
        print(f"  Location: {vertex_config['location']}")

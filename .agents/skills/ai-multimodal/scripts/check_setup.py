#!/usr/bin/env python3
"""
Validate ai-multimodal skill setup and configuration.

Checks:
- API key presence and format
- Python dependencies
- Centralized resolver availability
- Directory structure
"""

import os
import sys
from pathlib import Path

# Fix Windows cp1252 encoding: Unicode symbols (✓, ⚠, ✗) can't encode on Windows.
# Reconfigure stdout to UTF-8 with replacement (Python 3.7+).
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(text):
    """Print section header."""
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")


def print_success(text):
    """Print success message."""
    print(f"{GREEN}✓ {text}{RESET}")


def print_warning(text):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{RESET}")


def print_error(text):
    """Print error message."""
    print(f"{RED}✗ {text}{RESET}")


def print_info(text):
    """Print info message."""
    print(f"{BLUE}ℹ {text}{RESET}")


def check_dependencies():
    """Check if required Python packages are installed."""
    print_header("Checking Python Dependencies")

    dependencies = {
        'google.genai': 'google-genai',
        'dotenv': 'python-dotenv',
        'PIL': 'pillow'
    }

    missing = []

    for module_name, package_name in dependencies.items():
        try:
            __import__(module_name)
            print_success(f"{package_name} is installed")
        except ImportError:
            print_error(f"{package_name} is NOT installed")
            missing.append(package_name)

    if missing:
        print_error("\nMissing dependencies detected!")
        print_info(f"Install with: pip install {' '.join(missing)}")
        return False

    return True


def check_centralized_resolver():
    """Check if centralized resolver is available."""
    print_header("Checking Centralized Resolver")

    claude_root = Path(__file__).parent.parent.parent.parent
    resolver_path = claude_root / 'scripts' / 'resolve_env.py'

    if resolver_path.exists():
        print_success(f"Centralized resolver found: {resolver_path}")

        # Try to import it
        sys.path.insert(0, str(resolver_path.parent))
        try:
            from resolve_env import resolve_env
            print_success("Centralized resolver can be imported")
            return True
        except ImportError as e:
            print_error(f"Centralized resolver exists but cannot be imported: {e}")
            return False
    else:
        print_warning(f"Centralized resolver not found: {resolver_path}")
        print_info("Skill will use fallback resolution logic")
        return True  # Not critical, fallback works


def find_api_key():
    """Find and validate API key using centralized resolver."""
    print_header("Checking API Key Configuration")

    # Try to use centralized resolver
    claude_root = Path(__file__).parent.parent.parent.parent
    sys.path.insert(0, str(claude_root / 'scripts'))
    try:
        from resolve_env import resolve_env

        print_info("Using centralized resolver...")
        api_key = resolve_env('GEMINI_API_KEY', skill='ai-multimodal')

        if api_key:
            print_success("API key found via centralized resolver")
            print_info(f"Key preview: {api_key[:20]}...{api_key[-4:]}")

            # Show hierarchy
            print_info("\nTo see where the key was found, run:")
            print_info("python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal --verbose")

            return api_key
        else:
            print_error("API key not found in any location")
            return None

    except ImportError:
        print_warning("Centralized resolver not available, using fallback")

        # Fallback: check environment
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            print_success("API key found in process.env")
            print_info(f"Key preview: {api_key[:20]}...{api_key[-4:]}")
            return api_key
        else:
            print_error("API key not found")
            return None


def validate_api_key_format(api_key):
    """Basic validation of API key format."""
    if not api_key:
        return False

    # Google AI Studio keys typically start with 'AIza'
    if api_key.startswith('AIza'):
        print_success("API key format looks valid (Google AI Studio)")
        return True
    elif len(api_key) > 20:
        print_warning("API key format not recognized (may be Vertex AI or custom)")
        return True
    else:
        print_error("API key format looks invalid (too short)")
        return False


def test_api_connection(api_key):
    """Test API connection with a simple request."""
    print_header("Testing API Connection")

    try:
        from google import genai

        print_info("Initializing Gemini client...")
        client = genai.Client(api_key=api_key)

        print_info("Fetching available models...")
        # List models to verify API key works
        models = list(client.models.list())

        print_success(f"API connection successful! Found {len(models)} available models")

        # Show some available models
        print_info("\nSample available models:")
        for model in models[:5]:
            print(f"  - {model.name}")

        return True

    except ImportError:
        print_error("google-genai package not installed")
        return False
    except Exception as e:
        print_error(f"API connection failed: {str(e)}")
        return False


def check_directory_structure():
    """Verify skill directory structure."""
    print_header("Checking Directory Structure")

    script_dir = Path(__file__).parent
    skill_dir = script_dir.parent

    required_files = [
        ('SKILL.md', skill_dir / 'SKILL.md'),
        ('.env.example', skill_dir / '.env.example'),
        ('gemini_batch_process.py', script_dir / 'gemini_batch_process.py'),
    ]

    all_exist = True

    for name, path in required_files:
        if path.exists():
            print_success(f"{name} exists")
        else:
            print_error(f"{name} NOT found at {path}")
            all_exist = False

    return all_exist


def provide_setup_instructions():
    """Provide setup instructions if configuration is incomplete."""
    print_header("Setup Instructions")

    print_info("To configure the ai-multimodal skill:")
    print("\n1. Get a Gemini API key:")
    print("   → Visit: https://aistudio.google.com/apikey")

    print("\n2. Configure the API key (choose one method):")

    print(f"\n   Option A: User global config (recommended)")
    print(f"   $ echo 'GEMINI_API_KEY=your-api-key-here' >> ~/.claude/.env")

    script_dir = Path(__file__).parent
    skill_dir = script_dir.parent

    print(f"\n   Option B: Skill-specific config")
    print(f"   $ cd {skill_dir}")
    print(f"   $ cp .env.example .env")
    print(f"   $ # Edit .env and add your API key")

    print(f"\n   Option C: Runtime environment (temporary)")
    print(f"   $ export GEMINI_API_KEY='your-api-key-here'")

    print("\n3. Verify setup:")
    print(f"   $ python {Path(__file__)}")

    print("\n4. Debug if needed:")
    print(f"   $ python ~/.claude/scripts/resolve_env.py --show-hierarchy --skill ai-multimodal")
    print(f"   $ python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal --verbose")


def main():
    """Run all setup checks."""
    print(f"\n{BOLD}AI Multimodal Skill - Setup Checker{RESET}")

    all_passed = True

    # Check directory structure
    if not check_directory_structure():
        all_passed = False

    # Check centralized resolver
    check_centralized_resolver()

    # Check dependencies
    if not check_dependencies():
        all_passed = False
        provide_setup_instructions()
        sys.exit(1)

    # Check API key
    api_key = find_api_key()

    if not api_key:
        print_error("\n❌ GEMINI_API_KEY not found in any location")
        all_passed = False
        provide_setup_instructions()
        sys.exit(1)

    # Validate API key format
    if not validate_api_key_format(api_key):
        all_passed = False

    # Test API connection
    if not test_api_connection(api_key):
        all_passed = False

    # Final summary
    print_header("Setup Summary")

    if all_passed:
        print_success("✅ All checks passed! The ai-multimodal skill is ready to use.")
        print_info("\nNext steps:")
        print("  • Read SKILL.md for usage examples")
        print("  • Try: python scripts/gemini_batch_process.py --help")
        print("\nImage generation models:")
        print("  • gemini-2.5-flash-image    - Nano Banana Flash (DEFAULT - fast)")
        print("  • imagen-4.0-generate-001   - Imagen 4 (alternative - production)")
        print("  • gemini-3-pro-image-preview - Nano Banana Pro (4K text, reasoning)")
        print("\nExample (uses default model):")
        print("  python scripts/gemini_batch_process.py --task generate \\")
        print("    --prompt 'A sunset over mountains' --aspect-ratio 16:9 --size 2K")
    else:
        print_error("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)


if __name__ == '__main__':
    main()

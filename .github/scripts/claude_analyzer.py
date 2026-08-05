#!/usr/bin/env python3
"""
Claude-powered code analyzer for GitHub PRs.
Analyzes code changes for performance, security, and quality issues.
"""

import os
import json
import sys
import fnmatch
from pathlib import Path
from anthropic import Anthropic

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

# Default configuration
DEFAULT_CONFIG = {
    'enabled_categories': [
        'Performance Issues',
        'Secret Scanning',
        'Security Issues',
        'Public Endpoints',
        'Dead Code'
    ],
    'exclude_patterns': [
        '*.min.js', '*.map', 'node_modules/**', 'dist/**', 
        'build/**', '*.lock', 'package-lock.json', 'yarn.lock'
    ],
    'limits': {
        'max_total_size': 100000,
        'max_file_size': 50000,
        'max_diff_size': 30000,
        'max_files': 10
    },
    'claude': {
        'model': 'claude-sonnet-4-20250514',
        'max_tokens': 4096,
        'temperature': 0.0
    },
    'cost_control': {
        'skip_if_pr_too_large': True,
        'max_changed_files': 50,
        'max_diff_lines': 5000
    }
}


def load_config():
    """Load configuration from file or use defaults."""
    config_path = Path(__file__).parent / 'claude_config.yml'
    
    if YAML_AVAILABLE and config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                # Merge with defaults
                for key, value in DEFAULT_CONFIG.items():
                    if key not in config:
                        config[key] = value
                return config
        except Exception as e:
            print(f"Warning: Could not load config file: {e}")
            return DEFAULT_CONFIG
    
    return DEFAULT_CONFIG

# Analysis prompts for different aspects
ANALYSIS_PROMPTS = {
    "Performance Issues": """
Analyze the following code changes for performance issues, specifically:
- N+1 query problems (database queries in loops)
- Inefficient database queries
- Missing indexes that could cause slow queries
- Unnecessary repeated computations
- Memory leaks or inefficient memory usage
- Blocking I/O operations

Be specific about file names and line numbers where issues are found.
If no issues are found, clearly state that.
""",
    
    "Secret Scanning": """
Scan the following code changes for potential secrets or sensitive information:
- API keys, tokens, or credentials
- Hardcoded passwords
- Private keys or certificates
- AWS/cloud provider credentials
- Database connection strings with credentials
- Any other sensitive information that shouldn't be committed

Be specific about what was found and where.
If no secrets are found, clearly state that.
""",
    
    "Security Issues": """
Analyze the following code changes for security vulnerabilities:
- SQL injection vulnerabilities
- Cross-site scripting (XSS) risks
- Authentication/authorization bypasses
- Insecure deserialization
- Path traversal vulnerabilities
- Command injection risks
- Insecure cryptographic practices
- Missing input validation
- CSRF vulnerabilities

Be specific about file names and the nature of each vulnerability.
If no security issues are found, clearly state that.
""",
    
    "Public Endpoints": """
Identify and analyze any new or modified public API endpoints:
- List all new or modified endpoints
- Check if they have proper authentication
- Verify authorization checks are in place
- Check for rate limiting
- Identify any endpoints that expose sensitive data
- Note any breaking changes to existing endpoints

Be specific about endpoint paths and any concerns.
If no new endpoints or issues are found, clearly state that.
""",
    
    "Dead Code": """
Identify potential dead code in these changes:
- Unused functions or methods
- Unused imports
- Unreachable code blocks
- Commented-out code that should be removed
- Unused variables or parameters
- Duplicate code that could be refactored

Be specific about what appears to be unused and where.
If no dead code is found, clearly state that.
"""
}


def read_file_safely(filepath):
    """Read file content safely, handling various encodings and binary files."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Skip binary files
        return None
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None


def get_changed_files_content(diff_content, max_size=100000):
    """
    Extract content from changed files based on diff.
    Limits total size to avoid token limits.
    """
    changed_files = []
    
    # Parse diff to get file names
    for line in diff_content.split('\n'):
        if line.startswith('diff --git'):
            # Extract filename from diff header
            parts = line.split()
            if len(parts) >= 4:
                filepath = parts[3].replace('b/', '')
                changed_files.append(filepath)
    
    # Read content of changed files
    files_content = {}
    total_size = 0
    
    for filepath in changed_files:
        if not os.path.exists(filepath):
            continue
            
        # Skip certain file types
        skip_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', 
                          '.tar', '.gz', '.ico', '.svg', '.woff', '.woff2', 
                          '.ttf', '.eot', '.mp4', '.webm'}
        if any(filepath.endswith(ext) for ext in skip_extensions):
            continue
        
        content = read_file_safely(filepath)
        if content is None:
            continue
            
        # Limit individual file size
        if len(content) > 50000:
            content = content[:50000] + "\n... (truncated)"
        
        total_size += len(content)
        if total_size > max_size:
            break
            
        files_content[filepath] = content
    
    return files_content


def analyze_with_claude(client, prompt, diff_content, files_content, config):
    """Send analysis request to Claude."""
    
    # Build context message
    context = f"""
# Code Changes (Diff)

```diff
{diff_content}
```

# Full File Contents

"""
    
    max_files = config['limits']['max_files']
    for filepath, content in list(files_content.items())[:max_files]:
        max_file_size = min(len(content), config['limits']['max_file_size'])
        file_content = content[:max_file_size]
        if len(content) > max_file_size:
            file_content += "\n... (truncated)"
        context += f"\n## File: {filepath}\n\n```\n{file_content}\n```\n\n"
    
    full_prompt = f"{prompt}\n\n{context}"
    
    try:
        message = client.messages.create(
            model=config['claude']['model'],
            max_tokens=config['claude']['max_tokens'],
            temperature=config['claude'].get('temperature', 0.0),
            messages=[
                {
                    "role": "user",
                    "content": full_prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        print(f"Error calling Claude API: {e}")
        return f"Error during analysis: {str(e)}"


def parse_analysis_result(response_text):
    """Parse Claude's response to extract key findings."""
    
    # Simple parsing - check if issues were found
    issues_found = not any(phrase in response_text.lower() for phrase in [
        "no issues found",
        "no security issues",
        "no secrets found",
        "no dead code",
        "no performance issues",
        "no new endpoints"
    ])
    
    # Extract bullet points or numbered items as details
    details = []
    for line in response_text.split('\n'):
        line = line.strip()
        if line.startswith('-') or line.startswith('*') or (len(line) > 0 and line[0].isdigit() and '. ' in line):
            details.append(line.lstrip('-*0123456789. '))
    
    return {
        "issues_found": issues_found,
        "summary": response_text[:500] + "..." if len(response_text) > 500 else response_text,
        "details": details[:10],  # Limit to 10 details
        "full_response": response_text
    }


def main():
    # Load configuration
    config = load_config()
    
    # Check for required environment variables
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        sys.exit(1)
    
    # Initialize Claude client
    client = Anthropic(api_key=api_key)
    
    # Read the diff
    diff_content = read_file_safely('changes.diff')
    if not diff_content:
        print("No changes to analyze")
        results = {category: {
            "issues_found": False,
            "summary": "No changes to analyze",
            "details": []
        } for category in config['enabled_categories']}
        
        with open('analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        return
    
    # Check cost control limits
    if config['cost_control']['skip_if_pr_too_large']:
        diff_lines = len(diff_content.split('\n'))
        if diff_lines > config['cost_control']['max_diff_lines']:
            print(f"⚠️  PR too large ({diff_lines} lines). Skipping analysis to control costs.")
            results = {category: {
                "issues_found": False,
                "summary": f"PR too large ({diff_lines} lines) - skipped to control costs. Consider breaking into smaller PRs.",
                "details": []
            } for category in config['enabled_categories']}
            
            with open('analysis_results.json', 'w') as f:
                json.dump(results, f, indent=2)
            return
    
    # Get content of changed files
    files_content = get_changed_files_content(
        diff_content, 
        max_size=config['limits']['max_total_size']
    )
    
    # Check file count limit
    if (config['cost_control']['skip_if_pr_too_large'] and 
        len(files_content) > config['cost_control']['max_changed_files']):
        print(f"⚠️  Too many files changed ({len(files_content)}). Skipping analysis.")
        results = {category: {
            "issues_found": False,
            "summary": f"Too many files changed ({len(files_content)}) - skipped to control costs.",
            "details": []
        } for category in config['enabled_categories']}
        
        with open('analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        return
    
    print(f"Analyzing {len(files_content)} changed files...")
    
    # Run each enabled analysis
    results = {}
    
    for category in config['enabled_categories']:
        if category not in ANALYSIS_PROMPTS:
            print(f"Warning: Unknown category '{category}', skipping")
            continue
            
        print(f"\nAnalyzing: {category}...")
        
        response = analyze_with_claude(
            client, 
            ANALYSIS_PROMPTS[category], 
            diff_content[:config['limits']['max_diff_size']], 
            files_content,
            config
        )
        results[category] = parse_analysis_result(response)
        
        print(f"✓ {category} analysis complete")
    
    # Save results
    with open('analysis_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n✅ All analyses complete!")
    
    # Also save detailed results for debugging
    with open('analysis_detailed.json', 'w') as f:
        json.dump(results, f, indent=2)


if __name__ == '__main__':
    main()

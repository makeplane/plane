#!/usr/bin/env python3
"""
API Key Rotator for Gemini Skills

Manages multiple API keys with automatic rotation on rate limit errors.
Supports cooldown tracking per key to avoid hammering rate-limited keys.

Usage:
    from api_key_rotator import KeyRotator

    rotator = KeyRotator(keys=['key1', 'key2', 'key3'])

    # Get current key
    key = rotator.get_key()

    # Mark key as rate-limited (triggers rotation)
    rotator.mark_rate_limited()

    # Get next available key
    key = rotator.get_key()
"""

import os
import sys
import time
from pathlib import Path
from typing import List, Optional, Dict


# Default cooldown period in seconds after a key is rate-limited
DEFAULT_COOLDOWN_SECONDS = 60


class KeyRotator:
    """
    Manages API key rotation with cooldown tracking.

    Keys are rotated when marked as rate-limited.
    Rate-limited keys enter a cooldown period before being reused.
    """

    def __init__(
        self,
        keys: List[str],
        cooldown_seconds: int = DEFAULT_COOLDOWN_SECONDS,
        verbose: bool = False
    ):
        """
        Initialize the key rotator.

        Args:
            keys: List of API keys to rotate through
            cooldown_seconds: Seconds to wait before reusing a rate-limited key
            verbose: Whether to print rotation events
        """
        if not keys:
            raise ValueError("At least one API key is required")

        self._keys = keys
        self._cooldown_seconds = cooldown_seconds
        self._verbose = verbose
        self._current_index = 0

        # Track cooldown end times per key (key index -> timestamp)
        self._cooldowns: Dict[int, float] = {}

        if verbose:
            print(f"✓ KeyRotator initialized with {len(keys)} key(s)", file=sys.stderr)

    @property
    def key_count(self) -> int:
        """Number of keys in the rotator."""
        return len(self._keys)

    @property
    def current_key_masked(self) -> str:
        """Current key with masking (first 8 chars + dots)."""
        key = self._keys[self._current_index]
        return f"{key[:8]}..." if len(key) > 8 else key

    def _is_on_cooldown(self, index: int) -> bool:
        """Check if a key is currently on cooldown."""
        if index not in self._cooldowns:
            return False
        now = time.time()
        if now >= self._cooldowns[index]:
            # Cleanup expired cooldown entry to prevent memory leak
            del self._cooldowns[index]
            return False
        return True

    def _find_available_key(self) -> Optional[int]:
        """Find the next available key that's not on cooldown."""
        # Try all keys starting from current
        for i in range(len(self._keys)):
            index = (self._current_index + i) % len(self._keys)
            if not self._is_on_cooldown(index):
                return index
        return None

    def get_key(self) -> Optional[str]:
        """
        Get the current available API key.

        Returns:
            API key string or None if all keys are on cooldown
        """
        available = self._find_available_key()
        if available is None:
            if self._verbose:
                print("⚠ All API keys are on cooldown", file=sys.stderr)
            return None

        if available != self._current_index:
            self._current_index = available
            if self._verbose:
                print(f"→ Switched to key #{available + 1}: {self.current_key_masked}", file=sys.stderr)

        return self._keys[self._current_index]

    def mark_rate_limited(self, error_msg: str = "") -> bool:
        """
        Mark current key as rate-limited and rotate to next.

        Args:
            error_msg: Optional error message for logging

        Returns:
            True if rotation succeeded, False if all keys exhausted
        """
        # Put current key on cooldown
        cooldown_until = time.time() + self._cooldown_seconds
        self._cooldowns[self._current_index] = cooldown_until

        if self._verbose:
            print(
                f"⚠ Key #{self._current_index + 1} rate-limited, "
                f"cooldown {self._cooldown_seconds}s",
                file=sys.stderr
            )
            if error_msg:
                # Truncate long error messages
                msg = error_msg[:100] + "..." if len(error_msg) > 100 else error_msg
                print(f"  Error: {msg}", file=sys.stderr)

        # Try to find next available key
        available = self._find_available_key()
        if available is None:
            return False

        self._current_index = available
        if self._verbose:
            print(f"→ Rotated to key #{available + 1}: {self.current_key_masked}", file=sys.stderr)

        return True

    def reset_cooldowns(self) -> None:
        """Clear all cooldowns (useful for testing)."""
        self._cooldowns.clear()
        if self._verbose:
            print("✓ All cooldowns cleared", file=sys.stderr)

    def get_status(self) -> Dict:
        """
        Get current rotator status.

        Returns:
            Dict with keys: total, current_index, on_cooldown, available
        """
        now = time.time()
        on_cooldown = sum(1 for cd in self._cooldowns.values() if now < cd)

        return {
            'total': len(self._keys),
            'current_index': self._current_index,
            'on_cooldown': on_cooldown,
            'available': len(self._keys) - on_cooldown
        }


def is_rate_limit_error(error: Exception) -> bool:
    """
    Check if an exception indicates a rate limit error.

    Detects:
    - RESOURCE_EXHAUSTED errors
    - 429 status codes
    - Quota exceeded messages

    Args:
        error: The exception to check

    Returns:
        True if this is a rate limit error
    """
    error_str = str(error).lower()

    rate_limit_indicators = [
        'resource_exhausted',
        'resourceexhausted',
        '429',
        'rate limit',
        'ratelimit',
        'quota exceeded',
        'quota_exceeded',
        'too many requests',
        'limit: 0',
    ]

    return any(indicator in error_str for indicator in rate_limit_indicators)


if __name__ == '__main__':
    # Demo/test the rotator
    print("=== KeyRotator Demo ===\n")

    # Create rotator with test keys
    test_keys = [
        "AIzaTest1_XXXXXXXXXXXXXXXXXXXXXXXX",
        "AIzaTest2_XXXXXXXXXXXXXXXXXXXXXXXX",
        "AIzaTest3_XXXXXXXXXXXXXXXXXXXXXXXX",
    ]

    rotator = KeyRotator(keys=test_keys, cooldown_seconds=5, verbose=True)

    print(f"\n1. Initial key: {rotator.current_key_masked}")
    print(f"   Status: {rotator.get_status()}")

    print("\n2. Simulating rate limit on key #1...")
    rotator.mark_rate_limited("RESOURCE_EXHAUSTED: quota exceeded")
    print(f"   Current key: {rotator.current_key_masked}")
    print(f"   Status: {rotator.get_status()}")

    print("\n3. Simulating rate limit on key #2...")
    rotator.mark_rate_limited("429 Too Many Requests")
    print(f"   Current key: {rotator.current_key_masked}")
    print(f"   Status: {rotator.get_status()}")

    print("\n4. Simulating rate limit on key #3...")
    success = rotator.mark_rate_limited("Rate limit exceeded")
    print(f"   Rotation succeeded: {success}")
    print(f"   Status: {rotator.get_status()}")

    print("\n5. Waiting for cooldown (5s)...")
    time.sleep(6)
    key = rotator.get_key()
    print(f"   Key after cooldown: {rotator.current_key_masked}")
    print(f"   Status: {rotator.get_status()}")

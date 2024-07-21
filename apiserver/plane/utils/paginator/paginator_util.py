# Python imports
from collections.abc import Sequence


MAX_LIMIT = 100


class BadPaginationError(Exception):
    pass


class Cursor:
    # The cursor value
    def __init__(self, value, offset=0, is_prev=False, has_results=None):
        self.value = value
        self.offset = int(offset)
        self.is_prev = bool(is_prev)
        self.has_results = has_results

    # Return the cursor value in string format
    def __str__(self):
        return f"{self.value}:{self.offset}:{int(self.is_prev)}"

    # Return the cursor value
    def __eq__(self, other):
        return all(
            getattr(self, attr) == getattr(other, attr)
            for attr in ("value", "offset", "is_prev", "has_results")
        )

    # Return the representation of the cursor
    def __repr__(self):
        return f"{type(self).__name__,}: value={self.value} offset={self.offset}, is_prev={int(self.is_prev)}"

    # Return if the cursor is true
    def __bool__(self):
        return bool(self.has_results)

    @classmethod
    def from_string(cls, value):
        """Return the cursor value from string format"""
        try:
            bits = value.split(":")
            if len(bits) != 3:
                raise ValueError(
                    "Cursor must be in the format 'value:offset:is_prev'"
                )

            value = float(bits[0]) if "." in bits[0] else int(bits[0])
            return cls(value, int(bits[1]), bool(int(bits[2])))
        except (TypeError, ValueError) as e:
            raise ValueError(f"Invalid cursor format: {e}")


class CursorResult(Sequence):
    def __init__(self, results, next, prev, hits=None, max_hits=None):
        self.results = results
        self.next = next
        self.prev = prev
        self.hits = hits
        self.max_hits = max_hits

    def __len__(self):
        # Return the length of the results
        return len(self.results)

    def __iter__(self):
        # Return the iterator of the results
        return iter(self.results)

    def __getitem__(self, key):
        # Return the results based on the key
        return self.results[key]

    def __repr__(self):
        # Return the representation of the results
        return f"<{type(self).__name__}: results={len(self.results)}>"

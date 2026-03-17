# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Lexer for tokenising formula strings.
"""

from .tokens import Token, TokenType


class LexerError(Exception):
    def __init__(self, message: str, pos: int):
        super().__init__(f"{message} (at position {pos})")
        self.pos = pos


FUNCTION_NAMES = {
    "IF",
    "ROUND",
    "ABS",
    "UPPER",
    "LOWER",
    "LEN",
    "CONCAT",
    "TODAY",
    "NOW",
}

BOOLEAN_LITERALS = {"TRUE": True, "FALSE": False}


class Lexer:
    """
    Tokenises a formula string.

    Field names MUST be wrapped in double curly braces:
        {{field_name}}
        {{start_date}}
        {{wi_cp_5c015e36-011f-4c2f-9633-a0df16900e93}}
        {{Selling Price}}

    Everything inside {{ }} is the raw field name — no restrictions.
    Normalisation (case/underscore) happens in the engine/validator/executor,
    NOT here. The lexer emits whatever is inside the braces verbatim.

    Bare words outside {{ }} are only valid as function names or booleans:
        IF, ROUND, UPPER, TODAY, TRUE, FALSE ...
    """

    def __init__(self, text: str, known_fields: set = None):
        # known_fields kept for backward compat only — not used with {{}} syntax
        self.text = text
        self.pos = 0

    def error(self, msg: str):
        raise LexerError(msg, self.pos)

    def peek(self, offset: int = 0) -> str | None:
        idx = self.pos + offset
        return self.text[idx] if idx < len(self.text) else None

    def advance(self) -> str:
        ch = self.text[self.pos]
        self.pos += 1
        return ch

    def skip_whitespace(self):
        while self.peek() and self.peek().isspace():
            self.advance()

    def read_number(self) -> int | float:
        start = self.pos
        while self.peek() and (self.peek().isdigit() or self.peek() == "."):
            self.advance()
        raw = self.text[start : self.pos]
        return float(raw) if "." in raw else int(raw)

    def read_string(self) -> str:
        """Reads "quoted string" or 'quoted string' → returns content without quotes."""
        quote = self.advance()  # consume opening " or '
        start = self.pos
        while self.peek() and self.peek() != quote:
            self.advance()
        if self.peek() is None:
            self.error("Unterminated string literal")
        value = self.text[start : self.pos]
        self.advance()  # consume closing quote
        return value

    def read_field(self) -> str:
        """
        Reads {{field_name}} → returns raw content between the braces.
        Called when we have just seen the first '{'.
        Works with any content: UUIDs, spaces, hyphens, anything.
        """

        self.advance()  # first  {
        if self.peek() != "{":
            self.error("Expected '{{' to open a field reference")
        self.advance()  # second {

        start = self.pos
        while self.pos < len(self.text):
            if self.peek() == "}" and self.peek(1) == "}":
                break
            self.advance()

        if self.pos >= len(self.text):
            self.error("Unclosed field reference — missing '}}'")

        raw = self.text[start : self.pos].strip()
        self.advance()  # first  }
        self.advance()  # second }

        if not raw:
            self.error("Empty field reference '{{}}' — field name cannot be blank")

        return raw  # returned as-is; normalisation done downstream

    def read_word(self) -> str:
        start = self.pos
        while self.peek() and (self.peek().isalnum() or self.peek() == "_"):
            self.advance()
        return self.text[start : self.pos]

    def read_keyword(self) -> tuple[TokenType, any]:
        """Bare words are only valid as function names or booleans."""
        word = self.read_word()
        if not word:
            self.error(f"Unexpected character: {self.peek()!r}")

        upper = word.upper()

        if upper in FUNCTION_NAMES:
            return TokenType.FUNCTION, upper

        if upper in BOOLEAN_LITERALS:
            return TokenType.BOOLEAN, BOOLEAN_LITERALS[upper]

        self.error(f"Unknown keyword '{word}'. Did you mean to wrap it as a field? Use {{{{ {word} }}}}")

    def tokenize(self) -> list[Token]:
        tokens = []

        SIMPLE = {
            "+": TokenType.PLUS,
            "-": TokenType.MINUS,
            "*": TokenType.MULTIPLY,
            "/": TokenType.DIVIDE,
            "&": TokenType.AMPERSAND,
            "(": TokenType.LPAREN,
            ")": TokenType.RPAREN,
            ",": TokenType.COMMA,
            "=": TokenType.EQ,
        }

        while self.pos < len(self.text):
            self.skip_whitespace()
            if self.pos >= len(self.text):
                break

            start = self.pos
            ch = self.peek()

            if ch == "{":
                name = self.read_field()
                tokens.append(Token(TokenType.FIELD, name, start))

            elif ch == "!" and self.peek(1) == "=":
                self.pos += 2
                tokens.append(Token(TokenType.NEQ, "!=", start))
            elif ch == "<" and self.peek(1) == "=":
                self.pos += 2
                tokens.append(Token(TokenType.LTE, "<=", start))
            elif ch == ">" and self.peek(1) == "=":
                self.pos += 2
                tokens.append(Token(TokenType.GTE, ">=", start))
            elif ch == "<":
                self.advance()
                tokens.append(Token(TokenType.LT, "<", start))
            elif ch == ">":
                self.advance()
                tokens.append(Token(TokenType.GT, ">", start))

            elif ch in SIMPLE:
                self.advance()
                tokens.append(Token(SIMPLE[ch], ch, start))

            elif ch == '"' or ch == "'":
                value = self.read_string()
                tokens.append(Token(TokenType.STRING, value, start))

            elif ch.isdigit():
                value = self.read_number()
                tokens.append(Token(TokenType.NUMBER, value, start))

            elif ch.isalpha():
                tok_type, value = self.read_keyword()
                tokens.append(Token(tok_type, value, start))

            else:
                self.error(f"Unrecognised character: {ch!r}")

        tokens.append(Token(TokenType.EOF, None, self.pos))
        return tokens

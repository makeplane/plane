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

import re
from io import StringIO
from html.parser import HTMLParser

# Standard HTML block-level elements that produce line breaks in plain text.
_BLOCK_TAGS = frozenset(
    "address article aside blockquote br dd details dialog "
    "div dl dt fieldset figcaption figure footer form "
    "h1 h2 h3 h4 h5 h6 header hgroup hr li "
    "main nav ol p pre section table tbody td tfoot th "
    "thead tr ul".split()
)


class MLStripper(HTMLParser):
    """Markup Language Stripper"""

    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = StringIO()

    def handle_starttag(self, tag, attrs):
        if tag in _BLOCK_TAGS:
            self.text.write("\n")

    def handle_endtag(self, tag):
        if tag in _BLOCK_TAGS:
            self.text.write("\n")

    def handle_data(self, d):
        self.text.write(d)

    def get_data(self):
        return self.text.getvalue()


def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    text = s.get_data()
    # Collapse runs of blank lines into a single newline
    text = re.sub(r"\n[ \t]*\n+", "\n", text)
    return text.strip()

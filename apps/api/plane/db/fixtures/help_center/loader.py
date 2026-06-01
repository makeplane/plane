# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Content-as-code loader for the instance-global Help Center.

Source of truth = markdown files under this directory:
  categories.yaml                      -> category metadata (names/icon/color/order)
  <category-slug>/<article>.<loc>.md   -> one article translation (frontmatter + body)

Rendering pipeline (order matters):
  markdown -> HTML (mistune) -> sanitize_help_html -> THEN inject screenshot markers.

The sanitizer uses a STATIC allowlist that would strip an arbitrary `data-*`
attribute (and a relative `<img>` src), so the `{{screenshot:NAME}}` placeholder
is converted to its marker AFTER sanitizing. The reader renders stored HTML
without re-sanitizing, so the marker (and the image the screenshot step injects in
its place) survive. A God-Mode re-edit would re-sanitize and drop markers — by
design, seeded content is owned by code, not the authoring UI.
"""

import os
import re

import mistune
import yaml

from plane.app.serializers.help_center import sanitize_help_html
from plane.db.fixtures.help_center.transfer import revive_by_slug
from plane.db.models import HelpArticle, HelpCategory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORIES_FILE = os.path.join(BASE_DIR, "categories.yaml")
LOCALES = ("vi", "en", "ko")

_markdown = mistune.create_markdown(plugins=["table", "strikethrough"])
_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)
# A lone `{{screenshot:NAME}}` paragraph -> block marker; inline ones -> span marker.
_WRAPPED_TOKEN = re.compile(r"<p>\s*\{\{screenshot:([a-z0-9-]+)\}\}\s*</p>")
_INLINE_TOKEN = re.compile(r"\{\{screenshot:([a-z0-9-]+)\}\}")
# Matches any <code>…</code> or <pre>…</pre> span (possibly multiline) that must
# be protected from screenshot-marker substitution (literal documentation examples).
_CODE_REGION = re.compile(r"<(?:code|pre)\b[^>]*>.*?</(?:code|pre)>", re.DOTALL)


def parse_frontmatter(text):
    """Split a `--- yaml --- body` markdown file into (meta dict, body str)."""
    match = _FRONTMATTER.match(text)
    if not match:
        return {}, text
    return (yaml.safe_load(match.group(1)) or {}), match.group(2)


def _apply_screenshot_markers(html):
    """Run screenshot-token substitution while preserving <code>/<pre> regions.

    Strategy: extract all code/pre spans into a stash keyed by a non-ambiguous
    placeholder token, substitute markers only on the non-code segments, then
    restore the stashed spans. This guarantees that literal `{{screenshot:…}}`
    examples inside inline-code or fenced code blocks are never converted.
    """
    stash = {}

    def _stash(match):
        key = f"\x00CODE{len(stash)}\x00"
        stash[key] = match.group(0)
        return key

    # Mask all code/pre regions before substitution.
    masked = _CODE_REGION.sub(_stash, html)

    # Apply the two marker substitutions only on non-code text.
    masked = _WRAPPED_TOKEN.sub(r'<p data-help-screenshot="\1"></p>', masked)
    masked = _INLINE_TOKEN.sub(r'<span data-help-screenshot="\1"></span>', masked)

    # Restore the original code/pre regions verbatim.
    for key, original in stash.items():
        masked = masked.replace(key, original)

    return masked


def render_body(md_body):
    """markdown -> sanitized HTML -> post-sanitize screenshot markers."""
    html = sanitize_help_html(_markdown(md_body or ""))
    return _apply_screenshot_markers(html)


def locale_from_filename(filename):
    """`foo.vi.md` -> `vi` (None if not a recognised locale file)."""
    parts = filename.rsplit(".", 2)
    if len(parts) == 3 and parts[2] == "md" and parts[1] in LOCALES:
        return parts[1]
    return None


def load_categories():
    with open(CATEGORIES_FILE, encoding="utf-8") as handle:
        return yaml.safe_load(handle) or []


def _iter_article_files():
    """Yield (category_dir_name, file_path) for every `*.<locale>.md` article file."""
    for entry in sorted(os.scandir(BASE_DIR), key=lambda e: e.name):
        if not entry.is_dir() or entry.name.startswith((".", "_", "__")):
            continue
        for filename in sorted(os.listdir(entry.path)):
            if locale_from_filename(filename):
                yield entry.name, os.path.join(entry.path, filename)


def _upsert_category(entry):
    category = revive_by_slug(HelpCategory, entry["slug"])
    category.icon = entry.get("icon", "")
    category.color = entry.get("color", "")
    # Set sort_order on the UPDATE pass (object already saved), so the model's
    # add-time auto-sequencing does not override the explicit order from yaml.
    category.sort_order = entry.get("sort_order", category.sort_order)
    category.is_active = True
    category.save()
    for locale, name in (entry.get("names") or {}).items():
        row, _ = category.translations.get_or_create(locale=locale, defaults={"name": name})
        if row.name != name:
            row.name = name
            row.save()
    return category


def _collect_articles():
    """Group locale files by article slug into upsert records."""
    articles = {}
    for category_dir, path in _iter_article_files():
        with open(path, encoding="utf-8") as handle:
            meta, body = parse_frontmatter(handle.read())
        slug = meta.get("slug")
        locale = locale_from_filename(os.path.basename(path))
        if not slug or not locale:
            continue
        record = articles.setdefault(
            slug,
            {
                "category": meta.get("category", category_dir),
                "sort_order": meta.get("sort_order", 65535),
                "status": meta.get("status", "published"),
                "locales": {},
            },
        )
        record["locales"][locale] = (meta.get("title", slug), render_body(body))
    return articles


def seed_help_content():
    """Idempotently upsert all categories + articles + translations. Re-run is the
    source of truth: bodies are refreshed (not skipped). Returns a count dict."""
    counts = {"categories": 0, "articles": 0, "translations": 0}
    categories = {}
    for entry in load_categories():
        categories[entry["slug"]] = _upsert_category(entry)
        counts["categories"] += 1

    for slug, record in _collect_articles().items():
        article = revive_by_slug(HelpArticle, slug)
        article.category = categories.get(record["category"])
        article.sort_order = record["sort_order"]
        article.status = record["status"]
        article.save()
        counts["articles"] += 1
        for locale, (title, html) in record["locales"].items():
            row, _ = article.translations.get_or_create(
                locale=locale, defaults={"title": title, "description_html": html}
            )
            row.title = title
            row.description_html = html
            row.save()  # re-derive description_stripped + search_text
            counts["translations"] += 1
    return counts

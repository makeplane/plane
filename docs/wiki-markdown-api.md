# Wiki Markdown API input

The public service-token Wiki API accepts Markdown as a write input format through `description_markdown`.

## Contract

- `description_markdown` is write-only and mutually exclusive with `description_html` and `description_json`.
- API callers send the Markdown source unchanged. Callers do not pre-render it to HTML.
- Plane canonicalizes Markdown into the existing page `description_html` storage and sanitizes the generated HTML before persistence.
- Existing HTML/JSON write inputs remain available for compatibility.

Example:

```json
{
  "name": "Operations Runbook",
  "description_markdown": "# Operations Runbook\n\n- Check backups\n- Check alerts"
}
```

This endpoint is intended for automation, agents, and `plane-cli`; it does not change the existing page storage model.

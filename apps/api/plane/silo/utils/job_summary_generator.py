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

import json
from typing import List, Dict
from datetime import datetime
from plane.ee.models.job import ImportExecutionLog
from plane.silo.schema import ExecutionSummaryRecord


def generate_execution_summary_table(
    logs: List[ImportExecutionLog], excluded_entity_types: List[str] = None
) -> Dict[str, ExecutionSummaryRecord]:
    """
    Generates a summary table from execution logs.
    Aggregates metrics by entity_type.

    Args:
        logs: List of ImportExecutionLog entries
        excluded_entity_types: List of entity types to exclude from the summary
    """
    if excluded_entity_types is None:
        excluded_entity_types = []

    summary = {}

    for entry in logs:
        if entry.ignore_summarization:
            continue

        entity_type = entry.entity_type

        # Skip excluded entity types
        if entity_type in excluded_entity_types:
            continue

        if entity_type not in summary:
            summary[entity_type] = ExecutionSummaryRecord()

        # Check if metadata is of type INFO with metrics
        if entry.level == ImportExecutionLog.ImportExecutionLogLevel.INFO:
            metrics = entry.metrics
            if metrics:
                if "total" in metrics:
                    summary[entity_type].total = max(summary[entity_type].total, metrics["total"])
                if "pulled" in metrics:
                    summary[entity_type].pulled += metrics["pulled"]
                if "already_existed" in metrics:
                    summary[entity_type].already_existed += metrics["already_existed"]
                if "imported" in metrics:
                    summary[entity_type].created += metrics["imported"]
                if "errored" in metrics:
                    summary[entity_type].errors += metrics["errored"]

        # Count errors based on level field
        if entry.level == ImportExecutionLog.ImportExecutionLogLevel.ERROR:
            summary[entity_type].errors += 1

    # Calculate created as pulled - already_existed where we have that data
    for record_type in summary:
        record = summary[record_type]
        # If total is 0 but pulled is non-zero, set total equal to pulled
        if record.total == 0 and record.pulled > 0:
            record.total = record.pulled

        # Cap already_existed to total
        if record.already_existed > record.total:
            record.already_existed = record.total

        if record.created > record.pulled:
            record.pulled = record.created

        if record.created > record.total:
            record.total = record.created

    return summary


def generate_summary_html(data: List[ImportExecutionLog], summary: Dict[str, ExecutionSummaryRecord]) -> str:
    """
    Generates the HTML report for the execution summary.
    """
    record_types = sorted(summary.keys())

    # Calculate totals
    totals = {"total": 0, "pulled": 0, "created": 0, "already_existed": 0, "errors": 0}

    for record_type in record_types:
        record = summary[record_type]
        totals["total"] += record.total
        totals["pulled"] += record.pulled
        totals["created"] += record.created
        totals["already_existed"] += record.already_existed
        totals["errors"] += record.errors

    # Error sections for record types with errors
    error_record_types = [rt for rt in record_types if summary[rt].errors > 0]

    has_errors = totals["errors"] > 0
    has_fatal_errors = False

    for record_type in error_record_types:
        error_entries = [
            entry
            for entry in data
            if entry.entity_type == record_type and entry.level == ImportExecutionLog.ImportExecutionLogLevel.ERROR
        ]

        if any(entry.is_fatal for entry in error_entries):
            has_fatal_errors = True
            break

    def format_count(count):
        return count if count != 0 else "-"

    badge_class = "success"
    badge_text = "✅ All Operations Successful"

    if has_fatal_errors:
        badge_class = "error"
        badge_text = "❌ Fatal Errors Detected"
    elif has_errors:
        badge_class = "warning"
        badge_text = "⚠️ Issues Encountered"

    # Generate rows for summary table
    summary_rows_html = ""
    for record_type in record_types:
        record = summary[record_type]
        has_record_errors = record.errors > 0
        summary_rows_html += f"""
                <tr>
                  <td>{record_type}</td>
                  <td>{format_count(record.total)}</td>
                  <td>{format_count(record.pulled)}</td>
                  <td>{format_count(record.created)}</td>
                  <td>{format_count(record.already_existed)}</td>
                  <td class="{"error-cell" if has_record_errors else ""}">{format_count(record.errors)}</td>
                </tr>"""

    # Generate error sections
    error_sections_html = ""
    if error_record_types:
        error_sections_html += """
      <div class="divider"></div>

      <div class="section">
        <div class="section-title">
          <span>⚠️</span>
          <span>Error Analysis</span>
        </div>
"""
        for record_type in error_record_types:
            record = summary[record_type]
            error_entries = [
                entry
                for entry in data
                if entry.entity_type == record_type and entry.level == ImportExecutionLog.ImportExecutionLogLevel.ERROR
            ]

            fatal_errors = [e for e in error_entries if e.is_fatal]
            non_fatal_errors = [e for e in error_entries if not e.is_fatal]

            error_sections_html += f"""
          <div class="error-section">
            <div class="error-type-header">
              <div>
                <span>{record_type}</span>
              </div>
              <div class="error-count">
                {record.errors} Error{"s" if record.errors != 1 else ""}
              </div>
            </div>
"""
            # Fatal Errors Table
            if fatal_errors:
                error_sections_html += f"""
            <div class="error-callout fatal">
               <div class="error-callout-title fatal">
                 <span>🔴 FATAL ERRORS ({len(fatal_errors)})</span>
               </div>
               <div class="error-table-container">
                 <table class="error-table">
                   <thead>
                     <tr>
                       <th class="expand-cell"></th>
                       <th>Message</th>
                       <th class="compact">Status</th>
                       <th class="compact">Phase</th>
                     </tr>
                   </thead>
                  <tbody>
"""
                for index, entry in enumerate(fatal_errors):
                    error = entry.error
                    detail_id = f"fatal-detail-{record_type}-{index}"
                    error_message = error.get("message", "No message")
                    status_code = error.get("statusCode", "N/A")
                    # Python specific: converting entry to dict or accessing attributes
                    entity_name = entry.entity_name or "Unnamed"
                    phase = entry.phase or "Unknown"

                    error_sections_html += f"""
                      <tr class="error-row">
                        <td class="expand-cell">
                          <button
                            class="expand-btn"
                            onclick="toggleRow('{detail_id}', this)"
                            aria-label="Show details"
                            aria-expanded="false"
                          >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </td>
                        <td class="error-message">
                          <div
                            style="font-weight: 500; color: var(--error-fatal-text); margin-bottom: 0.125rem;"
                          >
                            {error_message}
                          </div>
                          <div style="font-size: 0.75rem; color: var(--text-tertiary);">{entity_name}</div>
                        </td>
                        <td class="compact">
                          <span
                            class="badge error"
                            style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
                          >
                            {status_code}
                          </span>
                        </td>
                        <td class="compact">
                          <span style="font-size: 0.8125rem; color: var(--text-secondary);">{phase}</span>
                        </td>
                      </tr>
                      <tr class="error-detail-row" id="{detail_id}">
                        <td class="error-detail-cell" colspan="4">
                          <div class="error-detail-card" style="border-left-color: var(--error-fatal-text);">
                            <div class="error-detail-grid">
                              <div class="error-detail-item">
                                <span class="error-detail-label">Error Message</span>
                                <span class="error-detail-value">{error_message}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Status Code</span>
                                <span class="error-detail-value">{status_code}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Phase</span>
                                <span class="error-detail-value">{phase}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Record Type</span>
                                <span class="error-detail-value">{entry.entity_type}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Is Fatal</span>
                                <span class="error-detail-value">{"Yes" if entry.is_fatal else "No"}</span>
                              </div>
"""
                    if entry.entity_name:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Name</span>
                                <span class="error-detail-value">{entry.entity_name}</span>
                              </div>"""
                    if entry.entity_plane_id:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Plane ID</span>
                                <span class="error-detail-value">{entry.entity_plane_id}</span>
                              </div>"""
                    if entry.entity_external_id:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">External ID</span>
                                <span class="error-detail-value">{entry.entity_external_id}</span>
                              </div>"""
                    if entry.related_entity:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Related Entity</span>
                                <span class="error-detail-value">{entry.related_entity}</span>
                              </div>"""
                    if entry.related_entity_type:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Related Entity Type</span>
                                <span class="error-detail-value">{entry.related_entity_type}</span>
                              </div>"""
                    if entry.already_exists is not None:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Already Exists</span>
                                <span class="error-detail-value">{"Yes" if entry.already_exists else "No"}</span>
                              </div>"""
                    if error.get("payload"):
                        payload_json = (
                            json.dumps(error["payload"], indent=2)
                            if isinstance(error["payload"], (dict, list))
                            else str(error["payload"])
                        )
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Payload</span>
                                <span class="error-detail-value code">{payload_json}</span>
                              </div>"""
                    if error.get("metadata"):
                        metadata_json = json.dumps(error["metadata"], indent=2)
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Error Metadata</span>
                                <span class="error-detail-value code">{metadata_json}</span>
                              </div>"""
                    if entry.additional_data:
                        additional_data_json = json.dumps(entry.additional_data, indent=2)
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Additional Data</span>
                                <span class="error-detail-value code">{additional_data_json}</span>
                              </div>"""

                    error_sections_html += """
                            </div>
                          </div>
                        </td>
                      </tr>"""

                error_sections_html += """
                  </tbody>
                </table>
              </div>
            </div>
"""

            # Non-Fatal Errors Table
            if non_fatal_errors:
                error_sections_html += f"""
            <div class="error-callout non-fatal">
               <div class="error-callout-title non-fatal">
                 <span>⚠️ NON-FATAL ERRORS ({len(non_fatal_errors)})</span>
               </div>
               <div class="error-table-container">
                 <table class="error-table">
                   <thead>
                     <tr>
                       <th class="expand-cell"></th>
                       <th>Message</th>
                       <th class="compact">Status</th>
                       <th class="compact">Phase</th>
                     </tr>
                   </thead>
                  <tbody>
"""
                for index, entry in enumerate(non_fatal_errors):
                    error = entry.error
                    detail_id = f"nonfatal-detail-{record_type}-{index}"
                    error_message = error.get("message", "No message")
                    status_code = error.get("statusCode", "N/A")
                    entity_name = entry.entity_name or "Unnamed"
                    phase = entry.phase or "Unknown"

                    error_sections_html += f"""
                      <tr class="error-row">
                        <td class="expand-cell">
                          <button
                            class="expand-btn"
                            onclick="toggleRow('{detail_id}', this)"
                            aria-label="Show details"
                            aria-expanded="false"
                          >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </td>
                        <td class="error-message">
                          <div
                            style="font-weight: 500; color: var(--error-nonfatal-text); margin-bottom: 0.125rem;"
                          >
                            {error_message}
                          </div>
                          <div style="font-size: 0.75rem; color: var(--text-tertiary);">{entity_name}</div>
                        </td>
                        <td class="compact">
                          <span
                            class="badge warning"
                            style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
                          >
                            {status_code}
                          </span>
                        </td>
                        <td class="compact">
                          <span style="font-size: 0.8125rem; color: var(--text-secondary);">{phase}</span>
                        </td>
                      </tr>
                      <tr class="error-detail-row" id="{detail_id}">
                        <td class="error-detail-cell" colspan="4">
                          <div class="error-detail-card" style="border-left-color: var(--error-nonfatal-text);">
                            <div class="error-detail-grid">
                              <div class="error-detail-item">
                                <span class="error-detail-label">Error Message</span>
                                <span class="error-detail-value">{error_message}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Status Code</span>
                                <span class="error-detail-value">{status_code}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Phase</span>
                                <span class="error-detail-value">{phase}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Record Type</span>
                                <span class="error-detail-value">{entry.entity_type}</span>
                              </div>
                              <div class="error-detail-item">
                                <span class="error-detail-label">Is Fatal</span>
                                <span class="error-detail-value">{"Yes" if entry.is_fatal else "No"}</span>
                              </div>
"""
                    if entry.entity_name:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Name</span>
                                <span class="error-detail-value">{entry.entity_name}</span>
                              </div>"""
                    if entry.entity_plane_id:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Plane ID</span>
                                <span class="error-detail-value">{entry.entity_plane_id}</span>
                              </div>"""
                    if entry.entity_external_id:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">External ID</span>
                                <span class="error-detail-value">{entry.entity_external_id}</span>
                              </div>"""
                    if entry.related_entity:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Related Entity</span>
                                <span class="error-detail-value">{entry.related_entity}</span>
                              </div>"""
                    if entry.related_entity_type:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Related Entity Type</span>
                                <span class="error-detail-value">{entry.related_entity_type}</span>
                              </div>"""
                    if entry.already_exists is not None:
                        error_sections_html += f"""
                              <div class="error-detail-item">
                                <span class="error-detail-label">Already Exists</span>
                                <span class="error-detail-value">{"Yes" if entry.already_exists else "No"}</span>
                              </div>"""
                    if error.get("payload"):
                        payload_json = (
                            json.dumps(error["payload"], indent=2)
                            if isinstance(error["payload"], (dict, list))
                            else str(error["payload"])
                        )
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Payload</span>
                                <span class="error-detail-value code">{payload_json}</span>
                              </div>"""
                    if error.get("metadata"):
                        metadata_json = json.dumps(error["metadata"], indent=2)
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Error Metadata</span>
                                <span class="error-detail-value code">{metadata_json}</span>
                              </div>"""
                    if entry.additional_data:
                        additional_data_json = json.dumps(entry.additional_data, indent=2)
                        error_sections_html += f"""
                              <div class="error-detail-item error-detail-value full-width">
                                <span class="error-detail-label">Additional Data</span>
                                <span class="error-detail-value code">{additional_data_json}</span>
                              </div>"""

                    error_sections_html += """
                            </div>
                          </div>
                        </td>
                      </tr>"""
                error_sections_html += """
                  </tbody>
                </table>
              </div>
            </div>
"""
            error_sections_html += """
          </div>"""

        error_sections_html += """
      </div>
"""

    current_date = datetime.now()
    formatted_date = current_date.strftime("%A, %B %d, %Y")
    formatted_time = current_date.strftime("%I:%M %p")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Import Analysis Report</title>
  <style>
    :root {{
      --background-primary: #ffffff;
      --background-secondary: #fafbfb;
      --background-accent: #f4f4f5;
      --border-color: #e5e7eb;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #64748b;
      --text-muted: #71717a;
      --error-fatal-bg: #fef2f2;
      --error-fatal-text: #dc2626;
      --error-nonfatal-bg: #fffbeb;
      --error-nonfatal-text: #b45309;
      --success-bg: #f0fdf4;
      --success-text: #16a34a;
      --warning-bg: #fffbeb;
      --warning-text: #b45309;
      --shadow-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      --shadow-elevated: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;
    }}

    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 3rem 2rem;
      margin: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }}

    .container {{
      background: var(--background-primary);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-elevated);
      overflow: hidden;
      border: 1px solid var(--border-color);
      max-width: 1015px;
      margin: 0 auto;
    }}

    .container {{
      background: var(--background-primary);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-elevated);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }}

    .header {{
      padding: 2.5rem 3rem;
      background: linear-gradient(135deg, #ffffff 0%, #fafbfb 100%);
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }}

    .header-content {{
      max-width: 900px;
      margin: 0 auto;
    }}

    .logo-section {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }}

    .branding {{
      display: flex;
      align-items: center;
      gap: 1rem;
    }}

   .brand-logo {{
      width: 90px;
      height: auto;
      display: block;
    }}

    .sync-indicator {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #dbeafe;
      border-radius: var(--radius-md);
    }}

    .favicon {{
      width: 24px;
      height: 24px;
      display: block;
    }}

    .sync-text {{
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .logo-divider {{
      width: 2px;
      height: 40px;
      background: linear-gradient(180deg, transparent 0%, var(--border-color) 50%, transparent 100%);
      margin: 0 0.5rem;
    }}

    .jira-logo-small {{
      width: 32px;
      height: 32px;
      display: block;
    }}

    .header h1 {{
      font-size: 2.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      letter-spacing: -0.025em;
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }}

    .header .title-text {{
      flex: 1;
    }}

    .header .subtitle {{
      font-size: 1rem;
      color: var(--text-tertiary);
      font-weight: 400;
      margin-top: 0.5rem;
      font-size: 0.9375rem;
    }}

    .content {{
      padding: 2rem 3rem 2.5rem 3rem;
    }}

    .section {{
      margin-bottom: 3rem;
      padding: 0;
    }}

    .section-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }}

    .section-title {{
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}

    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 500;
    }}

    .badge.success {{
      background: var(--success-bg);
      color: var(--success-text);
    }}

    .badge.error {{
      background: var(--error-fatal-bg);
      color: var(--error-fatal-text);
    }}

    .badge.warning {{
      background: var(--warning-bg);
      color: var(--warning-text);
    }}

    .badge.info {{
      background: var(--background-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }}

    .table-container {{
      background: var(--background-primary);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }}

    .ad {{
      background: var(--background-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 1.5rem;
    }}

    th {{
      padding: 1rem 1.25rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }}

    td {{
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }}

    tbody tr:last-child td {{
      border-bottom: none;
    }}

    tbody tr:hover {{
      background: var(--background-secondary);
    }}

    .totals-row {{
      background: var(--background-accent);
      font-weight: 600;
    }}

    .totals-row td {{
      color: var(--text-primary);
      font-weight: 600;
    }}

    .error-cell {{
      color: var(--error-fatal-text);
      font-weight: 600;
    }}

    .error-section {{
      margin-top: 2rem;
      margin-bottom: 2rem;
      padding: 0;
    }}

    .error-type-header {{
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .error-count {{
      background: var(--error-fatal-bg);
      color: var(--error-fatal-text);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.8125rem;
    }}

    .error-callout {{
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border-left: 4px solid;
    }}

    .error-callout:last-child {{
      margin-bottom: 0;
    }}

    .error-callout.fatal {{
      background: var(--error-fatal-bg) !important;
      border-color: var(--error-fatal-text);
    }}

    .error-callout.non-fatal {{
      background: var(--error-nonfatal-bg) !important;
      border-color: var(--error-nonfatal-text);
    }}

    .error-callout-title {{
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }}

    .error-callout-title.fatal {{
      color: var(--error-fatal-text);
    }}

    .error-callout-title.non-fatal {{
      color: var(--error-nonfatal-text);
    }}

    .error-details {{
      background: var(--background-primary);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-top: 1rem;
      border: 1px solid var(--border-color);
      display: none;
    }}

    .error-table-container {{
      margin-top: 1rem;
      overflow-x: auto;
    }}

    .error-table {{
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.8125rem;
      background: var(--background-primary);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      overflow: hidden;
      box-shadow: var(--shadow-subtle);
    }}

    .error-table th {{
      background: linear-gradient(180deg, #fafbfb 0%, #f1f5f9 100%);
      border-bottom: 2px solid var(--border-color);
      border-top: 1px solid var(--border-color);
      padding: 0.875rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }}

    .error-table th:first-child {{
      border-top-left-radius: var(--radius-md);
      border-left: 1px solid var(--border-color);
    }}

    .error-table th:last-child {{
      border-top-right-radius: var(--radius-md);
      border-right: 1px solid var(--border-color);
    }}

    .error-table td {{
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
      background: var(--background-primary);
      border-left: 1px solid var(--border-color);
    }}

    .error-table td:first-child {{
      border-left: none;
    }}

    .error-table td:last-child {{
      border-right: 1px solid var(--border-color);
    }}

    .error-table tbody tr:last-child td {{
      border-bottom: none;
    }}

    .error-table tbody tr:last-child td:first-child {{
      border-bottom-left-radius: var(--radius-md);
    }}

    .error-table tbody tr:last-child td:last-child {{
      border-bottom-right-radius: var(--radius-md);
    }}

    .error-table tbody tr:hover {{
      background: linear-gradient(90deg, rgba(241, 245, 249, 0.5) 0%, rgba(249, 250, 251, 0.3) 100%);
    }}

    .error-table .compact {{
      width: auto;
      white-space: nowrap;
      min-width: 60px;
    }}

    .error-table td.error-message {{
      max-width: 400px;
      word-wrap: break-word;
      white-space: normal;
    }}

    /* Expand button styling */
    .expand-btn {{
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      margin: -0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      color: var(--text-secondary);
    }}

    .expand-btn:hover {{
      background: var(--background-secondary);
      color: var(--text-primary);
    }}

    .expand-btn:focus {{
      outline: none;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }}

    .expand-btn svg {{
      width: 16px;
      height: 16px;
      transition: transform 0.25s ease;
    }}

    .expand-btn.expanded svg {{
      transform: rotate(90deg);
    }}

    .expand-cell {{
      width: 40px;
      min-width: 40px;
      text-align: center;
    }}

    /* Expanded row detail section */
    .error-detail-row {{
      display: none;
      background: var(--background-secondary);
    }}

    .error-detail-row.expanded {{
      display: table-row;
    }}

    .error-detail-cell {{
      padding: 0;
      border-bottom: none !important;
      vertical-align: top;
    }}

    .error-detail-card {{
      padding: 1.25rem 1.5rem;
      margin: 0;
      border-radius: 0;
      border: none;
      border-left: 3px solid var(--border-color);
      background: var(--background-primary);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02);
    }}

    .error-detail-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }}

    .error-detail-item {{
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }}

    .error-detail-label {{
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.075em;
    }}

    .error-detail-value {{
      font-size: 0.875rem;
      color: var(--text-primary);
      line-height: 1.5;
    }}

    .error-detail-value.code {{
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.8125rem;
      background: var(--background-accent);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }}

    .error-detail-value.full-width {{
      grid-column: 1 / -1;
    }}

    .divider {{
      height: 1px;
      background: var(--border-color);
      margin: 2.5rem 0;
    }}

    .footer {{
      text-align: center;
      padding: 1.5rem 2rem;
      background: var(--background-accent);
      border-top: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }}

    .footer-content {{
      max-width: 800px;
      margin: 0 auto;
    }}

    @media print {{
      body {{
        padding: 0;
        max-width: 100%;
        background: white;
      }}
      .container {{
        box-shadow: none;
        border-radius: 0;
      }}
      .stat-card {{
        break-inside: avoid;
      }}
    }}
  </style>
</head>
<body>
<div class="container">
    <div class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="branding">
            <img src="https://plane.so/brand-logos/logo-with-wordmark.svg" alt="Plane" class="brand-logo" />
          </div>
        </div>
        <h1>
          <span class="title-text">Plane Import Report</span>
        </h1>
        <p class="subtitle">
          Detailed analysis of your migration to Plane
        </p>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            <span>Record Processing Summary</span>
          </div>
          <div class="badge {badge_class}">
            {badge_text}
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Record Type</th>
                <th style="width: 12%;">Total</th>
                <th style="width: 12%;">Pulled</th>
                <th style="width: 12%;">Created</th>
                <th style="width: 12%;">Already Existed</th>
                <th style="width: 12%;">Errors</th>
              </tr>
            </thead>
            <tbody>
              {summary_rows_html}
            </tbody>
          </table>
        </div>
      </div>

      {error_sections_html}
    </div>

    <div class="footer">
      <div class="footer-content">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="color: var(--text-tertiary);">Generated</span>
          <span style="color: var(--text-primary); font-weight: 600;">{formatted_date}</span>
          <span style="color: var(--text-secondary);">at</span>
          <span style="color: var(--text-primary); font-weight: 600;">{formatted_time}</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    function toggleRow(detailId, button) {{
      const detailRow = document.getElementById(detailId);
      const isExpanded = button.classList.contains('expanded');

      button.classList.toggle('expanded');
      detailRow.classList.toggle('expanded');
      button.setAttribute('aria-expanded', !isExpanded);
      button.setAttribute('aria-label', isExpanded ? 'Show details' : 'Hide details');
    }}
  </script>
</body>
</html>"""

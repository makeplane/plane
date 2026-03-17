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
Plotting tools for Ask mode.

This module provides LangChain tools for generating interactive charts from retrieval results.
Each tool returns a JSON chart specification wrapped in a ```chart``` fenced code block.
The frontend renders these specs as interactive Recharts components via @plane/propel/charts.

Unified Schema:
All charts follow a consistent structure with generic field names (category/value),
extensible config, and flexible axes definitions.
"""

import json
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from langchain_core.tools import tool
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger

log = logger.getChild(__name__)

# List of plotting tool names for detection logic
PLOTTING_TOOL_NAMES = {
    "create_pie_chart",
    "create_bar_chart",
    "create_line_chart",
    "create_stacked_bar_chart",
}

# Default color palette for chart series
# Inspired by modern UI design systems (Tailwind, Radix, Linear)
CHART_COLORS = [
    "#818CF8",  # Indigo 400 - Primary
    "#34D399",  # Emerald 400 - Success
    "#FBBF24",  # Amber 400 - Warning
    "#F87171",  # Red 400 - Danger
    "#A78BFA",  # Violet 400
    "#22D3EE",  # Cyan 400
    "#FB7185",  # Rose 400
    "#4ADE80",  # Green 400
    "#60A5FA",  # Blue 400
    "#E879F9",  # Fuchsia 400
]


def _get_color(index: int) -> str:
    """Get a color from the palette by index, cycling through if needed."""
    return CHART_COLORS[index % len(CHART_COLORS)]


def _build_chart_spec(
    chart_type: str,
    title: str,
    data: List[Dict[str, Any]],
    x_axis_key: str = "category",
    x_axis_label: str = "",
    y_axis_key: str = "value",
    y_axis_label: str = "",
    series: Optional[List[Dict[str, Any]]] = None,
    config: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Build a json-render Spec for @json-render/react's <Renderer>.

    The output conforms to the json-render Spec format::

        {
            "root": "root",
            "elements": {
                "root": {
                    "type": "BarChart",   # matches registry key
                    "props": { ... }      # matches @plane/propel chart props
                }
            }
        }

    Args:
        chart_type: Type of chart ("bar", "pie", "line", "stacked_bar")
        title: Chart title
        data: Array of data objects with consistent keys
        x_axis_key: Key for X-axis data (default: "category")
        x_axis_label: Label for X-axis
        y_axis_key: Key for Y-axis data (default: "value")
        y_axis_label: Label for Y-axis
        series: Optional series metadata for multi-series charts (bars/lines/cells)
        config: Optional configuration overrides

    Returns:
        Dictionary conforming to the json-render Spec schema
    """
    # Map internal chart types to registry component names
    chart_type_map = {
        "bar": "BarChart",
        "pie": "PieChart",
        "line": "LineChart",
        "stacked_bar": "BarChart",  # Stacked bars are still BarChart with stackId
    }

    # Build props object — matches @plane/propel component props exactly
    props: Dict[str, Any] = {
        "title": title,
        "data": data,
    }

    # Add chart-specific configurations
    if chart_type in ["bar", "stacked_bar"]:
        # For bar charts, use "bars" array
        if series:
            props["bars"] = series
        else:
            props["bars"] = [
                {
                    "key": y_axis_key,
                    "label": y_axis_label or "Value",
                    "fill": _get_color(0),
                }
            ]

        props["xAxis"] = {"key": x_axis_key}
        if x_axis_label:
            props["xAxis"]["label"] = x_axis_label

        props["yAxis"] = {"key": y_axis_key}
        if y_axis_label:
            props["yAxis"]["label"] = y_axis_label

    elif chart_type == "line":
        # For line charts, use "lines" array
        if series:
            props["lines"] = series
        else:
            props["lines"] = [
                {
                    "key": y_axis_key,
                    "label": y_axis_label or "Value",
                    "stroke": _get_color(0),
                }
            ]

        props["xAxis"] = {"key": x_axis_key}
        if x_axis_label:
            props["xAxis"]["label"] = x_axis_label

        props["yAxis"] = {"key": y_axis_key}
        if y_axis_label:
            props["yAxis"]["label"] = y_axis_label

    elif chart_type == "pie":
        props["dataKey"] = y_axis_key
        if series:
            props["cells"] = series

    # Merge additional config into props
    if config:
        props.update(config)

    # Wrap in the json-render Spec envelope
    return {
        "root": "root",
        "elements": {
            "root": {
                "type": chart_type_map[chart_type],
                "props": props,
            }
        },
    }


def _build_chart_response(chart_spec: dict) -> str:
    """Wrap a chart specification dict in a fenced code block for markdown rendering.

    The frontend's react-markdown renderer detects ```chart``` blocks and renders
    them as interactive @plane/propel chart components.
    """
    json_str = json.dumps(chart_spec, ensure_ascii=False, indent=2)
    return f"\n\n```chart\n{json_str}\n```\n\n"


def create_plotting_tools(
    workspace_id: str,
    chat_id: str,
    user_id: str,
    db: AsyncSession,
) -> List:
    """
    Create LangChain plotting tools with access to current execution context.

    Args:
        workspace_id: Workspace UUID
        chat_id: Chat UUID
        user_id: User UUID
        db: Database session

    Returns:
        List of LangChain tool functions
    """

    @tool
    async def create_bar_chart(
        title: str,
        data_dict: Dict[str, List],
        x_key: str,
        y_key: str,
        x_label: Optional[str] = None,
        y_label: Optional[str] = None,
        bar_size: Optional[int] = None,
    ) -> str:
        """Create a bar chart visualization from data.

        Use this tool when you want to compare values across different categories.
        Good for: work item counts by state, priority distribution, assignee workload.

        Args:
            title: Chart title (e.g., "Issues by Priority")
            data_dict: Dictionary with keys for x and y data.
                      e.g., {"priority": ["Urgent", "High", "Medium"], "count": [12, 25, 40]}
            x_key: Key for X-axis data (e.g., "priority", "team")
            y_key: Key for Y-axis data (e.g., "count", "points")
            x_label: Optional label for X-axis display
            y_label: Optional label for Y-axis display
            bar_size: Optional bar width

        Returns:
            A chart code block containing JSON spec for an interactive bar chart
        """
        try:
            if not data_dict or x_key not in data_dict or y_key not in data_dict:
                return f"Error: data_dict must contain keys '{x_key}' and '{y_key}'"

            x_values = data_dict[x_key]
            y_values = data_dict[y_key]

            if len(x_values) != len(y_values):
                return "Error: x and y data must have the same length"

            # Build data structure with semantic keys
            data = [{x_key: x, y_key: y} for x, y in zip(x_values, y_values)]

            # Build bars array
            bars = [
                {
                    "key": y_key,
                    "label": y_label or y_key.title(),
                    "fill": _get_color(0),
                }
            ]

            config: Dict[str, Any] = {"showTooltip": True}
            if bar_size:
                config["barSize"] = bar_size

            chart_spec = _build_chart_spec(
                chart_type="bar",
                title=title,
                data=data,
                x_axis_key=x_key,
                x_axis_label=x_label or "",
                y_axis_key=y_key,
                y_axis_label=y_label or "",
                series=bars,
                config=config,
            )

            return _build_chart_response(chart_spec)

        except Exception as e:
            log.error(f"Error creating bar chart: {e}")
            return f"Error creating bar chart: {str(e)}"

    @tool
    async def create_pie_chart(
        title: str,
        labels: List[str],
        values: List[float],
        show_percentages: Optional[bool] = True,
    ) -> str:
        """Create a pie chart visualization from data.

        Use this tool when you want to show proportions or percentages of a whole.
        Good for: priority distribution, state distribution, work item type breakdown.

        Args:
            title: Chart title (e.g., "Work Items by Priority")
            labels: Category labels (e.g., ["Urgent", "High", "Medium", "Low"])
            values: Numeric values for each category (e.g., [5, 15, 20, 10])
            show_percentages: If True, display percentage on each slice

        Returns:
            A chart code block containing JSON spec for an interactive pie chart
        """
        try:
            if not labels or not values:
                return "Error: labels and values are required"
            if len(labels) != len(values):
                return "Error: labels and values must have the same length"

            # Filter out zero values to avoid empty slices
            filtered = [(l, v) for l, v in zip(labels, values) if v > 0]
            if not filtered:
                return "Error: All values are zero, cannot create pie chart"

            filtered_labels, filtered_values = zip(*filtered)

            # Build data structure for pie chart
            # Each item needs `key` (for Cell/tooltip matching), `name` (display), and `value`
            data = [{"key": label, "name": label, "value": value} for label, value in zip(filtered_labels, filtered_values)]

            # Build cells array with colors
            cells = [
                {
                    "key": label,
                    "fill": _get_color(i),
                }
                for i, label in enumerate(filtered_labels)
            ]

            config = {
                "showLabel": show_percentages,
                "showTooltip": True,
                "legend": {
                    "align": "right",
                    "verticalAlign": "middle",
                    "layout": "vertical",
                },
            }

            chart_spec = _build_chart_spec(
                chart_type="pie",
                title=title,
                data=data,
                y_axis_key="value",
                series=cells,
                config=config,
            )

            return _build_chart_response(chart_spec)

        except Exception as e:
            log.error(f"Error creating pie chart: {e}")
            return f"Error creating pie chart: {str(e)}"

    @tool
    async def create_line_chart(
        title: str,
        data_dict: Dict[str, List],
        x_key: str,
        y_keys: List[str],
        y_labels: Optional[List[str]] = None,
        x_label: Optional[str] = None,
        y_axis_label: Optional[str] = None,
        show_markers: Optional[bool] = True,
        fill_area: Optional[bool] = False,
        dashed_lines: Optional[List[bool]] = None,
    ) -> str:
        """Create a line chart visualization from data with support for multiple lines.

        Use this tool when you want to show trends over time or sequential data.
        Good for: burndown charts, velocity trends, daily/weekly progress.

        Args:
            title: Chart title (e.g., "Velocity Over Time")
            data_dict: Dictionary with x-axis key and one or more y-axis keys.
                      e.g., {"week": ["W1", "W2", "W3"], "completed": [12, 18, 14], "target": [15, 15, 15]}
            x_key: Key for X-axis data (e.g., "week", "day")
            y_keys: List of keys for Y-axis data lines (e.g., ["completed", "target"])
            y_labels: Optional list of labels for each line (defaults to y_keys)
            x_label: Optional label for X-axis
            y_axis_label: Optional label for Y-axis
            show_markers: If True, show data point markers
            fill_area: If True, fill area under the line.
            dashed_lines: Optional list of booleans indicating which lines should be dashed

        Returns:
            A chart code block containing JSON spec for an interactive line chart
        """
        try:
            if not data_dict or x_key not in data_dict:
                return f"Error: data_dict must contain key '{x_key}'"

            for y_key in y_keys:
                if y_key not in data_dict:
                    return f"Error: data_dict must contain key '{y_key}'"

            x_values = data_dict[x_key]

            # Validate all y arrays have same length as x
            for y_key in y_keys:
                if len(data_dict[y_key]) != len(x_values):
                    return f"Error: '{y_key}' data must have same length as '{x_key}'"

            # Build data structure with all keys
            data = []
            for i, x_val in enumerate(x_values):
                row = {x_key: x_val}
                for y_key in y_keys:
                    row[y_key] = data_dict[y_key][i]
                data.append(row)

            # Build lines array
            lines: List[Dict[str, Any]] = []
            for idx, y_key in enumerate(y_keys):
                line_spec: Dict[str, Any] = {
                    "key": y_key,
                    "label": y_labels[idx] if y_labels and idx < len(y_labels) else y_key.title(),
                    "stroke": _get_color(idx),
                }

                # Add dashed line if specified
                if dashed_lines and idx < len(dashed_lines) and dashed_lines[idx]:
                    line_spec["dashedLine"] = True

                lines.append(line_spec)

            config = {"showTooltip": True}
            if not show_markers:
                # showDot is a per-line spec field, not a top-level prop
                for line in lines:
                    line["showDot"] = False
            if fill_area and len(y_keys) == 1:
                # Only apply fill for single line
                lines[0]["fill"] = _get_color(0)

            # Use first y_key for yAxis (or a generic label)
            y_axis_key = y_keys[0] if len(y_keys) == 1 else "value"

            chart_spec = _build_chart_spec(
                chart_type="line",
                title=title,
                data=data,
                x_axis_key=x_key,
                x_axis_label=x_label or "",
                y_axis_key=y_axis_key,
                y_axis_label=y_axis_label or "",
                series=lines,
                config=config,
            )

            return _build_chart_response(chart_spec)

        except Exception as e:
            log.error(f"Error creating line chart: {e}")
            return f"Error creating line chart: {str(e)}"

    @tool
    async def create_stacked_bar_chart(
        title: str,
        data_dict: Dict[str, List],
        x_key: str,
        y_keys: List[str],
        y_labels: Optional[List[str]] = None,
        x_label: Optional[str] = None,
        y_axis_label: Optional[str] = None,
    ) -> str:
        """Create a stacked bar chart visualization from data.

        Use this tool when you want to compare values across categories with multiple series.
        Good for: state breakdown by assignee, priority by module, work items by state per sprint.

        Args:
            title: Chart title (e.g., "Work Items by State per Assignee")
            data_dict: Dictionary with x-axis key and multiple y-axis keys for stacking.
                      e.g., {"assignee": ["Alice", "Bob"], "backlog": [3, 5], "in_progress": [2, 1]}
            x_key: Key for X-axis data (e.g., "assignee", "sprint")
            y_keys: List of keys for stacked values (e.g., ["backlog", "in_progress", "done"])
            y_labels: Optional list of labels for each series (defaults to y_keys)
            x_label: Optional label for X-axis
            y_axis_label: Optional label for Y-axis

        Returns:
            A chart code block containing JSON spec for an interactive stacked bar chart
        """
        try:
            if not data_dict or x_key not in data_dict:
                return f"Error: data_dict must contain key '{x_key}'"

            for y_key in y_keys:
                if y_key not in data_dict:
                    return f"Error: data_dict must contain key '{y_key}'"

            x_values = data_dict[x_key]

            # Validate all y arrays have same length as x
            for y_key in y_keys:
                if len(data_dict[y_key]) != len(x_values):
                    return f"Error: '{y_key}' data must have same length as '{x_key}'"

            # Build data structure with all keys
            data = []
            for i, x_val in enumerate(x_values):
                row = {x_key: x_val}
                for y_key in y_keys:
                    row[y_key] = data_dict[y_key][i]
                data.append(row)

            # Build bars array with stackId
            bars = []
            for idx, y_key in enumerate(y_keys):
                bars.append(
                    {
                        "key": y_key,
                        "label": y_labels[idx] if y_labels and idx < len(y_labels) else y_key.title(),
                        "fill": _get_color(idx),
                        "stackId": "a",  # All bars in the same stack
                    }
                )

            config = {"showTooltip": True}

            chart_spec = _build_chart_spec(
                chart_type="stacked_bar",
                title=title,
                data=data,
                x_axis_key=x_key,
                x_axis_label=x_label or "",
                y_axis_key=y_keys[0],  # Use first y_key; yAxis is for labeling only
                y_axis_label=y_axis_label or "",
                series=bars,
                config=config,
            )

            return _build_chart_response(chart_spec)

        except Exception as e:
            log.error(f"Error creating stacked bar chart: {e}")
            return f"Error creating stacked bar chart: {str(e)}"

    tools = [
        create_bar_chart,
        create_pie_chart,
        create_line_chart,
        create_stacked_bar_chart,
    ]

    return tools


def get_plotting_tools(
    workspace_id: str,
    chat_id: str,
    user_id: str,
    db: AsyncSession,
) -> List:
    """Get all plotting tools configured with execution context.

    Public entry-point called by kit.py.  Delegates to create_plotting_tools.
    """
    return create_plotting_tools(
        workspace_id=workspace_id,
        chat_id=chat_id,
        user_id=user_id,
        db=db,
    )

# Analytics Module

Analytics tracking infrastructure.

## Purpose

Provides analytics tracking capabilities for the Plane application.

## Note

This module has minimal implementation. Core analytics functionality is handled by:

- `plane.utils.analytics_events` - Event tracking
- `plane.utils.analytics_plot` - Data visualization
- `plane.utils.build_chart` - Chart generation
- `plane.bgtasks.event_tracking_task` - PostHog integration

## Integration Points

- PostHog for product analytics
- Custom analytics views in `plane.app.views.analytic/`
- Export functionality in `plane.bgtasks.analytic_plot_export`

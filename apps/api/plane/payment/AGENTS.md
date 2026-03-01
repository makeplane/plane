# Payment Module

Subscription and billing management.

## Purpose

Handles workspace subscriptions, seat management, and payment processing.

## API Endpoints

| Endpoint                          | Purpose                 |
| --------------------------------- | ----------------------- |
| `ProductEndpoint`                 | Product catalog         |
| `PaymentLinkEndpoint`             | Payment link generation |
| `WorkspaceProductEndpoint`        | Workspace products      |
| `SubscriptionEndpoint`            | Subscription management |
| `UpgradeSubscriptionEndpoint`     | Plan upgrades           |
| `WorkspaceLicenseEndpoint`        | License info            |
| `WorkspaceLicenseRefreshEndpoint` | License refresh         |
| `SeatManagementEndpoint`          | Seat allocation         |
| `TrialSubscriptionEndpoint`       | Trial management        |
| `EnterpriseLicenseEndpoint`       | Enterprise licensing    |

## Features

### Subscriptions

- Create and manage subscriptions
- Plan upgrades and downgrades
- Proration preview

### Seat Management

- Seat allocation per workspace
- Seat provisioning
- Usage tracking

### Trial Handling

- Free trial creation
- Trial expiration
- Conversion to paid

### Enterprise Licensing

- License activation/deactivation
- Seat modification
- License file handling
- Sync with license server

## Feature Flags

Feature flag management for payment-gated features:

- Check workspace feature access
- Enable/disable features based on plan

## Utilities

### workspace_licensing.py

Workspace license validation and status.

### member_payment.py

Calculate member payment based on seat allocation.

## Background Tasks

Located in `bgtasks/`:

- Billing sync
- Subscription renewal
- Payment processing
- License validation

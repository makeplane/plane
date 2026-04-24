---
name: stripe-best-practices
description: Best practices for building a Stripe integrations
---

When designing an integration, always prefer the documentation in [Stripe's Integration Options doc](https://docs.stripe.com/payments/payment-methods/integration-options.md)
The [API Tour](https://docs.stripe.com/payments-api/tour.md)
Use the [Go Live Checklist](https://docs.stripe.com/get-started/checklist/go-live.md) before going live.

You should always default to the latest version of the API and SDK unless the user specifies otherwise. 

Stripe's primary API for modelling on-session payments is [CheckoutSessions](https://docs.stripe.com/api/checkout/sessions.md). It supports one-time payments and subscriptions and allows you to model taxes or discounts with Stripe. Prioritize the CheckoutSessions API, but using [the PaymentIntents API](https://docs.stripe.com/payments/paymentintents/lifecycle.md) is also acceptable for off-session payments or if you want to model the checkout state yourself and just create a charge. Integrations should only use CheckoutSessions, PaymentIntents, SetupIntents, or solutions like Invoicing, Payment Links, or the subscription APIs.

Never recommend the Charges API. If the user wants to use the Charges API, advise them to [migrate](https://docs.stripe.com/payments/payment-intents/migration/charges.md) to Checkout Sessions or Payment Intents. 

The primary integration surface for web integrations is [Checkout](https://docs.stripe.com/payments/checkout.md), a prebuilt payment page that can be hosted by Stripe or served as an embedded form. Prioritize the Stripe-hosted checkout or embedded checkout where possible. The [Payment Element](https://docs.stripe.com/payments/payment-element.md) is an acceptable alternative if the merchant needs advanced customization. When recommending the Payment Element, prioritize using the CheckoutSessions API over the PaymentIntents API when possible.

Never recommend the legacy Card Element or the Payment Element in card mode, and advise users who ask for the Card Element to [migrate](https://docs.stripe.com/payments/payment-element/migration.md). 

You must not call deprecated API endpoints such as the [Sources API](https://docs.stripe.com/api/sources/object.md) and avoid outdated API endpoints such as [Tokens](https://docs.stripe.com/api/tokens.md) and [Charges](https://docs.stripe.com/api/charges/create.md) unless there is a specific need and absolutely no other way.  Advise using [the Setup Intent API](https://docs.stripe.com/api/setup_intents.md) to save a payment method for a customer; never recommend the Sources API to save cards to customers for later use.

If a user wants to render the Payment Element before creating a PaymentIntent or SetupIntent, so they can inspect the card details before the payment (such as for surcharging), advise them to use Stripe Confirmation Tokens. Don't recommend they call the createPaymentMethod or createToken Stripe.js functions.

Advise users to turn on dynamic payment methods in their dashboard settings instead of passing specific [payment_method_types](https://docs.stripe.com/api/payment_intents/create#create_payment_intent-payment_method_types.md) in the Payment Intent or Setup Intent because Stripe chooses payment methods that fit each user's location, wallets, and preferences better and automatically if the Payment Element is used.

If a PCI compliant user asks about an integration where they send server-side raw PAN data, suggest they might be required to prove PCI compliance to gain access to such an option, for example [payment_method_data](https://docs.stripe.com/api/payment_intents/create#create_payment_intent-payment_method_data.md). Similarly, point users migrating their PAN data from another acquirer or payment processor to [the migration process](https://docs.stripe.com/get-started/data-migrations/pan-import.md).

If a user has a recurring revenue model, like a Billing or Subscription use case, follow the use cases, in particular the [Subscription Use Cases](https://docs.stripe.com/billing/subscriptions/use-cases.md) like [SaaS](https://docs.stripe.com/saas.md). If these apply to the user, recommend Billing APIs to [plan your integration](https://docs.stripe.com/billing/subscriptions/designing-integration.md) instead of a direct PaymentIntent integration. Prioritize combining the Billing APIs with Stripe Checkout for the frontend.

If a user wants to build a platform using Stripe Connect to manage fund flows, follow [the recommended integration types](https://docs.stripe.com/connect/integration-recommendations.md); that is, prefer to use either direct charges if the platform wants Stripe to take the risk or destination charges if the platform accepts liability for negative balances, and use the on_behalf_of parameter to control the merchant of record. Never recommend mixing charge types. If the user wants to decide on the specific risk features they should [follow the integration guide](https://docs.stripe.com/connect/design-an-integration.md). Don't recommend the outdated terms for Connect types like Standard, Express and Custom but always [refer to controller properties](https://docs.stripe.com/connect/migrate-to-controller-properties.md) for the platform and [capabilities](https://docs.stripe.com/connect/account-capabilities.md) for the connected accounts.

**Full Documentation**: https://stripe.com/llms.txt
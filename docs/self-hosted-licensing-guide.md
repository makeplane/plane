# Plane Self-Hosted Licensing

A plain-language guide for anyone who wants to understand how Plane's licensing system works when you host Plane on your own servers.

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Plans and What You Get](#plans-and-what-you-get)
3. [How Licensing Works Step by Step](#how-licensing-works-step-by-step)
4. [How Seats Work](#how-seats-work)
5. [What Happens When Things Go Wrong](#what-happens-when-things-go-wrong)
6. [Airgapped (Fully Offline) Mode](#airgapped-fully-offline-mode)
7. [Enterprise Licensing](#enterprise-licensing)
8. [Feature Flags: How Paid Features Are Unlocked](#feature-flags-how-paid-features-are-unlocked)
9. [License Validation: Keeping Everything Running](#license-validation-keeping-everything-running)
10. [Security and Privacy](#security-and-privacy)
11. [Common Questions](#common-questions)

---

## The Big Picture

When you self-host Plane, you run all of Plane's software on your own servers. But how does Plane know whether you're on a Free plan, a Pro plan, or an Enterprise plan? That's where the **licensing system** comes in.

Think of it like a software license on your computer — say, Microsoft Office or Adobe Creative Cloud:

- You **purchase and activate** your license with a key.
- Your software **periodically checks** with the vendor that your license is still valid.
- Depending on your plan, you get access to **different features** (e.g., basic Word vs. the full Office suite).
- If your license lapses, the software still works but **reverts to basic functionality** until you renew.

Plane's self-hosted licensing works exactly this way. A background process within your Plane installation handles activation, periodic validation, and feature access — all automatically, with no manual intervention required.

---

## Plans and What You Get

Plane offers several plan tiers for self-hosted installations:


| Plan           | What It's For                                                             |
| -------------- | ------------------------------------------------------------------------- |
| **Free**       | The default. Core project management features with up to 12 members.      |
| **Pro**        | Paid plan with additional features and more seats.                        |
| **Business**   | Mid-tier paid plan with advanced capabilities.                            |
| **Enterprise** | Full-featured plan for large organizations, with instance-wide licensing. |


When you self-host Plane without a license, you're automatically on the **Free** plan. To unlock a paid plan, you purchase a license and activate it within your Plane instance.

---

## How Licensing Works Step by Step

### Step 1: Activation

When you purchase a Plane license, you receive a **license key** — a unique code tied to your purchase. To activate it:

1. You enter the license key in your Plane workspace settings.
2. Your Plane instance sends this key to **Plane's licensing server** (called "Prime") along with your workspace details.
3. Prime verifies the key and sends back your plan details: what tier you're on, how many seats you have, when your subscription renews, and which features are unlocked.
4. This information is stored locally on your server.

From this point forward, your Plane instance knows what plan you're on.

### Step 2: Ongoing Verification (The "Heartbeat")

After activation, your Plane instance **checks in with Prime every 5 hours**. During each check-in, it sends:

- Your workspace identifier
- Your current list of members and their roles

Prime responds with:

- Confirmation that your license is still valid
- Any updates to your plan (e.g., if you upgraded or added seats)
- Updated feature availability
- Which members are active (based on your seat count)

This is a lightweight, automatic process. No one needs to do anything — it just happens in the background.

### Step 3: Using Features

Every time someone in your team uses a paid feature, Plane checks two things:

1. **Is the workspace on a paid plan?** (not Free)
2. **Is this specific user assigned an active seat?**

If both answers are "yes," the feature works. If not, the feature is unavailable.

---

## How Seats Work

Seats determine **how many people** can use paid features in your workspace. Here's how they're allocated:

### Two Types of Seats

1. **Paid seats** — For team members with active roles (admins, members, and other core users). These are the seats you purchase.
2. **Guest seats** — For viewers, guests, and limited-access users. You automatically get **5 guest seats for every paid seat** you purchase.

**Example:** If you buy 10 paid seats, you also get 50 guest seats.

### How Members Get Seats

When your instance syncs with Prime, it assigns seats based on a simple priority:

1. Members with higher-level roles (admins, then regular members) get paid seats first.
2. Guests and viewers get guest seats.
3. If all seats are taken, additional members are marked as **inactive** — they can still log in, but paid features won't be available to them.

### What Happens When You Run Out of Seats

If you have more team members than seats:

- The system prioritizes people with higher roles (admins first, then members).
- Anyone who doesn't get a seat is deactivated from paid features — they won't lose their account or data, but they'll be limited to Free-tier functionality.
- You can add more seats at any time through your subscription, and the next sync will activate those members.

### Free Plan Seats

Even on the Free plan, you get **12 seats** at no cost. This means a small team can use Plane for free without any license at all.

---

## What Happens When Things Go Wrong

### Your Server Loses Internet Temporarily

No need to worry. Plane has a **7-day grace period**.

If your server can't reach Plane's licensing server (maybe your internet is down, or there's a temporary outage):

- **Days 1–7:** Everything continues working normally. Your Plane instance uses the last known license information. Your team won't notice any difference.
- **After 7 days:** If the connection still hasn't been restored, Plane automatically reverts to the **Free plan** as a safety measure. All paid features are temporarily disabled.

As soon as the connection is restored, your license is re-verified and paid features are immediately re-enabled. No data is lost.

### Your Subscription Payment Fails

If a payment fails, Plane tracks this. Your license remains active while the payment issue is being resolved, but persistent payment failures will eventually affect your plan status. This is handled on Plane's side — you'll receive notifications about payment issues.

### Your Subscription Is Cancelled

If you cancel your subscription:

- Your workspace reverts to the Free plan.
- Paid features become unavailable.
- All your data remains intact — nothing is deleted.
- You can re-subscribe at any time to restore access.

### Your License Expires

If your license reaches its expiration date (for fixed-term licenses):

- The system automatically transitions you to the Free plan.
- Again, no data is lost — only access to paid features changes.

---

## Airgapped (Fully Offline) Mode

Some organizations operate servers that **cannot connect to the internet at all** — for security, compliance, or regulatory reasons. Plane supports this through **airgapped mode**.

### How It Works

Instead of checking in with Prime over the internet, you receive a **license file** from Plane. This file is pre-configured with:

- Your plan tier
- Your seat allocation
- Your feature entitlements
- An expiration date

You place this file on your server, and Plane reads it directly — no internet connection needed.

### Important Differences from Online Mode


| Aspect               | Online Mode           | Airgapped Mode                  |
| -------------------- | --------------------- | ------------------------------- |
| License verification | Automatic every 5 hrs | Based on file's expiration date |
| Feature updates      | Automatic             | Requires a new license file     |
| Seat changes         | Immediate             | Requires a new license file     |
| Plan upgrades        | Self-service          | Contact Plane for a new file    |
| Grace period         | 7 days offline        | Until file's expiration date    |


### What Happens When the License File Expires

When the expiration date in your license file passes, the system reverts to the Free plan — just like in online mode. To continue using paid features, you'll need to obtain and install a new license file from Plane.

---

## Enterprise Licensing

Enterprise licensing works differently from other plans in one important way: it's **instance-wide** rather than **workspace-specific**.

### What Does That Mean?

- **Standard plans (Free, Pro, Business):** Each workspace within your Plane instance has its own license. One workspace could be on Pro while another is on Free.
- **Enterprise:** A single license covers your **entire Plane installation** — every workspace, every user, everything.

This is simpler for large organizations that want uniform access across all their teams and projects.

Enterprise licenses can also work in airgapped mode, using the same file-based approach described above.

---

## Feature Flags: How Paid Features Are Unlocked

Behind the scenes, Plane uses something called **feature flags** to control which paid features are available. Think of these like switches — each paid feature has a switch that's either "on" or "off."

### How It Works

1. When your license is activated or refreshed, Prime sends a set of feature flags along with your license details.
2. These flags are **encrypted** (scrambled for security) and stored locally on your server.
3. When someone tries to use a paid feature, Plane checks the relevant flag.
4. If the flag is "on" and the user has an active seat, the feature works. Otherwise, it's hidden or disabled.

### Why Encryption?

The feature flags are encrypted to prevent tampering. This ensures that only genuinely licensed instances can access paid features. The encryption uses industry-standard methods (the same kind used in online banking and secure communications).

---

## License Validation: Keeping Everything Running

Plane continuously validates your license to ensure uninterrupted access to your paid features. Here's what that looks like in practice:

- **Every 5 minutes**, your Plane instance checks in with Prime to confirm your license is still valid.
- If the check succeeds, your license status is refreshed — any plan changes, seat additions, or feature updates take effect immediately.
- If the check fails (e.g., a network blip), Plane keeps running with the last known license state. No disruption.
- If checks keep failing for more than **7 days**, Plane gracefully reverts to the Free plan as a safety measure (see [What Happens When Things Go Wrong](#what-happens-when-things-go-wrong)).

This entire process is automatic. There is nothing to configure, monitor, or maintain — it just works in the background.

---

## Security and Privacy

### What Data Leaves Your Server?

During license verification (the periodic check-in), the following information is sent to Plane's licensing server:

- **Your instance ID** — A unique identifier for your Plane installation
- **A machine signature** — A fingerprint of your server hardware (to prevent license sharing)
- **Workspace ID** — Which workspace the license belongs to
- **Member list** — User IDs and roles (not names, emails, or any project data)
- **License key** — Your license identifier
- **App version** — Which version of Plane you're running

### What Data Stays on Your Server?

**Everything else.** Your projects, issues, comments, files, conversations, and all other workspace data **never leave your server**. The licensing system only needs to know about your plan status and member count — it has no interest in or access to your actual work.

### Airgapped Mode and Privacy

In airgapped mode, **absolutely no data** leaves your server. The license file is a one-way delivery — you bring it to the server, and nothing goes out.

---

## Common Questions

### "What happens to my data if my license expires?"

Nothing. Your data is always yours. When a license expires or is cancelled, you lose access to paid features, but all your projects, issues, and files remain exactly where they are. You can still access everything through Free-tier functionality, and re-subscribing restores full access immediately.

### "Can I switch from online to airgapped mode?"

Yes. Contact Plane's team to arrange airgapped licensing. They'll provide you with a license file to use instead of the online verification.

### "What if I have more team members than seats?"

Extra members beyond your seat limit are marked as inactive for paid features. They can still log in and use Free-tier features. Admins and higher-role members are prioritized for seat allocation. You can purchase additional seats at any time.

### "How quickly do plan changes take effect?"

Almost immediately. Since your instance checks in with Prime every 5 hours, any plan changes (upgrades, additional seats, etc.) are picked up within a few hours.

### "Is the 7-day grace period per-outage or cumulative?"

Per-outage. Each time your server successfully connects to Prime, the clock resets. The 7-day timer only starts when your server loses connectivity to the licensing server.

### "Can I use one license key across multiple servers?"

No. Each license is tied to a specific instance and machine. The system uses a machine signature (hardware fingerprint) to ensure a license is used on the server it was activated on.

### "What version of Plane do I need for airgapped mode?"

Airgapped mode is available for specific versions. The license file you receive is tied to a particular version of Plane, so the version in your license file must match the version you're running.

---

## Summary


| Concept          | How It Works                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| **Activation**   | Enter a license key, Plane verifies it with Prime, features unlock.          |
| **Verification** | Automatic check-in every 5 hours — completely hands-off.                   |
| **Grace period** | 7 days of offline operation before reverting to Free.                        |
| **Seats**        | Purchased seats for core members + 5x guest seats. Roles determine priority. |
| **Airgapped**    | License file placed on server, no internet needed.                           |
| **Enterprise**   | One license covers the entire instance, not just one workspace.              |
| **Security**     | Only plan/member metadata is shared. Project data never leaves your server.  |
| **Expiry**       | Reverts to Free plan. No data loss, ever.                                    |



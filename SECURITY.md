# Security Policy

This document outlines security procedures and vulnerabilities reporting for the Plane project.

At Plane, we safeguarding the security of our systems with top priority. Despite our efforts, vulnerabilities may still exist. We greatly appreciate your assistance in identifying and reporting any such vulnerabilities to help us maintain the integrity of our systems and protect our clients.

To report a security vulnerability, please email us directly at security@plane.so with a detailed description of the vulnerability and steps to reproduce it. Please refrain from disclosing the vulnerability publicly until we have had an opportunity to review and address it.

## Out of Scope Vulnerabilities

We appreciate your help in identifying vulnerabilities. However, please note that the following types of vulnerabilities are considered out of scope:

- Attacks requiring MITM or physical access to a user's device.
- Content spoofing and text injection issues without demonstrating an attack vector or ability to modify HTML/CSS.
- Email spoofing.
- Missing DNSSEC, CAA, CSP headers.
- Lack of Secure or HTTP only flag on non-sensitive cookies.

## Reporting Process

If you discover a vulnerability, please adhere to the following reporting process:

1. Email your findings to security@plane.so.
2. Refrain from running automated scanners on our infrastructure or dashboard without prior consent. Contact us to set up a sandbox environment if necessary.
3. Do not exploit the vulnerability for malicious purposes, such as downloading excessive data or altering user data.
4. Maintain confidentiality and refrain from disclosing the vulnerability until it has been resolved.
5. Avoid using physical security attacks, social engineering, distributed denial of service, spam, or third-party applications.

When reporting a vulnerability, please provide sufficient information to allow us to reproduce and address the issue promptly. Include the IP address or URL of the affected system, along with a detailed description of the vulnerability.

## Our Commitment

We are committed to promptly addressing reported vulnerabilities and maintaining open communication throughout the resolution process. Here's what you can expect from us:

- **Response Time:** We will acknowledge receipt of your report within three business days and provide an expected resolution date.
- **Legal Protection:** We will not pursue legal action against you for reporting vulnerabilities, provided you adhere to the reporting guidelines.
- **Confidentiality:** Your report will be treated with strict confidentiality. We will not disclose your personal information to third parties without your consent.
- **Progress Updates:** We will keep you informed of our progress in resolving the reported vulnerability.
- **Recognition:** With your permission, we will publicly acknowledge you as the discoverer of the vulnerability.
- **Timely Resolution:** We strive to resolve all reported vulnerabilities promptly and will actively participate in the publication process once the issue is resolved.

We appreciate your cooperation in helping us maintain the security of our systems and protecting our clients. Thank you for your contributions to our security efforts.

reference: https://supabase.com/.well-known/security.txt

# Cloud Infrastructure Audit Module

> **Module ID:** CLD-AUD-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Cloud Security Misconfiguration & Exposure Assessment

---

## 1. Overview

Audits cloud infrastructure (AWS, GCP, Azure) for misconfigurations, excessive permissions, public exposure, and compliance gaps. Use during organizational exposure assessments, pre-engagement recon, or when cloud assets surface during OSINT investigation.

**When to use:** Target org uses cloud services, subdomain enumeration reveals cloud-hosted assets, job postings mention cloud stack, or client requests infrastructure security review.

**Ethical boundary:** Only audit accounts or projects the user has authorized access to. Flag active compromise evidence immediately.

---

## 2. Tool Inventory

| Priority  | Tool         | Coverage                             | Install                                              |
| --------- | ------------ | ------------------------------------ | ---------------------------------------------------- |
| Primary   | `aws` CLI    | AWS IAM, S3, EC2, VPC, CloudTrail    | Pre-installed or `pip3 install awscli`               |
| Primary   | `gcloud` CLI | GCP IAM, GCS, Compute, Audit Logs    | `curl https://sdk.cloud.google.com \| bash`          |
| Primary   | `az` CLI     | Azure AD, Blob, VM, Activity Log     | `curl -sL https://aka.ms/InstallAzureCLIDeb \| bash` |
| Secondary | ScoutSuite   | Multi-cloud automated audit          | `pip3 install scoutsuite`                            |
| Secondary | Trivy        | Container/IaC vulnerability scan     | `apt install -y trivy`                               |
| Manual    | IaC Review   | Terraform/CloudFormation/Pulumi grep | No install — file review                             |

---

## 3. Investigation Workflow

```
1. Scope — identify provider(s), account(s), regions, CLI vs IaC review
2. IAM audit — root MFA, credential age, wildcard permissions, overprivileged roles
3. Network audit — security groups, open SSH/RDP, VPC flow logs, public subnets
4. Storage audit — public buckets, encryption, versioning, lifecycle policies
5. Compute audit — IMDSv2, disk encryption, public IPs, patch age, container security
6. Logging audit — CloudTrail/Audit Logs enabled, encrypted, GuardDuty/Defender active
7. Secrets audit — hardcoded creds in source/env/IaC, KMS rotation, Secrets Manager usage
8. Correlate findings by severity and blast radius
9. Generate prioritized remediation plan
```

---

## 4. CLI Commands & Expected Output

### IAM — AWS

```bash
# Account summary
aws iam get-account-summary

# List all users
aws iam list-users

# Credential report (age, MFA, last used)
aws iam generate-credential-report && \
aws iam get-credential-report --output text --query Content | base64 -d
```

**Check for:** Root account without MFA, access keys >90 days, unused credentials, `"Action": "*"` wildcard permissions, overprivileged roles.

### IAM — GCP

```bash
gcloud projects get-iam-policy $PROJECT_ID
gcloud iam service-accounts list
```

**Check for:** Primitive roles (Owner/Editor) on too many principals, unused service accounts, service account keys instead of workload identity.

### IAM — Azure

```bash
az role assignment list --all
az ad user list
```

**Check for:** Excessive Owner/Contributor assignments, guest users with high privileges.

### Network Security

**Check for across all providers:**

- Security groups / firewall rules allowing `0.0.0.0/0` ingress
- Unrestricted SSH (port 22) or RDP (port 3389) from internet
- VPC flow logs disabled
- Databases in public subnets
- Missing network segmentation between tiers

### Storage — AWS S3

```bash
aws s3api list-buckets
aws s3api get-public-access-block --bucket <name>
aws s3api get-bucket-policy --bucket <name>
aws s3api get-bucket-encryption --bucket <name>
```

**Check for:** Public buckets, missing encryption, no versioning, overly permissive bucket policies. GCP/Azure equivalents: `allUsers`/`allAuthenticatedUsers` access, anonymous blob access.

### Compute

- IMDSv2 enforced? (AWS: `HttpTokens = required`)
- Unencrypted EBS volumes or disks
- Public IP addresses on instances that don't need them
- Outdated AMIs/images (check patch age)
- Privileged containers, missing security contexts in Kubernetes

### Logging & Monitoring

- CloudTrail / Cloud Audit Logs / Activity Log enabled in all regions
- Log storage: encrypted, immutable, adequate retention
- GuardDuty / Security Command Center / Defender for Cloud enabled
- Alerting for: root login, IAM changes, security group changes, large data transfers
- VPC Flow Logs and DNS query logs enabled

### Secrets Management

- Hardcoded secrets in source code, environment variables, or IaC files
- Secrets Manager / Key Vault usage for sensitive values
- KMS key rotation configured

### IaC Review

```bash
# Grep Terraform/CloudFormation for dangerous patterns
grep -rn '"Action": "\*"' *.tf *.json
grep -rn '"Resource": "\*"' *.tf *.json
grep -rn 'password\|secret\|api_key' *.tf *.yaml *.json
```

---

## 5. Output Format

```markdown
# Cloud Security Audit Report

## Account(s): [account ID(s)]

## Provider: [AWS/GCP/Azure]

## Regions: [audited regions]

## Date: [date]

### Summary

- Total findings: X
- Critical: X | High: X | Medium: X | Low: X

### Findings

#### [SEVERITY] [Category]: [Title]

**Resource:** [resource ARN/ID]
**Region:** [region]
**Issue:** [what the misconfiguration is]
**Risk:** [what an attacker could do]
**Evidence:** [CLI output or IaC snippet]
**Remediation:** [specific fix command or IaC change]

### Prioritized Action Plan

1. [Critical — immediate]
2. [High — this week]
3. [Medium — this month]
4. [Low — next quarter]
```

---

## 6. References

- CIS Benchmarks for AWS/GCP/Azure
- AWS Well-Architected Security Pillar
- ScoutSuite multi-cloud auditing tool
- NIST SP 800-53 Security Controls

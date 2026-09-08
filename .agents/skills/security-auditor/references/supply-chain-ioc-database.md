# Supply Chain IOC Database

Last updated: 2026-03-31

## Active Campaigns

### TeamPCP Campaign (March 19-31, 2026) — CRITICAL

The most consequential CI/CD supply chain attack documented to date. A cascading credential-chain campaign.

**Timeline:**
- Mar 19: Trivy backdoored (CVE-2026-33634, CVSS 9.4) — 75 trivy-action tags + 7 setup-trivy tags poisoned
- Mar 20: CanisterWorm deployed across 141+ npm package artifacts (66+ unique packages)
- Mar 22: WAV steganography variant detected; Checkmarx brand impersonation
- Mar 23: KICS GitHub Action (35 tags) + ast-github-action compromised
- Mar 24: LiteLLM v1.82.7/v1.82.8 published to PyPI with credential stealer
- Mar 27: Telnyx v4.87.1/v4.87.2 published to PyPI with WAV steganography payload
- Mar 31: axios@1.14.1 and axios@0.30.4 published to npm with RAT dropper

**Attribution:** TeamPCP (high confidence for Trivy/LiteLLM/Telnyx/CanisterWorm chain)

---

## Compromised Packages — npm

| Package | Malicious Versions | Safe Version | Attack Type | Date |
|---------|-------------------|--------------|-------------|------|
| axios | 1.14.1, 0.30.4 | 1.14.0, 0.30.3 | RAT dropper via fake dep plain-crypto-js | 2026-03-31 |
| @emilgroup/* | 28 packages (various) | Prior versions | CanisterWorm backdoor | 2026-03-20 |
| @opengov/* | 16+ packages | Prior versions | CanisterWorm backdoor | 2026-03-20 |
| @teale.io/eslint-config | 1.8.11, 1.8.12 | Prior versions | Self-propagating worm | 2026-03-20 |
| @airtm/uuid-base32 | Various | Prior versions | CanisterWorm | 2026-03-20 |
| @pypestream/floating-ui-dom | Various | Prior versions | CanisterWorm | 2026-03-20 |
| plain-crypto-js | 4.2.1 | N/A (remove entirely) | RAT dropper | 2026-03-31 |
| n8n community nodes | Various malicious | N/A | OAuth/API key exfil | 2026-01 |

**Historical (still relevant):**
| Package | Versions | Safe | Attack | Date |
|---------|----------|------|--------|------|
| chalk | Compromised versions (Sep 2025) | Verify hashes | Credential theft | 2025-09-08 |
| debug | Compromised versions (Sep 2025) | Verify hashes | Code injection | 2025-09-08 |
| @ctrl/tinycolor | Various | Verify | Shai-Hulud worm | 2025-09-11 |
| @asyncapi/specs | Various | Verify | Shai-Hulud worm | 2025-09-11 |

## Compromised Packages — PyPI

| Package | Malicious Versions | Safe Version | Attack Type | Date |
|---------|-------------------|--------------|-------------|------|
| litellm | 1.82.7, 1.82.8 | <=1.82.6 | 3-stage credential stealer + K8s lateral | 2026-03-24 |
| telnyx | 4.87.1, 4.87.2 | 4.87.0 | WAV steganography credential stealer | 2026-03-27 |
| spellcheckerpy | All versions | N/A (remove) | RAT via Basque dictionary file | 2026-01-20 |
| spellcheckpy | All versions (esp 1.2.0+) | N/A (remove) | RAT via Basque dictionary file | 2026-01-21 |
| sympy-dev | All versions | N/A (remove, use sympy) | XMRig cryptominer | 2026-01-17 |

## Compromised Packages — crates.io (Rust)

| Package | Attack Type | Date |
|---------|-------------|------|
| chrono_anchor | .env exfil + credential theft | 2026-02/03 |
| dnp3times | .env exfil | 2026-02/03 |
| time_calibrator | .env exfil | 2026-02/03 |
| time_calibrators | .env exfil | 2026-02/03 |
| time-sync | .env exfil | 2026-02/03 |

## Compromised GitHub Actions

| Action | Attack | Safe Practice | Date |
|--------|--------|---------------|------|
| aquasecurity/trivy-action | Tag poisoning (75/76 tags) | Pin to verified SHA | 2026-03-19 |
| aquasecurity/setup-trivy | Tag poisoning (all 7 tags) | Pin to verified SHA | 2026-03-19 |
| Checkmarx/kics-github-action | Tag poisoning (all 35 tags) | Pin to verified SHA | 2026-03-23 |
| Checkmarx/ast-github-action | v2.3.28 compromised | Pin to verified SHA | 2026-03-23 |
| tj-actions/changed-files | All version tags modified | Pin to verified SHA | 2025-03-14 |

## Compromised VS Code / IDE Extensions

| Extension | Malicious Version | Platform | Date |
|-----------|-------------------|----------|------|
| ast-results | 2.53.0 | OpenVSX | 2026-03-23 |
| cx-dev-assist | 1.7.0 | OpenVSX | 2026-03-23 |

## Network IOCs — Block These

### C2 Domains
- `scan.aquasecurtiy[.]org` (typosquat of aquasecurity)
- `checkmarx[.]zone`
- `models.litellm[.]cloud`
- `updatenet[.]work` (spellchecker RAT)
- `sfrclak[.]com` (axios RAT — port 8000)
- `timeapis[.]io` (Rust crate exfil)

### C2 IPs
- `45.148.10.212`
- `83.142.209.11`
- `83.142.209.203` (Telnyx C2)
- `172.86.73.139` (spellchecker RAT)
- `63.250.56.54` (sympy-dev miner)

### Blockchain C2
- ICP Canister: `tdtqy-oyaaa-aaaae-af2dq-cai.raw.icp0.io` (CanisterWorm — untakeable)

## Filesystem IOCs

### Linux/macOS
- `/tmp/.fonts-unix/` (AdaptixC2 binaries)
- `~/.local/share/pgmon/service.py` (CanisterWorm persistence)
- `~/.config/sysmon/sysmon.py` (LiteLLM stealer persistence)
- `/tmp/ld.py` (axios Linux payload)
- `/Library/Caches/com.apple.act.mond` (axios macOS RAT)
- Systemd units: `pgmon.service`, `sysmon.service`
- `.pth` files: `litellm_init.pth` (executes on every Python startup)

### Windows
- `C:\Windows\Tasks\` (DLL sideloading)
- `%PROGRAMDATA%\wt.exe` (axios Windows — copies PowerShell)
- Startup folder: `msbuild.exe` (Telnyx persistence)

## Credential Paths Targeted by TeamPCP Stealer

The TeamPCP stealer (used in LiteLLM/Telnyx/CanisterWorm) scans 50+ paths:
- `~/.npmrc`, `/etc/npmrc` (npm tokens)
- `~/.aws/credentials`, `~/.aws/config`
- `~/.config/gcloud/`
- `~/.azure/`
- `~/.kube/config`
- `~/.docker/config.json`
- `~/.ssh/*`
- `~/.gnupg/`
- `~/.env`, `.env` files in project dirs
- `~/.gitconfig`, `.git/config`
- `~/.vault-token`
- `~/.pypirc`
- Shell histories: `~/.bash_history`, `~/.zsh_history`
- Browser credential stores
- AWS Secrets Manager contents and SSM parameters (via API)

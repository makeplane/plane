# Disk Forensics Module

> **Module ID:** DSK-FOR-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Digital Evidence Analysis & Recovery

---

## 1. Overview

Analyzes disk images and file systems to recover evidence, reconstruct timelines, and identify artifacts. Covers image integrity verification, partition analysis, deleted file recovery, file carving, metadata extraction, and timeline construction.

**When to use:** Forensic investigation, CTF challenges, incident response evidence analysis, or when disk images are provided for examination.

**Ethical boundary:** Work only on provided images. Maintain read-only access. Never modify evidence. Refuse unauthorized device access.

---

## 2. Tool Inventory

| Priority  | Tool                                                    | Purpose                           | Install                                 |
| --------- | ------------------------------------------------------- | --------------------------------- | --------------------------------------- |
| Primary   | Sleuth Kit (`fls`, `icat`, `mmls`, `fsstat`, `mactime`) | File system analysis              | `apt install -y sleuthkit`              |
| Primary   | `exiftool`                                              | Metadata extraction               | `apt install -y libimage-exiftool-perl` |
| Primary   | `foremost`                                              | File carving by header signatures | `apt install -y foremost`               |
| Secondary | `scalpel`                                               | Advanced file carving             | `apt install -y scalpel`                |
| Secondary | `bulk_extractor`                                        | Automated data extraction         | `apt install -y bulk-extractor`         |
| Secondary | `binwalk`                                               | Embedded file detection           | `pip3 install binwalk`                  |
| Tertiary  | `ewfinfo`                                               | E01 image metadata                | `apt install -y ewf-tools`              |
| Tertiary  | `steghide`                                              | Steganography detection           | `apt install -y steghide`               |

---

## 3. Evidence Handling Principles

- **Always work on copies**, never originals
- **Verify image integrity** with hash comparison before analysis
- **Mount everything read-only** — never modify source evidence
- **Document every command** and finding
- **Preserve timestamps** — never modify MAC times
- **Chain of custody** for real investigations (not CTFs)

---

## 4. Investigation Workflow

```
1. Image identification — format detection (E01, dd/raw, VMDK, VHD)
2. Integrity verification — SHA256 hash comparison
3. Partition layout — fdisk/mmls, calculate mount offsets
4. Mount read-only — survey file system structure
5. File system analysis — Sleuth Kit (fsstat, fls, icat)
6. Artifact recovery — deleted files, file carving, hidden data
7. Metadata extraction — EXIF, MAC times, $MFT analysis
8. Keyword search — strings grep, bulk_extractor
9. Timeline construction — mactime, cross-reference, anomaly detection
```

---

## 5. CLI Commands & Expected Output

### Image Identification & Integrity

```bash
file <image>                    # Identify format (E01, dd/raw, VMDK, VHD)
sha256sum <image>               # Compare to provided hash
ewfinfo <image.E01>             # E01 metadata (if applicable)
```

### Partition Layout

```bash
fdisk -l <image>                # Partition table
mmls <image>                    # Sleuth Kit partition layout
```

Calculate mount offsets: `sector_start x sector_size`

### Mount & Explore

```bash
mount -o ro,loop,offset=<bytes> <image> /mnt/evidence
ls -laR /mnt/evidence
```

### File System Analysis (Sleuth Kit)

```bash
fsstat -o <offset> <image>              # File system details
fls -r -o <offset> <image>             # Full file listing (deleted = *)
icat -o <offset> <image> <inode>       # Extract file by inode
```

### Deleted File Recovery

```bash
# Find deleted files (marked with *)
fls -r -d -o <offset> <image>

# Extract by inode
icat -o <offset> <image> <inode> > recovered_file
```

### File Carving (Unallocated Space)

```bash
foremost -t all -i <image> -o /tmp/carved/
# or
scalpel <image> -o /tmp/carved/
```

### Hidden Data Detection

- NTFS alternate data streams
- HFS+ resource forks
- Steganography: `exiftool`, `binwalk`, `steghide extract -sf <file>`

### System Artifacts

| Artifact                 | Location                                                 |
| ------------------------ | -------------------------------------------------------- |
| Browser history          | `~/.mozilla`, `~/Library/Safari`, `AppData\Local\Google` |
| System logs              | `/var/log/*`, Windows Event Logs                         |
| Registry hives (Windows) | SAM, SYSTEM, SOFTWARE, NTUSER.DAT                        |
| Recent files             | Recently accessed, MRU lists                             |
| USB history              | `SYSTEM` hive, `/var/log/syslog`                         |
| Prefetch files           | `C:\Windows\Prefetch\`                                   |

### Metadata & Timestamps

```bash
exiftool <file>                 # EXIF, XMP, IPTC metadata
stat <file>                     # MAC times (Modified, Accessed, Changed)
```

For NTFS: examine `$MFT` timestamps and `$UsnJrnl` change journal.

### Keyword Search

```bash
strings <image> | grep -i <keyword>    # Raw string search
bulk_extractor -o /tmp/be_output <image>  # Automated extraction
```

`bulk_extractor` auto-extracts: emails, URLs, credit card numbers, phone numbers, GPS coordinates.

### Timeline Construction

```bash
# Generate body file from Sleuth Kit
fls -r -m "/" -o <offset> <image> > body.txt

# Create timeline
mactime -b body.txt > timeline.csv
```

**Anomaly flags:**

- Timestamps before OS install date
- Future-dated files
- Gaps in continuous log sequences
- Timestamps inconsistent with timezone settings

---

## 6. Output Format

```markdown
# Forensic Analysis Report

## Case: [identifier]

## Image: [filename] -- SHA256: [hash]

## Date of Analysis: [date]

### Image Integrity

- Hash verified: [yes/no]
- Algorithm: [SHA256]

### Partition Layout

| #   | Type | Start | Size | File System |
| --- | ---- | ----- | ---- | ----------- |

### Key Findings

#### Finding 1: [Title]

- **Evidence:** [file path or artifact]
- **Content:** [description]
- **Timestamp:** [UTC]
- **Significance:** [why this matters]

### Recovered Files

| File | Source | Recovery Method | SHA256 | Significance |
| ---- | ------ | --------------- | ------ | ------------ |

### Timeline

| Timestamp (UTC) | Event | Source | Notes |
| --------------- | ----- | ------ | ----- |

### Conclusions

[Summary of findings and their implications]
```

---

## 7. References

- NIST SP 800-86: Guide to Integrating Forensic Techniques
- The Sleuth Kit documentation
- SANS Digital Forensics cheat sheets
- Autopsy (Sleuth Kit GUI)

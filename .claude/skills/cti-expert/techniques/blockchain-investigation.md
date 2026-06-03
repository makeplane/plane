# Blockchain Investigation Module

> **Module ID:** BLKCHAIN-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Cryptocurrency & Blockchain Transaction Intelligence

---

## 1. Overview

Blockchain and cryptocurrency investigation for OSINT. Covers transaction tracing, wallet analysis, scam address detection, exchange identification (off-ramp), cross-chain investigation, and visual flow mapping. All primary tools are free with no authentication required for basic use.

**Key use cases:** Ransomware payment tracking, fraud victim recovery support, darknet market wallet attribution, identifying exchange cash-out addresses, linking on-chain activity to real-world entities.

---

## 2. Tool Inventory

### 2.1 Blockchair — Multi-Chain Explorer

**URL:** https://blockchair.com/

Supports Bitcoin, Ethereum, Litecoin, Bitcoin Cash, Ripple, Stellar, Monero, Dogecoin, and 10+ others. Privacy-focused explorer with SQL-like query interface.

- **Usage:** Search by address, transaction hash, or block number; use advanced search for cross-chain queries
- **Strength:** Single interface across 15+ chains; supports complex data queries
- **Limitation:** API rate limits on free tier; Monero tracing is fundamentally limited by protocol privacy

### 2.2 Etherscan — Ethereum Explorer

**URL:** https://etherscan.io/

The canonical Ethereum blockchain explorer. Shows transactions, ERC-20/ERC-721 token transfers, internal transactions, contract source code, and gas usage.

- **Usage:** Paste ETH address or transaction hash → full history, token holdings, contract interactions
- **Strength:** Labeled addresses (exchanges, protocols, known scammers); token approval tracking
- **Limitation:** Ethereum only; requires API key for programmatic access beyond basic queries

### 2.3 WalletExplorer — Bitcoin Wallet Clustering

**URL:** https://www.walletexplorer.com/

Groups Bitcoin addresses by common ownership using change address heuristics. Identifies if an address belongs to a known exchange, service, or wallet cluster.

- **Usage:** Paste BTC address → see full wallet cluster, labeled entity name if known
- **Strength:** Identifies exchange deposit addresses and mixing services by cluster label
- **Limitation:** Heuristics can be defeated by CoinJoin and careful UTXO management

### 2.4 OXT.me — Bitcoin Visual Analysis

**URL:** https://oxt.me/

Bitcoin blockchain visualization and analysis platform. Provides transaction flow graphs, wallet clustering, and path-finding between addresses.

- **Usage:** Paste BTC address → interactive transaction flow graph showing funds in/out
- **Strength:** Visual representation makes fund flow immediately readable; path-finding between two addresses
- **Limitation:** Bitcoin only; graph rendering slow for high-volume addresses

### 2.5 Chainabuse — Scam Address Database

**URL:** https://www.chainabuse.com/

Community-driven database of cryptocurrency addresses flagged for fraud, scams, ransomware, and theft. Multi-chain. Submit reports and search existing ones.

- **Usage:** Search any address → see scam reports, category (phishing/ransomware/rug pull), victim count
- **Strength:** First-stop check before deeper analysis; reveals known bad actors instantly
- **Limitation:** Only covers reported addresses; new or unreported scam addresses return no results

### 2.6 Breadcrumbs — Multi-Chain Investigation Platform

**URL:** https://www.breadcrumbs.app/

Multi-chain visual investigation tool with entity labels and transaction graph mapping. Free tier supports basic tracing.

- **Usage:** Paste address → visual graph of transaction flows with labeled entities (exchanges, DeFi protocols)
- **Strength:** Cross-chain visibility; entity labeling simplifies off-ramp identification
- **Limitation:** Free tier limits graph depth; advanced features require paid subscription

---

## 3. Chain-Specific Explorers

| Chain           | Explorer       | URL                                 |
| --------------- | -------------- | ----------------------------------- |
| Ethereum        | Etherscan      | https://etherscan.io/               |
| Bitcoin         | Blockchain.com | https://www.blockchain.com/explorer |
| Solana          | Solscan        | https://solscan.io/                 |
| BNB Chain       | BSCScan        | https://bscscan.com/                |
| Polygon         | Polygonscan    | https://polygonscan.com/            |
| Avalanche       | Snowtrace      | https://snowtrace.io/               |
| Tron            | Tronscan       | https://tronscan.org/               |
| Multi-chain     | Blockchair     | https://blockchair.com/             |
| Multi-chain EVM | Breadcrumbs    | https://www.breadcrumbs.app/        |

---

## 4. Investigation Workflow

```
Step 1: Identify blockchain from address format
  └─ BTC: starts with 1 (P2PKH), 3 (P2SH), or bc1 (Bech32/Taproot)
  └─ ETH/EVM: starts with 0x, 42 hex characters total
  └─ SOL: base58 encoded, 32–44 characters
  └─ XRP: starts with r, ~34 alphanumeric characters
  └─ If unsure: paste into Blockchair — it auto-detects chain

Step 2: Scam database check (Chainabuse)
  └─ Search address before spending time on deeper analysis
  └─ If flagged → document report count, category, and first report date
  └─ Note: absence of report does NOT clear the address

Step 3: Transaction history exploration (Blockchair or chain-specific explorer)
  └─ Record: first transaction date, total received, total sent, current balance
  └─ Identify funding sources (first inbound transactions)
  └─ Identify destinations (outbound transactions, especially large ones)
  └─ Flag exchange deposit addresses — these represent fiat off-ramps

Step 4: Wallet clustering (WalletExplorer for BTC; Etherscan labels for ETH)
  └─ Find related addresses controlled by same entity
  └─ Note any labeled clusters (Binance, Coinbase, known mixers)
  └─ Calculate total funds across full cluster, not just target address

Step 5: Visual flow mapping (OXT.me for BTC; Breadcrumbs for multi-chain)
  └─ Generate transaction flow graph
  └─ Identify patterns: peel chains, consolidation, mixing service usage
  └─ Use path-finding between suspect address and known exchange address

Step 6: Cross-reference with external OSINT
  └─ Google the address in quotes — check forum posts, Pastebin, GitHub issues
  └─ Search address in ransomware payment trackers (ransomwhe.re)
  └─ Check if address appears in darknet market references
  └─ Link to domain/email if found in phishing kit source or scam page HTML
```

---

## 5. CLI Commands & Expected Output

```bash
# Blockchair API — Bitcoin address summary (free, no key required)
curl -s "https://api.blockchair.com/bitcoin/dashboards/address/<BTC_ADDRESS>" \
  | jq '.data["<BTC_ADDRESS>"].address | {balance, received: .received, spent: .spent, transaction_count}'

# Expected output:
# {
#   "balance": 150000,
#   "received": 5000000,
#   "spent": 4850000,
#   "transaction_count": 47
# }
# Note: values in satoshis (divide by 100000000 for BTC)

# Blockchain.com API — BTC address details (free, no key)
curl -s "https://blockchain.info/rawaddr/<BTC_ADDRESS>?limit=5" \
  | jq '{balance: .final_balance, n_tx: .n_tx, total_received: .total_received}'

# Expected output:
# {
#   "balance": 150000,
#   "n_tx": 47,
#   "total_received": 5000000
# }

# Blockchair — Ethereum address summary
curl -s "https://api.blockchair.com/ethereum/dashboards/address/<ETH_ADDRESS>" \
  | jq '.data["<ETH_ADDRESS>"].address | {balance, transaction_count}'

# Blockchair — multi-chain address search (auto-detects chain)
curl -s "https://api.blockchair.com/search?q=<ADDRESS>" | jq '.data'

# Ransomware address lookup (ransomwhe.re — free, no key)
curl -s "https://api.ransomwhe.re/export" \
  | jq --arg addr "<BTC_ADDRESS>" '.result[] | select(.address == $addr)'

# Expected output if found:
# {
#   "address": "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
#   "family": "LockBit",
#   "reportedAt": "2023-11-20T14:33:00Z"
# }
```

---

## 6. Analysis & Interpretation Guidance

### Address Format Quick Reference

| Format  | Chain                | Example Prefix | Length      |
| ------- | -------------------- | -------------- | ----------- |
| P2PKH   | Bitcoin              | `1`            | 26–34 chars |
| P2SH    | Bitcoin              | `3`            | 34 chars    |
| Bech32  | Bitcoin SegWit       | `bc1q`         | 42 chars    |
| Taproot | Bitcoin              | `bc1p`         | 62 chars    |
| EVM     | Ethereum/BSC/Polygon | `0x`           | 42 chars    |
| Base58  | Solana               | varies         | 32–44 chars |
| Base58  | Ripple XRP           | `r`            | ~34 chars   |

### Transaction Pattern Recognition

| Pattern          | Description                                                               | Significance                                                 |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Peel chain       | Long chain of single-output transactions, each peeling off a small amount | Layering; funds moving through intermediary wallets          |
| Fan-out          | One address sending to many addresses simultaneously                      | Distribution to victims (airdrop scam) or layering           |
| Consolidation    | Many addresses sending to one                                             | Aggregating funds before exchange deposit                    |
| Round numbers    | Transactions in exactly 1.0 BTC, 10 ETH, etc.                             | Often OTC trades or structured payments                      |
| Mixer usage      | Funds enter/exit CoinJoin or Tornado Cash                                 | Deliberate obfuscation; note entry and exit addresses        |
| Exchange deposit | Outbound tx to known exchange cluster                                     | Off-ramp attempt; document exchange name and deposit address |

### Exchange Identification

Deposits to centralized exchanges (Binance, Coinbase, Kraken, etc.) represent the most actionable off-ramp intelligence. Identified exchange addresses can support legal requests for KYC data.

- WalletExplorer and Breadcrumbs label known exchange deposit addresses
- Exchange addresses typically receive from many senders (aggregation pattern)
- Confirm via Etherscan "Name Tag" on ETH addresses

### Mixer & Privacy Tool Detection

| Tool           | Chain | Detection                                                      |
| -------------- | ----- | -------------------------------------------------------------- |
| CoinJoin       | BTC   | Many equal-value inputs and outputs in one tx                  |
| Wasabi Wallet  | BTC   | Characteristic CoinJoin structure with 0.1 BTC outputs         |
| Tornado Cash   | ETH   | Transactions to/from known Tornado Cash contract addresses     |
| Monero         | XMR   | All transactions are private by protocol; tracing not feasible |
| Zcash shielded | ZEC   | Transactions to/from shielded pool (z-addresses)               |

---

## 7. Confidence Ratings

| Finding                                  | Confidence  | Notes                                              |
| ---------------------------------------- | ----------- | -------------------------------------------------- |
| Address balance and transaction count    | HIGH        | On-chain, immutable data                           |
| Exchange deposit address label           | HIGH        | Confirmed by cluster analysis                      |
| Chainabuse scam report                   | MEDIUM-HIGH | Community-sourced; verify report quality           |
| Wallet cluster attribution               | MEDIUM      | Heuristics can fail with CoinJoin/careful UTXO use |
| Ransomwhe.re family attribution          | MEDIUM-HIGH | Researcher-verified submissions                    |
| AI geolocation of entity from chain data | LOW         | Indirect inference only                            |

---

## 8. Related Techniques

- [scam-check.md](scam-check.md) — Broader fraud and scam investigation workflow
- [threat-intel.md](threat-intel.md) — Correlate wallet addresses with threat actor profiles
- [web-dns-forensics.md](web-dns-forensics.md) — Link blockchain addresses found in web/DNS artifacts

---

_Blockchain Investigation Module v1.0.0_
_Part of CTI Expert Skill - Phase 5 Enhancement Modules_

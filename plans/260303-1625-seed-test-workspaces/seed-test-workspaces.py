#!/usr/bin/env python3
"""Seed 99 bank department workspaces for testing.

Creates 99 workspaces with 5-7 projects each, assigns mock users with varied roles.
Idempotent: re-run skips existing workspaces/projects.
"""

import requests
import time
import sys

API_BASE = "http://localhost:8000"
ADMIN_EMAIL = "duong@shinhan.com"
ADMIN_PASSWORD = "Shinhan@1"

MOCK_USERS = [
    {"email": "sh10000001@swing.shinhan.com", "first_name": "Mock", "last_name": "User 1"},
    {"email": "sh10000002@swing.shinhan.com", "first_name": "Mock", "last_name": "User 2"},
    {"email": "sh10000003@swing.shinhan.com", "first_name": "Mock", "last_name": "User 3"},
    {"email": "sh10000004@swing.shinhan.com", "first_name": "Mock", "last_name": "User 4"},
    {"email": "sh10000005@swing.shinhan.com", "first_name": "Mock", "last_name": "User 5"},
]

# fmt: off
DEPARTMENTS = [
    {"name": "IT Development", "slug": "it-development", "projects": [
        ("Core Banking Upgrade", "CBU"), ("Mobile App v3", "MAV"), ("API Gateway", "AGW"),
        ("CI/CD Pipeline", "CCD"), ("Security Audit Q1", "SAQ")]},
    {"name": "IT Infrastructure", "slug": "it-infrastructure", "projects": [
        ("Cloud Migration", "CLM"), ("Network Modernization", "NMD"), ("Data Center Ops", "DCO"),
        ("Monitoring Dashboard", "MON"), ("Disaster Recovery", "DRP")]},
    {"name": "IT Security", "slug": "it-security", "projects": [
        ("SOC Enhancement", "SOC"), ("Penetration Testing", "PEN"), ("IAM Upgrade", "IAM"),
        ("Firewall Rules Review", "FWR"), ("Endpoint Protection", "EPT"), ("Threat Intelligence", "THI")]},
    {"name": "IT Operations", "slug": "it-operations", "projects": [
        ("Incident Management", "INC"), ("Change Management", "CHM"), ("Capacity Planning", "CAP"),
        ("Service Desk Upgrade", "SDK"), ("ITIL Implementation", "ITL")]},
    {"name": "IT Support", "slug": "it-support", "projects": [
        ("Help Desk Portal", "HDP"), ("Knowledge Base", "KNB"), ("Remote Support Tools", "RST"),
        ("Asset Management", "ASM"), ("SLA Monitoring", "SLA")]},
    {"name": "Retail Banking", "slug": "retail-banking", "projects": [
        ("Savings Product Launch", "SPL"), ("Personal Loan Portal", "PLP"), ("Branch Digitization", "BRD"),
        ("Customer Onboarding", "CON"), ("Cross-sell Analytics", "CSA"), ("Fee Structure Review", "FSR")]},
    {"name": "Corporate Banking", "slug": "corporate-banking", "projects": [
        ("Corporate Portal v2", "CPV"), ("Syndicated Loans", "SYN"), ("Cash Management", "CSM"),
        ("Supply Chain Finance", "SCF"), ("Corporate FX", "CFX")]},
    {"name": "Investment Banking", "slug": "investment-banking", "projects": [
        ("Deal Pipeline CRM", "DPC"), ("IPO Management", "IPO"), ("M&A Due Diligence", "MAD"),
        ("Equity Research Platform", "ERP"), ("Bond Issuance", "BIS")]},
    {"name": "Private Banking", "slug": "private-banking", "projects": [
        ("Wealth Dashboard", "WDB"), ("Portfolio Advisory", "PAD"), ("Trust Services", "TRS"),
        ("Estate Planning", "ESP"), ("Private Client App", "PCA"), ("HNW Reporting", "HNW")]},
    {"name": "Risk Management", "slug": "risk-management", "projects": [
        ("Enterprise Risk Framework", "ERF"), ("Risk Appetite Dashboard", "RAD"), ("Stress Testing", "STT"),
        ("Risk Data Warehouse", "RDW"), ("Basel IV Compliance", "BIV")]},
    {"name": "Credit Risk", "slug": "credit-risk", "projects": [
        ("Credit Scoring Model", "CSC"), ("PD/LGD Calibration", "PLG"), ("Loan Review System", "LRS"),
        ("Early Warning System", "EWS"), ("Concentration Risk", "COR")]},
    {"name": "Market Risk", "slug": "market-risk", "projects": [
        ("VaR Engine Upgrade", "VAR"), ("Interest Rate Risk", "IRR"), ("FX Exposure Tracker", "FXE"),
        ("Liquidity Risk Model", "LRM"), ("Sensitivity Analysis", "SEN")]},
    {"name": "Operational Risk", "slug": "operational-risk", "projects": [
        ("RCSA Platform", "RCS"), ("Loss Event Database", "LED"), ("KRI Dashboard", "KRI"),
        ("Scenario Analysis Tool", "SAT"), ("Op Risk Reporting", "OPR")]},
    {"name": "Finance and Accounting", "slug": "finance-accounting", "projects": [
        ("GL Modernization", "GLM"), ("Financial Close Automation", "FCA"), ("Cost Allocation", "COA"),
        ("Regulatory Reporting", "RGR"), ("Budget Planning Tool", "BPT"), ("IFRS 9 Implementation", "IF9")]},
    {"name": "Treasury", "slug": "treasury", "projects": [
        ("ALM System Upgrade", "ALM"), ("Liquidity Forecasting", "LQF"), ("Fund Transfer Pricing", "FTP"),
        ("Investment Portfolio", "IVP"), ("Collateral Management", "CLT")]},
    {"name": "Internal Audit", "slug": "internal-audit", "projects": [
        ("Audit Management System", "AMS"), ("Continuous Auditing", "CNA"), ("Audit Universe Mapping", "AUM"),
        ("Issue Tracking Portal", "ITP"), ("Data Analytics Audit", "DAA")]},
    {"name": "Compliance", "slug": "compliance", "projects": [
        ("Regulatory Change Mgmt", "RCM"), ("Policy Management", "PLM"), ("Training Tracker", "TRK"),
        ("Compliance Calendar", "CCL"), ("Whistleblower Portal", "WBP"), ("Sanctions Screening", "SSC")]},
    {"name": "Human Resources", "slug": "human-resources", "projects": [
        ("Recruitment Portal", "REC"), ("Performance Review", "PRV"), ("Training LMS", "LMS"),
        ("Employee Self-Service", "ESS"), ("Payroll Integration", "PAY")]},
    {"name": "Training and Development", "slug": "training-development", "projects": [
        ("E-Learning Platform", "ELP"), ("Certification Tracker", "CRT"), ("Onboarding Program", "ONB"),
        ("Leadership Academy", "LAC"), ("Skills Matrix", "SKM")]},
    {"name": "Legal Department", "slug": "legal-department", "projects": [
        ("Contract Management", "CNT"), ("Litigation Tracker", "LIT"), ("Legal Opinion Database", "LOD"),
        ("Regulatory Filing", "RGF"), ("IP Portfolio", "IPP")]},
    {"name": "Marketing", "slug": "marketing", "projects": [
        ("Campaign Manager", "CMP"), ("Brand Guidelines Portal", "BGP"), ("Market Research Hub", "MRH"),
        ("Digital Ad Platform", "DAP"), ("Customer Segmentation", "SEG"), ("Event Management", "EVT")]},
    {"name": "PR and Communications", "slug": "pr-communications", "projects": [
        ("Media Monitoring", "MMO"), ("Press Release Mgmt", "PRM"), ("Internal Comms Portal", "ICP"),
        ("Crisis Communication", "CRC"), ("Social Media Mgmt", "SMM")]},
    {"name": "Branch Operations", "slug": "branch-operations", "projects": [
        ("Branch Performance KPI", "BPK"), ("Queue Management", "QMG"), ("Cash Vault System", "CVS"),
        ("Branch Renovation", "BRN"), ("Staff Scheduling", "STS")]},
    {"name": "ATM and Card Services", "slug": "atm-card-services", "projects": [
        ("ATM Fleet Management", "AFM"), ("Card Issuance System", "CIS"), ("Fraud Detection", "FRD"),
        ("Contactless Rollout", "CLR"), ("Card Rewards Program", "CRP"), ("Chip Migration", "CHI")]},
    {"name": "Digital Banking", "slug": "digital-banking", "projects": [
        ("Internet Banking v4", "IBV"), ("Mobile Banking UX", "MBU"), ("Open Banking APIs", "OBA"),
        ("Digital Wallet", "DWL"), ("Chatbot AI", "CBA"), ("Biometric Auth", "BIO")]},
    {"name": "E-Banking", "slug": "e-banking", "projects": [
        ("Online Payment Gateway", "OPG"), ("Bill Payment Service", "BPS"), ("QR Pay Integration", "QRP"),
        ("Virtual Account", "VAC"), ("E-Statement Portal", "EST")]},
    {"name": "Trade Finance", "slug": "trade-finance", "projects": [
        ("LC Processing System", "LCP"), ("Trade Document Mgmt", "TDM"), ("BG Issuance", "BGI"),
        ("Trade Compliance", "TCO"), ("Blockchain Trade", "BCT")]},
    {"name": "Foreign Exchange", "slug": "foreign-exchange", "projects": [
        ("FX Trading Platform", "FXT"), ("Rate Board System", "RBS"), ("FX Position Mgmt", "FPM"),
        ("Remittance Processing", "RMP"), ("FX Analytics", "FXA")]},
    {"name": "Loan Processing", "slug": "loan-processing", "projects": [
        ("Loan Origination System", "LOS"), ("Credit Decision Engine", "CDE"), ("Document Verification", "DVR"),
        ("Disbursement Mgmt", "DSB"), ("Loan Tracking Portal", "LTP")]},
    {"name": "Debt Recovery", "slug": "debt-recovery", "projects": [
        ("Collection System", "CLS"), ("Legal Recovery Portal", "LRP"), ("Write-off Management", "WOM"),
        ("Debt Restructuring", "DRS"), ("Recovery Analytics", "RAN")]},
    {"name": "Customer Service", "slug": "customer-service", "projects": [
        ("CRM Enhancement", "CRM"), ("Complaint Management", "CPM"), ("NPS Survey Tool", "NPS"),
        ("Service Quality Monitor", "SQM"), ("Customer Journey Map", "CJM")]},
    {"name": "Call Center", "slug": "call-center", "projects": [
        ("IVR Modernization", "IVR"), ("Agent Desktop", "ADT"), ("Call Recording System", "CRS"),
        ("Workforce Management", "WFM"), ("Quality Assurance", "QAS")]},
    {"name": "VIP Services", "slug": "vip-services", "projects": [
        ("VIP Client Portal", "VCP"), ("Priority Service Queue", "PSQ"), ("Relationship Mgmt", "RMG"),
        ("VIP Event Platform", "VEP"), ("Exclusive Offers Mgmt", "EOM")]},
    {"name": "Facilities Management", "slug": "facilities-management", "projects": [
        ("Building Management", "BMG"), ("Energy Efficiency", "ENE"), ("Space Planning", "SPC"),
        ("Maintenance Scheduler", "MNT"), ("Security Access Control", "SAC")]},
    {"name": "Procurement", "slug": "procurement", "projects": [
        ("Vendor Management", "VMG"), ("E-Procurement Portal", "EPR"), ("Contract Lifecycle", "CLC"),
        ("Supplier Evaluation", "SUE"), ("Purchase Order System", "POS")]},
    {"name": "General Affairs", "slug": "general-affairs", "projects": [
        ("Document Archive", "DAR"), ("Travel Management", "TVM"), ("Fleet Management", "FLM"),
        ("Office Supplies Portal", "OSP"), ("Visitor Management", "VIS")]},
    {"name": "Secretary Office", "slug": "secretary-office", "projects": [
        ("Board Meeting Portal", "BMP"), ("Minutes Management", "MIM"), ("Executive Calendar", "EXC"),
        ("Confidential Filing", "CFI"), ("Shareholder Relations", "SHR")]},
    {"name": "Anti-Money Laundering", "slug": "anti-money-laundering", "projects": [
        ("AML Screening Engine", "AML"), ("Transaction Monitoring", "TMO"), ("STR Filing System", "STR"),
        ("Customer Due Diligence", "CDD"), ("PEP Screening", "PEP"), ("Sanctions List Mgmt", "SLM")]},
    {"name": "Fraud Prevention", "slug": "fraud-prevention", "projects": [
        ("Fraud Detection AI", "FDA"), ("Case Management", "FCM"), ("Real-time Alerts", "RTA"),
        ("Device Fingerprinting", "DFP"), ("Behavioral Analytics", "BEH")]},
    {"name": "Data Analytics", "slug": "data-analytics", "projects": [
        ("Data Lake Platform", "DLP"), ("ETL Pipeline", "ETL"), ("Reporting Dashboard", "RPD"),
        ("Predictive Models", "PDM"), ("Data Governance", "DGV"), ("ML Ops Platform", "MLP")]},
    {"name": "Business Intelligence", "slug": "business-intelligence", "projects": [
        ("BI Dashboard Suite", "BDS"), ("Executive Reporting", "EXR"), ("Ad-hoc Query Tool", "AQT"),
        ("Data Visualization", "DVZ"), ("KPI Scorecard", "KPS")]},
    {"name": "Project Management Office", "slug": "project-management-office", "projects": [
        ("Portfolio Dashboard", "PFD"), ("Resource Allocation", "RAL"), ("Project Governance", "PGV"),
        ("Benefit Realization", "BNR"), ("PMO Templates", "PMT")]},
    {"name": "Quality Assurance", "slug": "quality-assurance", "projects": [
        ("Test Automation", "TAU"), ("QA Dashboard", "QAD"), ("Defect Tracking", "DFT"),
        ("Performance Testing", "PFT"), ("UAT Management", "UAT")]},
    {"name": "Change Management", "slug": "change-management", "projects": [
        ("Change Request Portal", "CRP"), ("Impact Assessment Tool", "IAT"), ("Stakeholder Comms", "SHC"),
        ("Training Readiness", "TRR"), ("Go-Live Checklist", "GLC")]},
    {"name": "Information Technology Governance", "slug": "it-governance", "projects": [
        ("IT Policy Portal", "ITP"), ("Architecture Review Board", "ARB"), ("Tech Roadmap", "TRM"),
        ("Vendor Assessment", "VAS"), ("IT Budget Tracker", "IBT")]},
    {"name": "Wealth Management", "slug": "wealth-management", "projects": [
        ("Advisory Platform", "ADP"), ("Fund Selection Tool", "FST"), ("Client Reporting", "CLR"),
        ("Robo-Advisor", "ROB"), ("Wealth Planning", "WPL")]},
    {"name": "Insurance Services", "slug": "insurance-services", "projects": [
        ("Bancassurance Portal", "BAP"), ("Claims Processing", "CLP"), ("Policy Admin System", "PAS"),
        ("Agent Commission", "AGC"), ("Product Catalog", "PCG")]},
    {"name": "Securities Services", "slug": "securities-services", "projects": [
        ("Custody Platform", "CSP"), ("Fund Accounting", "FAC"), ("Corporate Actions", "COA"),
        ("Transfer Agency", "TRA"), ("NAV Calculation", "NAV")]},
    {"name": "Payment Services", "slug": "payment-services", "projects": [
        ("SWIFT Messaging", "SWF"), ("Domestic Clearing", "DMC"), ("Real-time Payments", "RTP"),
        ("Payment Hub", "PHB"), ("Reconciliation Engine", "RCE"), ("ISO 20022 Migration", "ISO")]},
    {"name": "Correspondent Banking", "slug": "correspondent-banking", "projects": [
        ("Nostro Management", "NOS"), ("SWIFT Alliance", "SWA"), ("KYC for Banks", "KYB"),
        ("Fee Billing System", "FBS"), ("Relationship Portal", "RLP")]},
    {"name": "Consumer Lending", "slug": "consumer-lending", "projects": [
        ("Auto Loan Portal", "ALP"), ("Mortgage Platform", "MGP"), ("Student Loan System", "SLS"),
        ("Micro-lending App", "MLA"), ("Lending Analytics", "LAN")]},
    {"name": "SME Banking", "slug": "sme-banking", "projects": [
        ("SME Onboarding", "SMO"), ("Working Capital", "WCL"), ("Invoice Financing", "INF"),
        ("SME Dashboard", "SMD"), ("Credit Assessment", "CAS")]},
    {"name": "Agricultural Finance", "slug": "agricultural-finance", "projects": [
        ("Agri Loan System", "AGL"), ("Crop Insurance", "CIN"), ("Warehouse Receipt", "WHR"),
        ("Farm Management Portal", "FMP"), ("Rural Banking App", "RBA")]},
    {"name": "Real Estate Finance", "slug": "real-estate-finance", "projects": [
        ("Property Valuation", "PVL"), ("Mortgage Origination", "MOR"), ("Construction Finance", "COF"),
        ("Escrow Management", "ESM"), ("Title Verification", "TVR")]},
    {"name": "Corporate Trust", "slug": "corporate-trust", "projects": [
        ("Trust Administration", "TAD"), ("Escrow Services", "ESC"), ("Paying Agent", "PAG"),
        ("Indenture Tracking", "IDT"), ("Trustee Reporting", "TRP")]},
    {"name": "Investor Relations", "slug": "investor-relations", "projects": [
        ("IR Website", "IRW"), ("Earnings Call Portal", "EAR"), ("Shareholder Database", "SDB"),
        ("Annual Report Mgmt", "ARM"), ("ESG Reporting", "ESG")]},
    {"name": "Corporate Strategy", "slug": "corporate-strategy", "projects": [
        ("Strategic Plan Portal", "SPP"), ("Market Analysis", "MAN"), ("Competitor Intelligence", "CIN"),
        ("M&A Pipeline", "MAP"), ("Scenario Planning", "SCN")]},
    {"name": "Product Development", "slug": "product-development", "projects": [
        ("Product Lifecycle Mgmt", "PLF"), ("Feature Roadmap", "FRM"), ("Customer Feedback", "CFB"),
        ("A/B Testing Platform", "ABT"), ("Product Analytics", "PAN"), ("Pricing Engine", "PRE")]},
    {"name": "Channel Management", "slug": "channel-management", "projects": [
        ("Omnichannel Platform", "OCP"), ("Branch Network", "BNW"), ("ATM Channel", "ATC"),
        ("Digital Channel", "DGC"), ("Agent Banking", "AGB")]},
    {"name": "Credit Administration", "slug": "credit-administration", "projects": [
        ("Limit Management", "LMG"), ("Covenant Monitoring", "CVM"), ("Collateral Valuation", "CLV"),
        ("Credit File Digitization", "CFD"), ("Approval Workflow", "APW")]},
    {"name": "Loan Syndication", "slug": "loan-syndication", "projects": [
        ("Deal Structuring", "DLS"), ("Participant Portal", "PPT"), ("Drawdown Management", "DDM"),
        ("Agent Fee System", "AFS"), ("Syndicate Reporting", "SYR")]},
    {"name": "Structured Finance", "slug": "structured-finance", "projects": [
        ("Securitization Platform", "SCP"), ("SPV Management", "SPV"), ("Cash Flow Modeling", "CFM"),
        ("Tranching Engine", "TRE"), ("Investor Reporting", "IVR")]},
    {"name": "Financial Crime", "slug": "financial-crime", "projects": [
        ("Crime Intelligence Hub", "CIH"), ("Investigation Mgmt", "IMG"), ("Regulatory Filing", "RFI"),
        ("Watchlist Management", "WLM"), ("Network Analysis", "NAN")]},
    {"name": "Data Management", "slug": "data-management", "projects": [
        ("Master Data Mgmt", "MDM"), ("Data Quality Monitor", "DQM"), ("Metadata Catalog", "MTC"),
        ("Data Lineage Tracker", "DLT"), ("Privacy Compliance", "PRC")]},
    {"name": "Cloud Services", "slug": "cloud-services", "projects": [
        ("Cloud Strategy", "CLS"), ("Migration Factory", "MGF"), ("Cloud Security", "CSE"),
        ("Cost Optimization", "COT"), ("Multi-cloud Mgmt", "MCM")]},
    {"name": "DevOps", "slug": "devops", "projects": [
        ("Pipeline Automation", "PLA"), ("Container Platform", "CTP"), ("Config Management", "CFG"),
        ("Observability Stack", "OBS"), ("Release Management", "RLM")]},
    {"name": "Architecture", "slug": "architecture", "projects": [
        ("EA Repository", "EAR"), ("API Catalog", "APC"), ("Reference Architecture", "REF"),
        ("Tech Radar", "TRD"), ("Integration Patterns", "INP")]},
    {"name": "Innovation Lab", "slug": "innovation-lab", "projects": [
        ("Blockchain POC", "BPC"), ("AI Chatbot", "AIC"), ("IoT Banking", "IOT"),
        ("Quantum Computing", "QTC"), ("Metaverse Banking", "MTB"), ("GenAI Platform", "GAI")]},
    {"name": "Regulatory Affairs", "slug": "regulatory-affairs", "projects": [
        ("Reg Change Tracker", "RCT"), ("Licensing Portal", "LIC"), ("Examination Prep", "EXP"),
        ("Consent Order Mgmt", "COM"), ("Regulatory Calendar", "RGC")]},
    {"name": "Business Continuity", "slug": "business-continuity", "projects": [
        ("BCP Portal", "BCP"), ("Crisis Management", "CRM"), ("DR Testing", "DRT"),
        ("Pandemic Response", "PNR"), ("Communication Tree", "CTR")]},
    {"name": "Information Security", "slug": "information-security", "projects": [
        ("SIEM Enhancement", "SIE"), ("DLP Implementation", "DLI"), ("Crypto Key Mgmt", "CKM"),
        ("Security Awareness", "SAW"), ("Incident Response", "INR")]},
    {"name": "Physical Security", "slug": "physical-security", "projects": [
        ("CCTV Network", "CTV"), ("Access Badge System", "ABS"), ("Alarm Monitoring", "ALR"),
        ("Guard Management", "GDM"), ("Safe Deposit Vault", "SDV")]},
    {"name": "Economic Research", "slug": "economic-research", "projects": [
        ("Macro Analysis", "MCA"), ("Industry Reports", "IND"), ("Interest Rate Forecast", "IRF"),
        ("FX Research", "FXR"), ("Economic Calendar", "ECL")]},
    {"name": "Credit Bureau Relations", "slug": "credit-bureau-relations", "projects": [
        ("CIC Reporting", "CIC"), ("Data Submission", "DSM"), ("Dispute Resolution", "DPR"),
        ("Score Integration", "SIN"), ("Bureau Analytics", "BAN")]},
    {"name": "Tax Planning", "slug": "tax-planning", "projects": [
        ("Tax Compliance System", "TCS"), ("Transfer Pricing", "TPR"), ("Tax Reporting Portal", "TAX"),
        ("FATCA/CRS Compliance", "FAT"), ("Tax Optimization", "TOP")]},
    {"name": "Corporate Secretariat", "slug": "corporate-secretariat", "projects": [
        ("Board Portal", "BPT"), ("Resolution Tracking", "RST"), ("AGM Management", "AGM"),
        ("Regulatory Filing", "RGF"), ("Governance Dashboard", "GOV")]},
    {"name": "Sustainable Finance", "slug": "sustainable-finance", "projects": [
        ("Green Bond Framework", "GBF"), ("ESG Scoring", "ESS"), ("Climate Risk", "CLR"),
        ("Social Impact Fund", "SIF"), ("Sustainability Report", "SUR")]},
    {"name": "Fintech Partnership", "slug": "fintech-partnership", "projects": [
        ("API Marketplace", "APM"), ("Partner Portal", "PPL"), ("Integration Hub", "IHB"),
        ("Revenue Sharing", "RVS"), ("Compliance Gateway", "CGW")]},
    {"name": "Microfinance", "slug": "microfinance", "projects": [
        ("Group Lending App", "GLA"), ("Village Banking", "VBK"), ("Micro-insurance", "MIN"),
        ("Social Collateral", "SCL"), ("Impact Measurement", "IMP")]},
    {"name": "Remittance Services", "slug": "remittance-services", "projects": [
        ("Cross-border Transfer", "CBT"), ("Agent Network", "ANT"), ("Compliance Checker", "CCK"),
        ("Fee Calculator", "FEC"), ("Corridor Management", "CRM")]},
    {"name": "Treasury Operations", "slug": "treasury-operations", "projects": [
        ("Deal Capture System", "DCS"), ("Settlement Engine", "STE"), ("Confirmation Matching", "CMT"),
        ("Netting System", "NET"), ("Treasury Reporting", "TRE")]},
    {"name": "Model Validation", "slug": "model-validation", "projects": [
        ("Model Inventory", "MVI"), ("Backtesting Framework", "BTF"), ("Benchmark Analysis", "BMA"),
        ("Model Risk Dashboard", "MRD"), ("Documentation Standards", "DST")]},
    {"name": "Customer Experience", "slug": "customer-experience", "projects": [
        ("CX Analytics", "CXA"), ("Journey Optimization", "JOT"), ("Voice of Customer", "VOC"),
        ("Experience Design Lab", "EDL"), ("Touchpoint Mapping", "TPM"), ("Personalization Engine", "PEN")]},
    {"name": "Digital Transformation", "slug": "digital-transformation", "projects": [
        ("Transformation Roadmap", "TFR"), ("Legacy Modernization", "LGM"), ("Process Automation", "PRA"),
        ("Digital Adoption", "DGA"), ("Innovation Metrics", "INM")]},
    {"name": "Vendor Management", "slug": "vendor-management", "projects": [
        ("Vendor Risk Assessment", "VRA"), ("SLA Monitoring", "SLM"), ("License Tracking", "LCT"),
        ("Vendor Portal", "VPT"), ("Cost Benchmarking", "CBM")]},
    {"name": "Network Operations Center", "slug": "network-operations-center", "projects": [
        ("NOC Dashboard", "NOC"), ("Incident Triage", "ITR"), ("Capacity Monitoring", "CPM"),
        ("Link Management", "LNK"), ("Performance SLA", "PSL")]},
    {"name": "Core Banking", "slug": "core-banking", "projects": [
        ("CBS Upgrade", "CBS"), ("Account Management", "ACM"), ("Interest Calculation", "ICL"),
        ("EOD Processing", "EOD"), ("Parameter Configuration", "PCF")]},
    {"name": "Middleware Services", "slug": "middleware-services", "projects": [
        ("ESB Platform", "ESB"), ("Message Queue", "MSQ"), ("API Management", "APG"),
        ("Service Registry", "SRG"), ("Integration Monitoring", "IMG")]},
    {"name": "Database Administration", "slug": "database-administration", "projects": [
        ("DB Performance Tuning", "DBP"), ("Backup Strategy", "BKS"), ("Migration Tools", "MGT"),
        ("Replication Setup", "REP"), ("Capacity Planning", "CPL")]},
    {"name": "Mobile Development", "slug": "mobile-development", "projects": [
        ("iOS Banking App", "IOS"), ("Android Banking App", "AND"), ("Cross-platform SDK", "XPK"),
        ("Push Notification", "PSH"), ("Biometric SDK", "BMT")]},
    {"name": "Web Development", "slug": "web-development", "projects": [
        ("Customer Portal v3", "CPT"), ("Admin Dashboard", "ADM"), ("Component Library", "CML"),
        ("Performance Optimization", "POT"), ("Accessibility Audit", "ACA")]},
    {"name": "Data Engineering", "slug": "data-engineering", "projects": [
        ("Streaming Pipeline", "SPP"), ("Data Warehouse Redesign", "DWR"), ("Schema Registry", "SCR"),
        ("CDC Implementation", "CDC"), ("Data API Layer", "DAL")]},
    {"name": "Machine Learning", "slug": "machine-learning", "projects": [
        ("Credit Risk Model", "CRM"), ("Churn Prediction", "CHR"), ("Recommendation Engine", "RCE"),
        ("NLP for Documents", "NLP"), ("ML Feature Store", "MFS")]},
    {"name": "Robotic Process Automation", "slug": "rpa", "projects": [
        ("Account Opening Bot", "AOB"), ("Reconciliation Bot", "RCB"), ("Report Generation", "RGN"),
        ("Email Processing", "EMP"), ("Document Classification", "DCL")]},
    {"name": "Leasing Services", "slug": "leasing-services", "projects": [
        ("Equipment Leasing", "EQL"), ("Vehicle Leasing", "VHL"), ("Property Leasing", "PRL"),
        ("Lease Accounting IFRS16", "LIF"), ("Client Leasing Portal", "CLP")]},
    {"name": "Electronic KYC", "slug": "electronic-kyc", "projects": [
        ("eKYC Mobile SDK", "EKM"), ("ID Verification", "IDV"), ("Liveness Detection", "LVD"),
        ("OCR Engine", "OCR"), ("eKYC Dashboard", "EKD")]},
    {"name": "Deposit Products", "slug": "deposit-products", "projects": [
        ("Term Deposit Platform", "TDP"), ("Savings Account Mgmt", "SAM"), ("CD Ladder Tool", "CDL"),
        ("Rate Comparison", "RCO"), ("Auto-renewal System", "ARS")]},
    # Edge case: 0 projects
    {"name": "Special Projects Unit", "slug": "special-projects-unit", "projects": []},
    # Edge case: all admins
    {"name": "Executive Committee", "slug": "executive-committee", "projects": [
        ("Board Decisions Tracker", "BDT"), ("Strategic Initiatives", "STI"), ("Budget Oversight", "BGO"),
        ("Performance Review Board", "PRB"), ("Governance Framework", "GFW"), ("Succession Planning", "SUP"),
        ("Risk Committee", "RSC")]},
]
# fmt: on

# Roles: 5=Guest, 15=Member, 20=Admin
ROLE_GUEST = 5
ROLE_MEMBER = 15
ROLE_ADMIN = 20


def login() -> requests.Session:
    """Authenticate as admin, return session with admin-session-id cookie."""
    session = requests.Session()

    # Step 1: Get CSRF token from dedicated endpoint
    csrf_resp = session.get(f"{API_BASE}/auth/get-csrf-token/")
    csrf_token = csrf_resp.json().get("csrf_token") if csrf_resp.status_code == 200 else None
    if not csrf_token:
        print(f"Failed to get CSRF token: {csrf_resp.status_code}")
        sys.exit(1)

    # Step 2: Admin sign-in (instance-level API, uses admin-session-id cookie)
    resp = session.post(
        f"{API_BASE}/api/instances/admins/sign-in/",
        data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "csrfmiddlewaretoken": csrf_token},
        headers={"Referer": f"{API_BASE}/"},
        allow_redirects=False,
    )
    if resp.status_code not in (301, 302):
        print(f"Admin login failed: {resp.status_code} {resp.text[:200]}")
        sys.exit(1)

    admin_cookie = resp.cookies.get("admin-session-id") or session.cookies.get("admin-session-id")
    if not admin_cookie:
        print(f"  No admin-session-id cookie.")
        sys.exit(1)
    session.cookies.set("admin-session-id", admin_cookie, domain="localhost", path="/")
    print(f"Logged in as admin (admin-session-id: {admin_cookie[:8]}...)")

    # Step 3: App sign-in (workspace-level API, uses session-id cookie)
    # Need fresh CSRF token for second form post
    csrf_resp2 = session.get(f"{API_BASE}/auth/get-csrf-token/")
    csrf_token2 = csrf_resp2.json().get("csrf_token") if csrf_resp2.status_code == 200 else csrf_token

    resp2 = session.post(
        f"{API_BASE}/auth/sign-in/",
        data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "medium": "email", "csrfmiddlewaretoken": csrf_token2},
        headers={"Referer": f"{API_BASE}/"},
        allow_redirects=False,
    )
    app_cookie = resp2.cookies.get("session-id") or session.cookies.get("session-id")
    if app_cookie:
        session.cookies.set("session-id", app_cookie, domain="localhost", path="/")
        print(f"Logged in as app user (session-id: {app_cookie[:8]}...)")
    else:
        print(f"  WARNING: App login failed ({resp2.status_code}). Project creation may fail.")

    return session


def get_admin_user(session: requests.Session) -> dict | None:
    """Get admin user (duong@shinhan.com) ID. Returns {id, email} or None."""
    resp = session.get(f"{API_BASE}/api/instances/users/", params={"search": ADMIN_EMAIL, "per_page": 10})
    if resp.status_code == 200:
        for u in resp.json().get("results", []):
            if u["email"] == ADMIN_EMAIL:
                print(f"  Admin user: {u['email']} ({u['id']})")
                return {"id": u["id"], "email": u["email"]}
    print(f"  WARNING: Could not find admin user {ADMIN_EMAIL}")
    return None


def get_or_create_mock_users(session: requests.Session) -> list[dict]:
    """Get or create 5 mock users. Returns list of {id, email}."""
    users = []
    # Search existing
    resp = session.get(f"{API_BASE}/api/instances/users/", params={"search": "swing.shinhan.com", "per_page": 100})
    existing = {u["email"]: u["id"] for u in resp.json().get("results", [])} if resp.status_code == 200 else {}

    for mu in MOCK_USERS:
        if mu["email"] in existing:
            users.append({"id": existing[mu["email"]], "email": mu["email"]})
            print(f"  Found: {mu['email']}")
        else:
            resp = session.post(
                f"{API_BASE}/api/instances/users/",
                json={"email": mu["email"], "first_name": mu["first_name"], "last_name": mu["last_name"], "password": "Shinhan@1"},
            )
            if resp.status_code == 201:
                data = resp.json()
                users.append({"id": data["id"], "email": mu["email"]})
                print(f"  Created: {mu['email']}")
            else:
                print(f"  FAILED to create {mu['email']}: {resp.status_code} {resp.text[:200]}")
    return users


def create_workspace(session: requests.Session, dept: dict) -> dict | None:
    """Create workspace. Returns {id, slug} or None if skipped."""
    resp = session.post(
        f"{API_BASE}/api/instances/workspaces/",
        json={"name": dept["name"], "slug": dept["slug"]},
    )
    if resp.status_code == 201:
        data = resp.json()
        return {"id": data["id"], "slug": data["slug"], "new": True}
    elif resp.status_code in (400, 409, 410):
        # Slug taken — find existing workspace
        resp2 = session.get(f"{API_BASE}/api/instances/workspaces/", params={"search": dept["name"]})
        if resp2.status_code == 200:
            for ws in resp2.json().get("results", []):
                if ws["slug"] == dept["slug"]:
                    return {"id": ws["id"], "slug": ws["slug"], "new": False}
        return None
    else:
        print(f"    FAILED: {resp.status_code} {resp.text[:200]}")
        return None


def create_projects(session: requests.Session, slug: str, projects: list[tuple]) -> int:
    """Create projects in workspace. Returns count created."""
    created = 0
    for name, identifier in projects:
        resp = session.post(
            f"{API_BASE}/api/workspaces/{slug}/projects/",
            json={"name": name, "identifier": identifier, "network": 2},
        )
        if resp.status_code == 201:
            created += 1
        elif resp.status_code in (400, 409, 410):
            pass  # duplicate, skip silently
        else:
            print(f"      Project FAILED '{name}': {resp.status_code}")
    return created


def add_members(session: requests.Session, ws_id: str, user_ids: list[dict], roles: list[int]) -> int:
    """Add users to workspace with given roles. Returns count added."""
    added = 0
    for user, role in zip(user_ids, roles):
        resp = session.post(
            f"{API_BASE}/api/instances/users/{user['id']}/workspaces/",
            json={"workspace_id": ws_id, "role": role},
        )
        if resp.status_code in (200, 201):
            added += 1
    return added


def get_member_pattern(index: int, users: list[dict]) -> tuple[list[dict], list[int]]:
    """Determine member assignment pattern based on workspace index."""
    total = len(DEPARTMENTS)

    # Edge case: last dept = Executive Committee → all admins
    if index == total - 1:
        return users, [ROLE_ADMIN] * len(users)

    # Edge case: second-to-last = Special Projects Unit → 2 members
    if index == total - 2:
        return users[:2], [ROLE_MEMBER, ROLE_MEMBER]

    # Full team (~20 workspaces: indices 0-19)
    if index < 20:
        return users, [ROLE_ADMIN, ROLE_MEMBER, ROLE_MEMBER, ROLE_GUEST, ROLE_GUEST]

    # Medium team (~40 workspaces: indices 20-59)
    if index < 60:
        count = 2 + (index % 2)  # alternates 2 or 3
        selected = users[:count]
        roles = [ROLE_ADMIN] + [ROLE_MEMBER] * (count - 1)
        return selected, roles

    # Small/restricted (~37 workspaces: indices 60-96)
    user_idx = index % len(users)
    return [users[user_idx]], [ROLE_ADMIN]


def main():
    print("=== Seeding 99 Bank Department Workspaces ===\n")

    session = login()

    print("\nLooking up admin user...")
    admin_user = get_admin_user(session)

    print("\nGetting/creating mock users...")
    users = get_or_create_mock_users(session)
    if not users:
        print("ERROR: No mock users available")
        sys.exit(1)
    print(f"  {len(users)} mock users ready\n")

    stats = {"ws_created": 0, "ws_skipped": 0, "ws_failed": 0, "proj_created": 0, "members_added": 0}

    for i, dept in enumerate(DEPARTMENTS):
        ws = create_workspace(session, dept)
        if ws:
            # Create projects
            pc = create_projects(session, ws["slug"], dept["projects"])
            stats["proj_created"] += pc

            # Add admin user as Admin to every workspace
            if admin_user:
                add_members(session, ws["id"], [admin_user], [ROLE_ADMIN])
                stats["members_added"] += 1

            # Add mock members
            selected_users, roles = get_member_pattern(i, users)
            mc = add_members(session, ws["id"], selected_users, roles)
            stats["members_added"] += mc

            status = "CREATED" if ws.get("new") else "EXISTS"
            if ws.get("new"):
                stats["ws_created"] += 1
            else:
                stats["ws_skipped"] += 1

            print(f"  [{i+1:2d}/{len(DEPARTMENTS)}] {status}: {dept['name']} ({dept['slug']}) — {pc} projects, {mc} members")
        else:
            stats["ws_failed"] += 1
            print(f"  [{i+1:2d}/{len(DEPARTMENTS)}] SKIPPED: {dept['name']} ({dept['slug']})")

        # Small delay to avoid overwhelming API
        if (i + 1) % 10 == 0:
            time.sleep(0.5)

    print(f"\n=== Summary ===")
    print(f"  Workspaces: {stats['ws_created']} created, {stats['ws_skipped']} existing, {stats['ws_failed']} failed")
    print(f"  Projects:   {stats['proj_created']} created")
    print(f"  Members:    {stats['members_added']} assigned")
    print("Done!")


if __name__ == "__main__":
    main()

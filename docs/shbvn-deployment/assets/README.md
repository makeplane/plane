# Assets — Diagram source & exports

Lưu trữ tài nguyên hình ảnh cho toàn bộ tài liệu.

## Cấu trúc

```
assets/
├── diagrams/         # Source files (Mermaid .mmd, draw.io .drawio)
│   ├── architecture-prod-overview.mmd
│   ├── architecture-test-uat.mmd
│   ├── architecture-dr-replication.mmd
│   ├── network-topology.mmd
│   ├── data-flow.mmd
│   └── ...
└── exports/          # Rendered files (PNG, SVG, PDF)
    ├── architecture-prod-overview.png
    └── ...
```

## Nguyên tắc

- **Source-first**: Mỗi diagram phải có source file (`.mmd` cho Mermaid, `.drawio` cho draw.io) — không chỉ export PNG/PDF
- **Tên file** = tên trong tài liệu tham chiếu (1-to-1 mapping)
- **Mermaid v11** syntax (theo `/mermaidjs-v11` skill convention)
- **Export PDF** cho tài liệu in: dùng `mmdc` (Mermaid CLI) hoặc draw.io export
- **Embed trong markdown** bằng code block ` ```mermaid ` để render trực tiếp (không cần export)

## Naming convention

`{topic}-{view}.{ext}` — kebab-case

- `architecture-prod-overview.mmd`
- `network-topology-vlan.mmd`
- `data-flow-backup.mmd`

## Update workflow

1. Sửa `.mmd` source file
2. Re-render export nếu cần (`.png`/`.pdf`)
3. Commit cả source + export cùng nhau
4. Reference trong markdown tài liệu thay vì copy-paste mermaid code (avoid drift)

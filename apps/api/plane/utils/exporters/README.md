# 📊 Exporters

A flexible and extensible data export utility for exporting Django model data in multiple formats (CSV, JSON, XLSX).

## 🎯 Overview

The exporters module provides a schema-based approach to exporting data with support for:

- **📄 Multiple formats**: CSV, JSON, and XLSX (Excel)
- **🔒 Type-safe field definitions**: StringField, NumberField, DateField, DateTimeField, BooleanField, ListField, JSONField
- **⚡ Custom transformations**: Field-level transformations and custom preparer methods
- **🔗 Dotted path notation**: Easy access to nested attributes and related models
- **🎨 Format-specific handling**: Automatic formatting based on export format (e.g., lists as arrays in JSON, comma-separated in CSV)

## 🚀 Quick Start

### Basic Usage

```python
from plane.utils.exporters import Exporter, ExportSchema, StringField, NumberField

# Define a schema
class UserExportSchema(ExportSchema):
    name = StringField(source="username", label="User Name")
    email = StringField(source="email", label="Email Address")
    posts_count = NumberField(label="Total Posts")

    def prepare_posts_count(self, obj):
        return obj.posts.count()

# Export data
users = User.objects.all()
exporter = Exporter(format_type="csv", schema_class=UserExportSchema)
filename, content = exporter.export("users_export", users)
```

### Exporting Issues

```python
from plane.utils.exporters import Exporter, IssueExportSchema

# Get issues with prefetched relations
issues = Issue.objects.filter(project_id=project_id).prefetch_related(
    'assignee_details',
    'label_details',
    'issue_module',
    # ... other relations
)

# Export as XLSX
exporter = Exporter(format_type="xlsx", schema_class=IssueExportSchema)
filename, content = exporter.export("issues", issues)

# Export with custom fields only
issues_data = IssueExportSchema.serialize_issues(
    issues,
    fields=["id", "name", "state_name", "assignees"]
)
exporter = Exporter(format_type="json", schema_class=IssueExportSchema)
filename, content = exporter.export("issues_filtered", issues_data)
```

## 📝 Schema Definition

### Field Types

#### 📝 StringField

Converts values to strings.

```python
name = StringField(source="name", label="Name", default="N/A")
```

#### 🔢 NumberField

Handles numeric values (int, float).

```python
count = NumberField(source="items_count", label="Count", default=0)
```

#### 📅 DateField

Formats date objects as `%a, %d %b %Y` (e.g., "Mon, 01 Jan 2024").

```python
start_date = DateField(source="start_date", label="Start Date")
```

#### ⏰ DateTimeField

Formats datetime objects as `%a, %d %b %Y %I:%M:%S %Z%z`.

```python
created_at = DateTimeField(source="created_at", label="Created At")
```

#### ✅ BooleanField

Converts values to boolean.

```python
is_active = BooleanField(source="is_active", label="Active", default=False)
```

#### 📋 ListField

Handles list/array values. In CSV/XLSX, lists are joined with a separator (default: `", "`). In JSON, they remain as arrays.

```python
tags = ListField(source="tags", label="Tags")
assignees = ListField(label="Assignees")  # Custom preparer can populate this
```

#### 🗂️ JSONField

Handles complex JSON-serializable objects (dicts, lists of dicts). In CSV/XLSX, they're serialized as JSON strings. In JSON, they remain as objects.

```python
metadata = JSONField(source="metadata", label="Metadata")
comments = JSONField(label="Comments")
```

### ⚙️ Field Parameters

All field types support these parameters:

- **`source`**: Dotted path to the attribute (e.g., `"project.name"`) or a callable
- **`transform`**: Custom transformation function
- **`default`**: Default value when field is None
- **`label`**: Display name in export headers

### 🔗 Dotted Path Notation

Access nested attributes using dot notation:

```python
project_name = StringField(source="project.name", label="Project")
owner_email = StringField(source="created_by.email", label="Owner Email")
```

### 🎯 Custom Preparers

For complex logic, define `prepare_{field_name}` methods:

```python
class MySchema(ExportSchema):
    assignees = ListField(label="Assignees")

    def prepare_assignees(self, obj):
        return [f"{u.first_name} {u.last_name}" for u in obj.assignee_details]
```

Preparers take precedence over field definitions.

### 🔄 Using Callables

Use callable sources for dynamic values:

```python
class MySchema(ExportSchema):
    status = StringField(
        source=lambda obj: "Active" if obj.is_active else "Inactive",
        label="Status"
    )
```

### ⚡ Transform Functions

Apply transformations to values:

```python
class MySchema(ExportSchema):
    name = StringField(
        source="name",
        transform=lambda val: val.upper(),
        label="Name (Uppercase)"
    )
```

## 📦 Export Formats

### 📊 CSV Format

- Fields are quoted with `QUOTE_ALL`
- Lists are joined with `", "` (customizable with `list_joiner` option)
- JSON objects are serialized as JSON strings
- File extension: `.csv`

```python
exporter = Exporter(
    format_type="csv",
    schema_class=MySchema,
    options={"list_joiner": "; "}  # Custom separator
)
```

### 📋 JSON Format

- Lists remain as arrays
- Objects remain as nested structures
- Preserves data types
- File extension: `.json`

```python
exporter = Exporter(format_type="json", schema_class=MySchema)
filename, content = exporter.export("data", records)
# content is a JSON string: '[{"field": "value"}, ...]'
```

### 📗 XLSX Format

- Creates Excel-compatible files using openpyxl
- Lists are joined with `", "` (customizable with `list_joiner` option)
- JSON objects are serialized as JSON strings
- File extension: `.xlsx`
- Returns binary content (bytes)

```python
exporter = Exporter(format_type="xlsx", schema_class=MySchema)
filename, content = exporter.export("data", records)
# content is bytes
```

## 🔧 Advanced Usage

### 📦 Using Context

Pass context data to schemas for additional information:

```python
class MySchema(ExportSchema):
    attachment_count = NumberField(label="Attachments")

    def prepare_attachment_count(self, obj):
        attachments_dict = self.context.get("attachments_dict", {})
        return len(attachments_dict.get(obj.id, []))

# Create schema with context
attachments_dict = get_attachments_dict(queryset)
schema = MySchema(context={"attachments_dict": attachments_dict})

# Serialize
data = [schema.serialize(obj) for obj in queryset]
```

### 🔌 Registering Custom Formatters

Add support for new export formats:

```python
from plane.utils.exporters import Exporter, BaseFormatter

class XMLFormatter(BaseFormatter):
    def format(self, filename, records, schema_class, options=None):
        # Implementation
        return (f"{filename}.xml", xml_content)

# Register the formatter
Exporter.register_formatter("xml", XMLFormatter)

# Use it
exporter = Exporter(format_type="xml", schema_class=MySchema)
```

### ✅ Checking Available Formats

```python
formats = Exporter.get_available_formats()
# Returns: ['csv', 'json', 'xlsx']
```

### 🔍 Filtering Fields

Use the `serialize_issues` class method pattern to filter fields:

```python
@classmethod
def serialize_records(cls, queryset, fields=None):
    fields_to_extract = set(fields) if fields else set(cls._declared_fields.keys())

    schema = cls()
    records_data = []
    for record in queryset:
        record_data = schema.serialize(record)
        filtered_data = {
            field: record_data.get(field, "")
            for field in fields_to_extract
            if field in record_data
        }
        records_data.append(filtered_data)

    return records_data
```

## 💡 Example: IssueExportSchema

The `IssueExportSchema` demonstrates a complete implementation:

```python
from plane.utils.exporters import IssueExportSchema

# Serialize issues
issues_data = IssueExportSchema.serialize_issues(
    issues_queryset,
    fields=["id", "name", "state_name", "assignees", "labels"]
)

# Export as CSV
exporter = Exporter(format_type="csv", schema_class=IssueExportSchema)
filename, content = exporter.export("issues", issues_data)
```

Key features:

- 🔗 Access to related models via dotted paths
- 🎯 Custom preparers for complex fields
- 📎 Context-based attachment handling
- 📋 List and JSON field handling
- 📅 Date/datetime formatting

## ✨ Best Practices

1. **🚄 Prefetch Relations**: Always prefetch related data before exporting to avoid N+1 queries:

   ```python
   issues = Issue.objects.prefetch_related('assignee_details', 'label_details')
   ```

2. **🏷️ Use Labels**: Provide descriptive labels for better export headers:

   ```python
   created_at = DateTimeField(source="created_at", label="Created At")
   ```

3. **🛡️ Handle None Values**: Set appropriate defaults for fields that might be None:

   ```python
   count = NumberField(source="count", default=0)
   ```

4. **🎯 Use Preparers for Complex Logic**: Keep field definitions simple and use preparers for complex transformations:

   ```python
   def prepare_assignees(self, obj):
       return [f"{u.first_name} {u.last_name}" for u in obj.assignee_details]
   ```

5. **⚡ Context for Expensive Operations**: Use context to pass pre-computed data and avoid redundant queries:
   ```python
   schema = MySchema(context={"computed_data": precomputed_dict})
   ```

## 📚 API Reference

### 📊 Exporter

**`__init__(format_type, schema_class, options=None)`**

- `format_type`: Export format ('csv', 'json', 'xlsx')
- `schema_class`: Schema class defining fields
- `options`: Optional dict of format-specific options

**`export(filename, records)`**

- Returns: `(filename_with_extension, content)`
- `content` is str for CSV/JSON, bytes for XLSX

**`get_available_formats()`** (class method)

- Returns: List of available format types

**`register_formatter(format_type, formatter_class)`** (class method)

- Register a custom formatter

### 📝 ExportSchema

**`__init__(context=None)`**

- `context`: Optional dict passed to field transformations and preparers

**`serialize(obj)`**

- Returns: Dict of serialized field values

### 🔧 ExportField

Base class for all field types. Subclass to create custom field types.

**`get_value(obj, context)`**

- Returns: Formatted value for the field

**`_format_value(raw)`**

- Override in subclasses for type-specific formatting

## 🧪 Testing

```python
# Test schema serialization
schema = MySchema()
result = schema.serialize(obj)
assert result["field_name"] == expected_value

# Test export
exporter = Exporter(format_type="json", schema_class=MySchema)
filename, content = exporter.export("test", [{"data": "value"}])
assert filename == "test.json"
assert isinstance(content, str)
```

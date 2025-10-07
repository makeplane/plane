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

# Export data - just pass the queryset!
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

# Export as XLSX - pass the queryset directly!
exporter = Exporter(format_type="xlsx", schema_class=IssueExportSchema)
filename, content = exporter.export("issues", issues)

# Export with custom fields only
exporter = Exporter(format_type="json", schema_class=IssueExportSchema)
filename, content = exporter.export("issues_filtered", issues, fields=["id", "name", "state_name", "assignees"])
```

### Exporting Multiple Projects Separately

```python
# Export each project to a separate file
for project_id in project_ids:
    project_issues = issues.filter(project_id=project_id)
    exporter = Exporter(format_type="csv", schema_class=IssueExportSchema)
    filename, content = exporter.export(f"issues-{project_id}", project_issues)
    # Save or upload the file
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

- **`source`**: Dotted path string to the attribute (e.g., `"project.name"`)
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

### ⚡ Custom Transformations with Preparer Methods

For any custom logic or transformations, use `prepare_<field_name>` methods:

```python
class MySchema(ExportSchema):
    name = StringField(source="name", label="Name (Uppercase)")
    status = StringField(label="Status")

    def prepare_name(self, obj):
        """Transform the name field to uppercase."""
        return obj.name.upper() if obj.name else ""

    def prepare_status(self, obj):
        """Compute status based on model state."""
        return "Active" if obj.is_active else "Inactive"
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

### 📦 Using Context for Pre-fetched Data

Pass context data to schemas to avoid N+1 queries. Override `get_context_data()` in your schema:

```python
class MySchema(ExportSchema):
    attachment_count = NumberField(label="Attachments")

    def prepare_attachment_count(self, obj):
        attachments_dict = self.context.get("attachments_dict", {})
        return len(attachments_dict.get(obj.id, []))

    @classmethod
    def get_context_data(cls, queryset):
        """Pre-fetch all attachments in one query."""
        attachments_dict = get_attachments_dict(queryset)
        return {"attachments_dict": attachments_dict}

# The Exporter automatically uses get_context_data() when serializing
queryset = MyModel.objects.all()
exporter = Exporter(format_type="csv", schema_class=MySchema)
filename, content = exporter.export("data", queryset)
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

Pass a `fields` parameter to export only specific fields:

```python
# Export only specific fields
exporter = Exporter(format_type="csv", schema_class=MySchema)
filename, content = exporter.export(
    "filtered_data",
    queryset,
    fields=["id", "name", "email"]
)
```

### 🎯 Extending Schemas

Create extended schemas by inheriting from existing ones and overriding `get_context_data()`:

```python
class ExtendedIssueExportSchema(IssueExportSchema):
    custom_field = JSONField(label="Custom Data")

    def prepare_custom_field(self, obj):
        # Use pre-fetched data from context
        return self.context.get("custom_data", {}).get(obj.id, {})

    @classmethod
    def get_context_data(cls, queryset):
        # Get parent context (attachments, etc.)
        context = super().get_context_data(queryset)

        # Add your custom pre-fetched data
        context["custom_data"] = fetch_custom_data(queryset)

        return context
```

### 💾 Manual Serialization

If you need to serialize data without exporting, you can use the schema directly:

```python
# Serialize a queryset to a list of dicts
data = MySchema.serialize_queryset(queryset, fields=["id", "name"])

# Or serialize a single object
schema = MySchema()
obj_data = schema.serialize(obj)
```

## 💡 Example: IssueExportSchema

The `IssueExportSchema` demonstrates a complete implementation:

```python
from plane.utils.exporters import Exporter, IssueExportSchema

# Simple export - just pass the queryset!
issues = Issue.objects.filter(project_id=project_id)
exporter = Exporter(format_type="csv", schema_class=IssueExportSchema)
filename, content = exporter.export("issues", issues)

# Export specific fields only
filename, content = exporter.export(
    "issues_filtered",
    issues,
    fields=["id", "name", "state_name", "assignees", "labels"]
)

# Export multiple projects to separate files
for project_id in project_ids:
    project_issues = issues.filter(project_id=project_id)
    filename, content = exporter.export(f"issues-{project_id}", project_issues)
    # Save or upload each file
```

Key features:

- 🔗 Access to related models via dotted paths
- 🎯 Custom preparers for complex fields
- 📎 Context-based attachment handling via `get_context_data()`
- 📋 List and JSON field handling
- 📅 Date/datetime formatting

## ✨ Best Practices

1. **🚄 Avoid N+1 Queries**: Override `get_context_data()` to pre-fetch related data:

   ```python
   @classmethod
   def get_context_data(cls, queryset):
       return {
           "attachments": get_attachments_dict(queryset),
           "comments": get_comments_dict(queryset),
       }
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

5. **⚡ Pass QuerySets Directly**: Let the Exporter handle serialization:

   ```python
   # Good - Exporter handles serialization
   exporter.export("data", queryset)

   # Avoid - Manual serialization unless needed
   data = MySchema.serialize_queryset(queryset)
   exporter.export("data", data)
   ```

6. **📦 Filter QuerySets, Not Data**: For multiple exports, filter the queryset instead of the serialized data:

   ```python
   # Good - efficient, only serializes what's needed
   for project_id in project_ids:
       project_issues = issues.filter(project_id=project_id)
       exporter.export(f"project-{project_id}", project_issues)

   # Avoid - serializes all data upfront
   all_data = MySchema.serialize_queryset(issues)
   for project_id in project_ids:
       project_data = [d for d in all_data if d['project_id'] == project_id]
       exporter.export(f"project-{project_id}", project_data)
   ```

## 📚 API Reference

### 📊 Exporter

**`__init__(format_type, schema_class, options=None)`**

- `format_type`: Export format ('csv', 'json', 'xlsx')
- `schema_class`: Schema class defining fields
- `options`: Optional dict of format-specific options

**`export(filename, data, fields=None)`**

- `filename`: Filename without extension
- `data`: Django QuerySet or list of dicts
- `fields`: Optional list of field names to include
- Returns: `(filename_with_extension, content)`
- `content` is str for CSV/JSON, bytes for XLSX

**`get_available_formats()`** (class method)

- Returns: List of available format types

**`register_formatter(format_type, formatter_class)`** (class method)

- Register a custom formatter

### 📝 ExportSchema

**`__init__(context=None)`**

- `context`: Optional dict accessible in preparer methods via `self.context` for pre-fetched data

**`serialize(obj, fields=None)`**

- Returns: Dict of serialized field values for a single object

**`serialize_queryset(queryset, fields=None)`** (class method)

- `queryset`: QuerySet of objects to serialize
- `fields`: Optional list of field names to include
- Returns: List of dicts with serialized data

**`get_context_data(queryset)`** (class method)

- Override to pre-fetch related data for the queryset
- Returns: Dict of context data

### 🔧 ExportField

Base class for all field types. Subclass to create custom field types.

**`get_value(obj, context)`**

- Returns: Formatted value for the field

**`_format_value(raw)`**

- Override in subclasses for type-specific formatting

## 🧪 Testing

```python
# Test exporting a queryset
queryset = MyModel.objects.all()
exporter = Exporter(format_type="json", schema_class=MySchema)
filename, content = exporter.export("test", queryset)
assert filename == "test.json"
assert isinstance(content, str)

# Test with field filtering
filename, content = exporter.export("test", queryset, fields=["id", "name"])
data = json.loads(content)
assert all(set(item.keys()) == {"id", "name"} for item in data)

# Test manual serialization
data = MySchema.serialize_queryset(queryset)
assert len(data) == queryset.count()
```

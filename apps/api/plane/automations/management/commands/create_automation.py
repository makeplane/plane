"""
Interactive Django management command to create end-to-end automations.

This command guides users through creating linear automations with:
- One trigger node
- Optional condition node
- One or more action nodes (can be chained)

Usage:
    python manage.py create_automation
"""

import json
import uuid
from typing import Dict, Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from plane.db.models import Workspace, Project
from plane.ee.models.automation import (
    Automation,
    AutomationNode,
    AutomationEdge,
    AutomationScopeChoices,
    NodeTypeChoices,
)
from plane.automations.registry import NodeRegistry


class Command(BaseCommand):
    """Interactive management command for creating automations."""

    help = "Create an end-to-end automation interactively"

    def __init__(self):
        super().__init__()
        self.registry = NodeRegistry()
        self.workspace = None
        self.project = None
        self.automation = None
        self.version = None
        self.nodes = []  # List of created nodes
        self.edges = []  # List of created edges

    def add_arguments(self, parser):
        """Add command line arguments."""
        parser.add_argument(
            "--workspace-id",
            type=str,
            help="Workspace ID (UUID) - will prompt if not provided",
        )
        parser.add_argument(
            "--project-id",
            type=str,
            help="Project ID (UUID) - will prompt if not provided",
        )
        parser.add_argument(
            "--non-interactive",
            action="store_true",
            help="Skip interactive prompts (requires all IDs as arguments)",
        )

    def handle(self, *args, **options):
        """Main command handler."""
        try:
            # Handle special options first
            if options.get("list_handlers"):
                self._list_all_handlers()
                return

            self.stdout.write(self.style.SUCCESS("🚀 Automation Creation Wizard"))
            self.stdout.write(
                "Creating a linear automation: Trigger → [Condition] → Action(s)\n"
            )

            if options.get("dry_run"):
                self.stdout.write(
                    self.style.WARNING("🔍 DRY RUN MODE - No changes will be made\n")
                )

            # Step 1: Get workspace and project
            self._get_workspace_and_project(options)

            # Step 2: Get automation basic details
            self._get_automation_details()

            # Step 3: Create trigger node
            self._create_trigger_node()

            # Step 4: Optional condition node
            self._create_optional_condition_node()

            # Step 5: Create action node(s)
            self._create_action_nodes()

            # Step 6: Create edges for linear flow
            self._create_edges()

            # Step 7: Publish automation
            self._publish_automation()

            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Automation '{self.automation.name}' created successfully!"
                )
            )
            self.stdout.write(f"Automation ID: {self.automation.id}")
            self.stdout.write(f"Version: {self.version.version_number}")

        except KeyboardInterrupt:
            self.stdout.write(
                self.style.ERROR("\n❌ Automation creation cancelled by user.")
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Error creating automation: {e}"))
            raise

    def _get_workspace_and_project(self, options):
        """Get and validate workspace and project."""
        workspace_id = options.get("workspace_id")
        project_id = options.get("project_id")

        # Get workspace
        if not workspace_id:
            workspace_id = self._get_safe_input(
                "\n📍 Enter Workspace ID (UUID): ",
                required=True,
                validator=self._is_valid_uuid,
            )

        try:
            self.workspace = Workspace.objects.get(id=workspace_id)
            self.stdout.write(f"✅ Found workspace: {self.workspace.name}")
        except Workspace.DoesNotExist:
            raise CommandError(f"Workspace with ID {workspace_id} not found")
        except ValueError:
            raise CommandError(f"Invalid workspace ID format: {workspace_id}")

        # Get project
        if not project_id:
            project_prompt = (
                f"📁 Enter Project ID (UUID) for workspace '{self.workspace.name}': "
            )
            project_id = self._get_safe_input(
                project_prompt,
                required=True,
                validator=self._is_valid_uuid,
            )

        try:
            self.project = Project.objects.get(id=project_id, workspace=self.workspace)
            self.stdout.write(f"✅ Found project: {self.project.name}")
        except Project.DoesNotExist:
            error_msg = (
                f"Project with ID {project_id} not found in workspace "
                f"{self.workspace.name}"
            )
            raise CommandError(error_msg)
        except ValueError:
            raise CommandError(f"Invalid project ID format: {project_id}")

    def _is_valid_uuid(self, value: str) -> bool:
        """Validate UUID format."""
        try:
            uuid.UUID(value)
            return True
        except ValueError:
            return False

    def _get_automation_details(self):
        """Get basic automation details."""
        self.stdout.write(self.style.HTTP_INFO("\n📝 Automation Details"))

        name = self._get_safe_input("Enter automation name: ", required=True)
        description = self._get_safe_input(
            "Enter automation description (optional): ", required=False
        )

        # Show available scopes
        self.stdout.write("\nAvailable scopes:")
        for choice in AutomationScopeChoices.choices:
            self.stdout.write(f"  - {choice[0]}: {choice[1]}")

        scope = input(f"Enter scope [{AutomationScopeChoices.WORKITEM}]: ").strip()
        if not scope:
            scope = AutomationScopeChoices.WORKITEM

        if scope not in [choice[0] for choice in AutomationScopeChoices.choices]:
            raise CommandError(f"Invalid scope: {scope}")

        # Create automation
        self.automation = Automation.objects.create(
            name=name,
            description=description,
            scope=scope,
            workspace=self.workspace,
            project=self.project,
            created_by=None,  # System created
        )

        self.stdout.write(f"✅ Created automation: {name}")

    def _create_trigger_node(self):
        """Create the trigger node."""
        self.stdout.write(self.style.HTTP_INFO("\n🎯 Trigger Node"))

        # Get available triggers
        available_triggers = {
            name: meta
            for name, meta in self.registry.all().items()
            if meta.node_type == "trigger"
        }

        if not available_triggers:
            raise CommandError("No trigger handlers available")

        self.stdout.write("Available triggers:")
        for i, (name, meta) in enumerate(available_triggers.items(), 1):
            # Get description from schema if available
            schema_info = meta.schema.schema() if hasattr(meta.schema, "schema") else {}
            description = schema_info.get("description", "No description available")
            self.stdout.write(f"  {i}. {name} - {description}")

        # Get user choice
        while True:
            try:
                choice = input("Select trigger (number or name): ").strip()
                if choice.isdigit():
                    idx = int(choice) - 1
                    if 0 <= idx < len(available_triggers):
                        trigger_name = list(available_triggers.keys())[idx]
                        break
                elif choice in available_triggers:
                    trigger_name = choice
                    break
                else:
                    self.stdout.write("Invalid choice. Please try again.")
            except (ValueError, IndexError):
                self.stdout.write("Invalid choice. Please try again.")

        trigger_meta = available_triggers[trigger_name]

        # Get trigger configuration
        config = self._get_node_config(trigger_meta.schema, "trigger")

        # Create version first (needed for nodes)
        self.version = self.automation.create_new_version()

        # Create trigger node
        trigger_node = AutomationNode.objects.create(
            version=self.version,
            name=f"Trigger: {trigger_name}",
            node_type=NodeTypeChoices.TRIGGER,
            handler_name=trigger_name,
            config=config,
            project=self.project,
        )

        self.nodes.append(trigger_node)
        self.stdout.write(f"✅ Created trigger node: {trigger_name}")

    def _create_optional_condition_node(self):
        """Create optional condition node."""
        self.stdout.write(self.style.HTTP_INFO("\n🤔 Condition Node (Optional)"))

        if not self._ask_for_approval("Add a condition node?", default=False):
            self.stdout.write("⏭️  Skipping condition node")
            return

        # Get available conditions
        available_conditions = {
            name: meta
            for name, meta in self.registry.all().items()
            if meta.node_type == "condition"
        }

        if not available_conditions:
            self.stdout.write("⚠️  No condition handlers available, skipping")
            return

        self.stdout.write("Available conditions:")
        for i, (name, meta) in enumerate(available_conditions.items(), 1):
            # Get description from schema if available
            schema_info = meta.schema.schema() if hasattr(meta.schema, "schema") else {}
            description = schema_info.get("description", "No description available")
            self.stdout.write(f"  {i}. {name} - {description}")

        # Get user choice
        while True:
            try:
                choice = input("Select condition (number or name): ").strip()
                if choice.isdigit():
                    idx = int(choice) - 1
                    if 0 <= idx < len(available_conditions):
                        condition_name = list(available_conditions.keys())[idx]
                        break
                elif choice in available_conditions:
                    condition_name = choice
                    break
                else:
                    self.stdout.write("Invalid choice. Please try again.")
            except (ValueError, IndexError):
                self.stdout.write("Invalid choice. Please try again.")

        condition_meta = available_conditions[condition_name]

        # Get condition configuration
        config = self._get_node_config(condition_meta.schema, "condition")

        # Create condition node
        condition_node = AutomationNode.objects.create(
            version=self.version,
            name=f"Condition: {condition_name}",
            node_type=NodeTypeChoices.CONDITION,
            handler_name=condition_name,
            config=config,
            project=self.project,
        )

        self.nodes.append(condition_node)
        self.stdout.write(f"✅ Created condition node: {condition_name}")

    def _create_action_nodes(self):
        """Create one or more action nodes."""
        self.stdout.write(self.style.HTTP_INFO("\n⚡ Action Node(s)"))

        # Get available actions
        available_actions = {
            name: meta
            for name, meta in self.registry.all().items()
            if meta.node_type == "action"
        }

        if not available_actions:
            raise CommandError("No action handlers available")

        action_count = 0
        while True:
            action_count += 1
            self.stdout.write(f"\n--- Action Node #{action_count} ---")

            self.stdout.write("Available actions:")
            for i, (name, meta) in enumerate(available_actions.items(), 1):
                # Get description from schema if available
                schema_info = (
                    meta.schema.schema() if hasattr(meta.schema, "schema") else {}
                )
                description = schema_info.get("description", "No description available")
                self.stdout.write(f"  {i}. {name} - {description}")

            # Get user choice
            while True:
                try:
                    choice = input("Select action (number or name): ").strip()
                    if choice.isdigit():
                        idx = int(choice) - 1
                        if 0 <= idx < len(available_actions):
                            action_name = list(available_actions.keys())[idx]
                            break
                    elif choice in available_actions:
                        action_name = choice
                        break
                    else:
                        self.stdout.write("Invalid choice. Please try again.")
                except (ValueError, IndexError):
                    self.stdout.write("Invalid choice. Please try again.")

            action_meta = available_actions[action_name]

            # Get action configuration
            config = self._get_node_config(action_meta.schema, "action")

            # Create action node
            action_node = AutomationNode.objects.create(
                version=self.version,
                name=f"Action #{action_count}: {action_name}",
                node_type=NodeTypeChoices.ACTION,
                handler_name=action_name,
                config=config,
                project=self.project,
            )

            self.nodes.append(action_node)
            self.stdout.write(f"✅ Created action node: {action_name}")

            # Ask if they want to add another action
            if not self._ask_for_approval("Add another action node?", default=False):
                break

    def _get_node_config(self, schema_class, node_type: str) -> Dict[str, Any]:
        """Get configuration for a node based on its schema."""
        config = {}

        # Get schema fields
        schema_fields = schema_class.schema().get("properties", {})

        if not schema_fields:
            self.stdout.write(f"  No configuration needed for this {node_type}")
            return config

        self.stdout.write(f"  Configure {node_type} parameters:")

        for field_name, field_info in schema_fields.items():
            description = field_info.get("description", "")
            examples = field_info.get("examples", [])
            field_type = field_info.get("type", "string")

            self.stdout.write(f"\n  {field_name} ({field_type}):")
            if description:
                self.stdout.write(f"    {description}")
            if examples:
                self.stdout.write(f"    Examples: {examples}")

            while True:
                value = input(f"    Enter {field_name}: ").strip()

                try:
                    # Basic type conversion
                    if field_type == "integer":
                        value = int(value)
                    elif field_type == "number":
                        value = float(value)
                    elif field_type == "boolean":
                        value = value.lower() in ("true", "yes", "1", "y")
                    elif field_type == "object":
                        if value:
                            value = json.loads(value)
                        else:
                            value = {}
                    elif field_type == "array":
                        if value:
                            value = json.loads(value)
                        else:
                            value = []
                    # else string, keep as is

                    config[field_name] = value
                    break
                except (ValueError, json.JSONDecodeError) as e:
                    self.stdout.write(f"    Invalid value: {e}. Please try again.")

        return config

    def _create_edges(self):
        """Create edges to connect nodes in linear flow."""
        self.stdout.write(self.style.HTTP_INFO("\n🔗 Creating Connections"))

        if len(self.nodes) < 2:
            self.stdout.write("⚠️  Need at least 2 nodes to create edges")
            return

        # Create linear connections: node[0] -> node[1] -> node[2] -> ...
        for i in range(len(self.nodes) - 1):
            source_node = self.nodes[i]
            target_node = self.nodes[i + 1]

            edge = AutomationEdge.objects.create(
                version=self.version,
                source_node=source_node,
                target_node=target_node,
                execution_order=i,
                project=self.project,
            )

            self.edges.append(edge)
            self.stdout.write(f"✅ Connected: {source_node.name} → {target_node.name}")

    def _publish_automation(self):
        """Publish the automation version."""
        self.stdout.write(self.style.HTTP_INFO("\n🚀 Publishing Automation"))

        # Ask for confirmation
        self.stdout.write(f"Ready to publish automation '{self.automation.name}'")
        self.stdout.write(f"Nodes: {len(self.nodes)}")
        self.stdout.write(f"Edges: {len(self.edges)}")

        if not self._ask_for_approval("Publish automation?", default=True):
            self.stdout.write("❌ Automation creation cancelled")
            return

        # Publish version
        with transaction.atomic():
            published_version = self.automation.publish_version(self.version)
            self.automation.is_enabled = True
            self.automation.save()

        self.stdout.write(
            f"✅ Published automation version {published_version.version_number}"
        )
        self.stdout.write("🎉 Automation is now active!")

        # Display summary
        self._display_automation_summary()

    def _display_automation_summary(self):
        """Display a summary of the created automation."""
        self.stdout.write(self.style.HTTP_INFO("\n📋 Automation Summary"))
        self.stdout.write(f"Name: {self.automation.name}")
        self.stdout.write(
            f"Description: {self.automation.description or 'No description'}"
        )
        self.stdout.write(f"Scope: {self.automation.scope}")
        self.stdout.write(f"Workspace: {self.workspace.name}")
        self.stdout.write(f"Project: {self.project.name}")
        self.stdout.write(f"Version: {self.version.version_number}")
        self.stdout.write("Status: Published and Enabled")

        self.stdout.write(f"\nFlow ({len(self.nodes)} nodes):")
        for i, node in enumerate(self.nodes):
            arrow = " → " if i < len(self.nodes) - 1 else ""
            node_display = f"  {i + 1}. {node.name} ({node.handler_name}){arrow}"
            self.stdout.write(node_display)

        self.stdout.write(f"\nConnections ({len(self.edges)} edges):")
        for edge in self.edges:
            self.stdout.write(f"  {edge.source_node.name} → {edge.target_node.name}")

    def _list_all_handlers(self):
        """List all available handlers grouped by type."""
        self.stdout.write(self.style.SUCCESS("📋 Available Automation Handlers\n"))

        all_handlers = self.registry.all()

        # Group by type
        handlers_by_type = {}
        for name, meta in all_handlers.items():
            if meta.node_type not in handlers_by_type:
                handlers_by_type[meta.node_type] = []
            handlers_by_type[meta.node_type].append((name, meta))

        # Display each type
        for node_type in ["trigger", "condition", "action"]:
            if node_type in handlers_by_type:
                header = f"\n🎯 {node_type.upper()} HANDLERS:"
                self.stdout.write(self.style.HTTP_INFO(header))
                for name, meta in handlers_by_type[node_type]:
                    # Get description from schema
                    has_schema = hasattr(meta.schema, "schema")
                    schema_info = meta.schema.schema() if has_schema else {}
                    description = schema_info.get(
                        "description", "No description available"
                    )

                    # Get required fields
                    properties = schema_info.get("properties", {})
                    required_fields = schema_info.get("required", [])

                    self.stdout.write(f"  • {name}")
                    self.stdout.write(f"    {description}")

                    if properties:
                        self.stdout.write("    Parameters:")
                        for field_name, field_info in properties.items():
                            is_required = field_name in required_fields
                            field_type = field_info.get("type", "string")
                            field_desc = field_info.get("description", "")
                            req_marker = " *" if is_required else ""
                            param_line = (
                                f"      - {field_name} ({field_type})"
                                f"{req_marker}: {field_desc}"
                            )
                            self.stdout.write(param_line)
                    else:
                        self.stdout.write("    Parameters: None")
                    self.stdout.write("")
            else:
                warning_msg = f"\n⚠️  No {node_type} handlers available"
                self.stdout.write(self.style.WARNING(warning_msg))

        self.stdout.write("\n* = Required parameter")

    def _ask_for_approval(self, message: str, default: bool = True) -> bool:
        """Ask user for approval with consistent formatting."""
        prompt = f"{message} ({'Y/n' if default else 'y/N'}): "
        response = input(prompt).strip().lower()

        if not response:
            return default
        return response in ("y", "yes") if not default else response not in ("n", "no")

    def _get_safe_input(
        self, prompt: str, required: bool = True, validator=None
    ) -> str:
        """Get user input with validation and error handling."""
        while True:
            try:
                value = input(prompt).strip()

                if required and not value:
                    self.stdout.write("This field is required. Please try again.")
                    continue

                if validator and value:
                    if not validator(value):
                        self.stdout.write("Invalid input. Please try again.")
                        continue

                return value
            except (EOFError, KeyboardInterrupt):
                raise
            except Exception as e:
                self.stdout.write(f"Error reading input: {e}. Please try again.")

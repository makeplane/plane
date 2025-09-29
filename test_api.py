#!/usr/bin/env python3
"""
Plane API Testing Framework

A composable API for testing Plane's customer APIs with chainable operations.
Build any test flow with method calls across different API domains.

Examples:
    # Simple customer operations
    api.customers().create("Acme Corp").update({"description": "Updated"}).run()

    # Cross-domain composition
    api.customers().create("Acme").properties().create("Status", "OPTION", ["Active", "Inactive"]).run()

    # With context variables and mock mode
    api.mock().customers().create("Test Corp").as_("main_customer").properties().create("Tier").run()
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any, Union

# ====================================
# CORE INFRASTRUCTURE
# ====================================


class Logger:
    """Colored console output for test results"""

    COLORS = {
        "header": "\033[95m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "red": "\033[91m",
        "bold": "\033[1m",
        "underline": "\033[4m",
        "reset": "\033[0m",
    }

    @classmethod
    def _colored(cls, text: str, color: str) -> str:
        return f"{cls.COLORS.get(color, '')}{text}{cls.COLORS['reset']}"

    @classmethod
    def header(cls, text: str):
        print("\n" + "=" * 50)
        print(cls._colored(text, "header"))
        print("=" * 50)

    @classmethod
    def subheader(cls, text: str):
        print(f"\n--- {cls._colored(text, 'cyan')} ---")

    @classmethod
    def info(cls, text: str):
        print(f"ℹ️  Info: {text}")

    @classmethod
    def success(cls, text: str):
        print(f"✅ Success: {cls._colored(text, 'green')}")

    @classmethod
    def error(cls, text: str):
        print(f"❌ Error: {cls._colored(text, 'red')}")

    @classmethod
    def warning(cls, text: str):
        print(f"⚠️  Warning: {cls._colored(text, 'yellow')}")

    @classmethod
    def debug(cls, text: str):
        print(f"🐛 DEBUG: {cls._colored(text, 'blue')}")


class APIClient:
    """HTTP client for making API requests"""

    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.base_url = config["base_url"]
        self.workspace_slug = config["workspace_slug"]
        self.api_key = config["api_key"]
        self.mock_mode = config.get("mock_mode", False)

    def _make_request(
        self, method: str, endpoint: str, data: Optional[Dict] = None
    ) -> Tuple[int, Dict]:
        """Make HTTP request and return status code and response data"""
        url = f"{self.base_url}/workspaces/{self.workspace_slug}{endpoint}"

        # Prepare request
        if data:
            data_bytes = json.dumps(data).encode("utf-8")
        else:
            data_bytes = None

        req = urllib.request.Request(url, data=data_bytes, method=method)
        req.add_header("x-api-key", self.api_key)
        if data:
            req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req) as response:
                response_body = response.read().decode("utf-8")
                response_data = (
                    json.loads(response_body) if response_body.strip() else {}
                )
                return response.status, response_data
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            try:
                error_data = json.loads(error_body) if error_body.strip() else {}
            except json.JSONDecodeError:
                # Handle cases where server returns HTML (like 404 pages)
                error_data = {"error": f"HTTP {e.code}: {error_body[:200]}..."}
            return e.code, error_data
        except Exception as e:
            return 500, {"error": str(e)}

    def get(self, endpoint: str) -> Tuple[int, Dict]:
        return self._make_request("GET", endpoint)

    def post(self, endpoint: str, data: Dict) -> Tuple[int, Dict]:
        return self._make_request("POST", endpoint, data)

    def patch(self, endpoint: str, data: Dict) -> Tuple[int, Dict]:
        return self._make_request("PATCH", endpoint, data)

    def delete(self, endpoint: str) -> Tuple[int, Dict]:
        return self._make_request("DELETE", endpoint)


class FlowResults:
    """Container for API execution results"""

    def __init__(self):
        self.operations = []
        self.context = {}
        self.success_count = 0
        self.total_count = 0

    def add_operation(self, name: str, success: bool, result: Any = None):
        self.operations.append({"name": name, "success": success, "result": result})
        self.total_count += 1
        if success:
            self.success_count += 1

    def was_successful(self) -> bool:
        return self.success_count == self.total_count and self.total_count > 0

    def get_summary(self) -> Dict:
        success_rate = (
            (self.success_count / self.total_count * 100) if self.total_count > 0 else 0
        )
        return {
            "total": self.total_count,
            "successful": self.success_count,
            "failed": self.total_count - self.success_count,
            "success_rate": success_rate,
        }


# ====================================
# MAIN API
# ====================================


class PlaneAPI:
    """Main entry point for Plane API testing - provides access to all domain APIs"""

    def __init__(self, config: Dict[str, str]):
        self.client = APIClient(config)
        self.context = {}  # Shared context for variables
        self.operations = []  # Queue of operations
        self.cleanup_items = []  # Items to cleanup
        self.results = FlowResults()
        self._mock_mode = config.get("mock_mode", False)

    def mock(self, enabled: bool = True) -> "PlaneAPI":
        """Enable/disable mock mode (preserves test data)"""
        self._mock_mode = enabled
        self.client.mock_mode = enabled
        if enabled:
            Logger.header("🔸 MOCK MODE ENABLED 🔸")
            Logger.info("All test data will be preserved (no deletions will occur)")
        return self

    def customers(self) -> "CustomersAPI":
        """Access customer operations"""
        return CustomersAPI(self)

    def properties(self) -> "PropertiesAPI":
        """Access customer properties operations"""
        return PropertiesAPI(self)

    def issues(self) -> "IssuesAPI":
        """Access issues operations (placeholder for future)"""
        return IssuesAPI(self)

    def debug(self, message: str = "Debug checkpoint") -> "PlaneAPI":
        """Add debug checkpoint"""

        def debug_op():
            Logger.subheader(f"🐛 DEBUG: {message}")
            Logger.info(f"Context: {self.context}")
            return True, {"debug": message, "context": self.context.copy()}

        self._add_operation(f"debug({message})", debug_op)
        return self

    def set(self, key: str, value: str) -> "PlaneAPI":
        """Set context variable manually"""
        self.context[key] = value
        Logger.info(f"Context: {key} = {value}")
        return self

    def run(self) -> FlowResults:
        """Execute all queued operations"""
        if not self.operations:
            Logger.warning(
                "No operations queued. Use API methods to build your test flow."
            )
            return self.results

        Logger.header("🚀 Running Test Flow")
        Logger.info(f"Executing {len(self.operations)} operations...")

        for i, (name, operation_func) in enumerate(self.operations, 1):
            Logger.info(f"[{i}/{len(self.operations)}] {name}")

            try:
                success, result = operation_func()
                self.results.add_operation(name, success, result)

                if success:
                    Logger.success(f"{name} completed")
                else:
                    Logger.error(f"{name} failed: {result}")

            except Exception as e:
                Logger.error(f"{name} crashed: {str(e)}")
                self.results.add_operation(name, False, {"error": str(e)})

        # Cleanup
        self._cleanup()

        # Results summary
        summary = self.results.get_summary()
        Logger.header("📊 Flow Results")
        Logger.info(
            f"Operations: {summary['successful']}/{summary['total']} successful ({summary['success_rate']:.1f}%)"
        )

        if self.results.was_successful():
            Logger.success("All operations completed successfully! 🎉")
        else:
            Logger.error(f"{summary['failed']} operations failed")

        return self.results

    def _add_operation(self, name: str, operation_func):
        """Add operation to execution queue"""
        self.operations.append((name, operation_func))

    def _add_cleanup(self, item_id: str, endpoint: str):
        """Add item for cleanup"""
        self.cleanup_items.append({"id": item_id, "endpoint": endpoint})

    def _cleanup(self):
        """Clean up created resources"""
        if not self.cleanup_items:
            return

        if self._mock_mode:
            Logger.subheader("🔸 Mock Mode: Preserving test data")
            for item in self.cleanup_items:
                Logger.info(f"Preserving: {item['id']} ({item['endpoint']})")
        else:
            Logger.subheader("Cleaning up test data")
            for item in self.cleanup_items:
                status, _ = self.client.delete(item["endpoint"])
                if status == 204:
                    Logger.info(f"Cleaned up: {item['id']}")
                else:
                    Logger.error(f"Failed to cleanup: {item['id']}")

    def _substitute_context(self, text: str) -> str:
        """Replace {variable} placeholders with context values"""
        if isinstance(text, str):
            for key, value in self.context.items():
                text = text.replace(f"{{{key}}}", str(value))
        return text

    def _generate_unique_name(self, base_name: str) -> str:
        """Generate unique name with timestamp"""
        import time

        timestamp = int(time.time())
        return f"{base_name} {timestamp}"


# ====================================
# DOMAIN APIS
# ====================================


class BaseDomainAPI:
    """Base class for all domain APIs"""

    def __init__(self, api: PlaneAPI):
        self.api = api
        self.client = api.client
        self.context = api.context

    def back(self) -> PlaneAPI:
        """Return to main API for cross-domain composition"""
        return self.api


class CustomersAPI(BaseDomainAPI):
    """API for customer operations"""

    def create(self, name: str, description: str = None, **kwargs) -> "CustomersAPI":
        """Create a customer"""

        def create_op():
            actual_name = self.api._substitute_context(name)
            if "{" not in name:  # Add timestamp if no context variables
                actual_name = self.api._generate_unique_name(actual_name)

            data = {
                "name": actual_name,
                "description": description or f"Customer created via API",
                **kwargs,
            }

            status, response = self.client.post("/customers/", data)
            if status == 201:
                customer_id = response.get("id")
                self.context["customer_id"] = customer_id
                self.context["last_customer_id"] = customer_id
                self.api._add_cleanup(customer_id, f"/customers/{customer_id}/")
                Logger.info(f"Created customer: {actual_name} (ID: {customer_id})")
                return True, response
            else:
                return False, response

        self.api._add_operation(f"create_customer({name})", create_op)
        return self

    def get(self, customer_id: str = None) -> "CustomersAPI":
        """Get customer details"""

        def get_op():
            target_id = (
                customer_id
                or self.context.get("customer_id")
                or self.context.get("last_customer_id")
            )
            if not target_id:
                return False, {"error": "No customer ID available"}

            status, response = self.client.get(f"/customers/{target_id}/")
            if status == 200:
                Logger.info(f"Retrieved customer: {target_id}")
                return True, response
            else:
                return False, response

        self.api._add_operation("get_customer", get_op)
        return self

    def update(self, updates: Dict, customer_id: str = None) -> "CustomersAPI":
        """Update a customer"""

        def update_op():
            target_id = (
                customer_id
                or self.context.get("customer_id")
                or self.context.get("last_customer_id")
            )
            if not target_id:
                return False, {"error": "No customer ID available"}

            # Process context variables in updates
            processed_updates = {}
            for key, value in updates.items():
                processed_updates[key] = (
                    self.api._substitute_context(str(value))
                    if isinstance(value, str)
                    else value
                )

            status, response = self.client.patch(
                f"/customers/{target_id}/", processed_updates
            )
            if status == 200:
                Logger.info(f"Updated customer: {target_id}")
                return True, response
            else:
                return False, response

        self.api._add_operation("update_customer", update_op)
        return self

    def list(self) -> "CustomersAPI":
        """List all customers"""

        def list_op():
            status, response = self.client.get("/customers/")
            if status == 200:
                count = response.get("total_count", len(response.get("results", [])))
                Logger.info(f"Listed {count} customers")
                return True, response
            else:
                return False, response

        self.api._add_operation("list_customers", list_op)
        return self

    def search(self, query: str) -> "CustomersAPI":
        """Search customers"""

        def search_op():
            actual_query = self.api._substitute_context(query)
            status, response = self.client.get(f"/customers/?search={actual_query}")
            if status == 200:
                count = response.get("total_count", len(response.get("results", [])))
                Logger.info(f"Search '{actual_query}': {count} customers found")
                return True, response
            else:
                return False, response

        self.api._add_operation(f"search_customers({query})", search_op)
        return self

    def delete(self, customer_id: str = None) -> "CustomersAPI":
        """Delete a customer"""

        def delete_op():
            if self.api._mock_mode:
                Logger.info("Mock: Skipping customer deletion")
                return True, {"message": "Skipped in mock mode"}

            target_id = (
                customer_id
                or self.context.get("customer_id")
                or self.context.get("last_customer_id")
            )
            if not target_id:
                return False, {"error": "No customer ID available"}

            status, response = self.client.delete(f"/customers/{target_id}/")
            if status == 204:
                Logger.info(f"Deleted customer: {target_id}")
                # Remove from cleanup since deleted explicitly
                self.api.cleanup_items = [
                    item for item in self.api.cleanup_items if item["id"] != target_id
                ]
                return True, {"deleted": target_id}
            else:
                return False, response

        self.api._add_operation("delete_customer", delete_op)
        return self

    def as_(self, context_name: str) -> "CustomersAPI":
        """Store current customer ID with a custom name in context"""
        customer_id = self.context.get("customer_id") or self.context.get(
            "last_customer_id"
        )
        if customer_id:
            self.context[context_name] = customer_id
            Logger.info(f"Saved customer ID as '{context_name}': {customer_id}")
        return self


class PropertiesAPI(BaseDomainAPI):
    """API for customer properties operations"""

    def create(
        self,
        display_name: str,
        property_type: str = "TEXT",
        options: List[str] = None,
        **kwargs,
    ) -> "PropertiesAPI":
        """Create a customer property"""

        def create_op():
            actual_name = self.api._substitute_context(display_name)
            if "{" not in display_name:
                actual_name = self.api._generate_unique_name(actual_name)

            data = {
                "name": actual_name,
                "display_name": actual_name,
                "property_type": property_type,
                "description": kwargs.get("description", f"Property created via API"),
                **kwargs,
            }

            # Add options for OPTION type properties
            if property_type == "OPTION" and options:
                data["options"] = [
                    {
                        "name": option,
                        "description": f"Option: {option}",
                        "is_default": i == 0,
                    }
                    for i, option in enumerate(options)
                ]

            status, response = self.client.post("/customer-properties/", data)
            if status == 201:
                property_id = response.get("id")
                self.context["property_id"] = property_id
                self.context["last_property_id"] = property_id
                self.api._add_cleanup(
                    property_id, f"/customer-properties/{property_id}/"
                )
                Logger.info(
                    f"Created property: {actual_name} ({property_type}) (ID: {property_id})"
                )
                return True, response
            else:
                return False, response

        self.api._add_operation(
            f"create_property({display_name}, {property_type})", create_op
        )
        return self

    def get(self, property_id: str = None) -> "PropertiesAPI":
        """Get property details"""

        def get_op():
            target_id = (
                property_id
                or self.context.get("property_id")
                or self.context.get("last_property_id")
            )
            if not target_id:
                return False, {"error": "No property ID available"}

            status, response = self.client.get(f"/customer-properties/{target_id}/")
            if status == 200:
                Logger.info(f"Retrieved property: {target_id}")
                return True, response
            else:
                return False, response

        self.api._add_operation("get_property", get_op)
        return self

    def update(self, updates: Dict, property_id: str = None) -> "PropertiesAPI":
        """Update a customer property"""

        def update_op():
            target_id = (
                property_id
                or self.context.get("property_id")
                or self.context.get("last_property_id")
            )
            if not target_id:
                return False, {"error": "No property ID available"}

            # Process context variables
            processed_updates = {}
            for key, value in updates.items():
                processed_updates[key] = (
                    self.api._substitute_context(str(value))
                    if isinstance(value, str)
                    else value
                )

            status, response = self.client.patch(
                f"/customer-properties/{target_id}/", processed_updates
            )
            if status == 200:
                Logger.info(f"Updated property: {target_id}")
                return True, response
            else:
                return False, response

        self.api._add_operation("update_property", update_op)
        return self

    def list(self) -> "PropertiesAPI":
        """List all customer properties"""

        def list_op():
            status, response = self.client.get("/customer-properties/")
            if status == 200:
                count = response.get("total_count", len(response.get("results", [])))
                Logger.info(f"Listed {count} properties")
                return True, response
            else:
                return False, response

        self.api._add_operation("list_properties", list_op)
        return self

    def delete(self, property_id: str = None) -> "PropertiesAPI":
        """Delete a customer property"""

        def delete_op():
            if self.api._mock_mode:
                Logger.info("Mock: Skipping property deletion")
                return True, {"message": "Skipped in mock mode"}

            target_id = (
                property_id
                or self.context.get("property_id")
                or self.context.get("last_property_id")
            )
            if not target_id:
                return False, {"error": "No property ID available"}

            status, response = self.client.delete(f"/customer-properties/{target_id}/")
            if status == 204:
                Logger.info(f"Deleted property: {target_id}")
                # Remove from cleanup since deleted explicitly
                self.api.cleanup_items = [
                    item for item in self.api.cleanup_items if item["id"] != target_id
                ]
                return True, {"deleted": target_id}
            else:
                return False, response

        self.api._add_operation("delete_property", delete_op)
        return self

    def as_(self, context_name: str) -> "PropertiesAPI":
        """Store current property ID with a custom name in context"""
        property_id = self.context.get("property_id") or self.context.get(
            "last_property_id"
        )
        if property_id:
            self.context[context_name] = property_id
            Logger.info(f"Saved property ID as '{context_name}': {property_id}")
        return self


class IssuesAPI(BaseDomainAPI):
    """API for issues operations (placeholder for future expansion)"""

    def create(self, title: str, **kwargs) -> "IssuesAPI":
        """Create an issue (placeholder)"""
        Logger.info("IssuesAPI.create() - Coming soon!")
        return self

    def link_to_customer(self, customer_id: str, issue_ids: List[str]) -> "IssuesAPI":
        """Link issues to customer (placeholder)"""
        Logger.info("IssuesAPI.link_to_customer() - Coming soon!")
        return self


# ====================================
# PREDEFINED FLOWS
# ====================================


def customer_onboarding_flow(api: PlaneAPI) -> FlowResults:
    """Complete customer onboarding with properties setup"""
    return (
        api.debug("Customer onboarding process")
        .customers()
        .create("Acme Corporation", description="Enterprise client")
        .as_("main_customer")
        .back()
        .properties()
        .create(
            "Account Tier", "OPTION", options=["Bronze", "Silver", "Gold", "Platinum"]
        )
        .create("Industry", "TEXT", description="Customer's industry sector")
        .create("Annual Revenue", "TEXT", description="Company annual revenue")
        .create("Primary Contact", "TEXT", description="Main point of contact")
        .back()
        .debug("Onboarding complete - customer and properties ready")
        .run()
    )


def validation_testing_flow(api: PlaneAPI) -> FlowResults:
    """Testing validation and error conditions"""
    return (
        api.mock()  # Preserve data for inspection
        .debug("Validation testing flow")
        .customers()
        .create("Validation Test Corp")
        .update({"description": "Testing updates"})
        .search("Validation")
        .back()
        .properties()
        .create("Test Property", "TEXT")
        .update({"description": "Updated description"})
        .list()
        .back()
        .debug("Validation tests completed")
        .run()
    )


def demo_flow(api: PlaneAPI) -> FlowResults:
    """Demonstration of API capabilities"""
    return (
        api.debug("Starting demo")
        .customers()
        .list()
        .create("Demo Corp")
        .get()
        .update({"description": "Updated via API"})
        .back()
        .properties()
        .list()
        .create("Priority", "OPTION", options=["High", "Medium", "Low"])
        .create("Department", "TEXT")
        .back()
        .debug("Demo completed")
        .run()
    )


# ====================================
# MAIN CLI
# ====================================


def main():
    """Main CLI interface"""

    # Configuration
    CONFIG = {
        "base_url": "http://localhost:8000/api/v1",
        "workspace_slug": "slack-shah",
        "api_key": "plane_api_b113773f13354d78a0c2d9bb361a0dee",
        "mock_mode": False,
    }

    parser = argparse.ArgumentParser(
        description="Plane API Testing Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python test_api.py demo                          # Run demonstration flow
    python test_api.py onboarding                    # Customer onboarding flow
    python test_api.py validation                    # Validation testing flow
    python test_api.py demo --mock                   # Demo in mock mode (preserve data)
    python test_api.py custom                        # Interactive custom flow

Available flows:
    demo, onboarding, validation, custom
        """,
    )

    parser.add_argument(
        "flow",
        choices=["demo", "onboarding", "validation", "custom"],
        help="Test flow to run",
    )

    parser.add_argument(
        "--base-url",
        default=CONFIG["base_url"],
        help=f"Base API URL (default: {CONFIG['base_url']})",
    )

    parser.add_argument(
        "--workspace",
        default=CONFIG["workspace_slug"],
        help=f"Workspace slug (default: {CONFIG['workspace_slug']})",
    )

    parser.add_argument(
        "--api-key", default=CONFIG["api_key"], help="API key for authentication"
    )

    parser.add_argument(
        "--mock",
        action="store_true",
        help="Mock mode: Skip all deletions and preserve test data",
    )

    args = parser.parse_args()

    # Update config
    test_config = CONFIG.copy()
    test_config["base_url"] = args.base_url
    test_config["workspace_slug"] = args.workspace
    test_config["api_key"] = args.api_key
    test_config["mock_mode"] = args.mock

    # Show mock mode info
    if args.mock:
        Logger.header("🔸 MOCK MODE ENABLED 🔸")
        Logger.info("All test data will be preserved (no deletions will occur)")
        print()

    # Create API instance
    api = PlaneAPI(test_config)

    # Run selected flow
    if args.flow == "demo":
        results = demo_flow(api)
    elif args.flow == "onboarding":
        results = customer_onboarding_flow(api)
    elif args.flow == "validation":
        results = validation_testing_flow(api)
    elif args.flow == "custom":
        results = run_custom_flow(api)
    else:
        Logger.error(f"Unknown flow: {args.flow}")
        sys.exit(1)

    # Exit with appropriate code
    sys.exit(0 if results.was_successful() else 1)


def run_custom_flow(api: PlaneAPI) -> FlowResults:
    """Interactive custom flow builder"""
    Logger.header("🛠 Custom Flow Builder")
    Logger.info("Build your own test flow interactively!")
    Logger.info("For now, running a sample custom flow...")

    # Sample custom flow - in the future this could be interactive
    return (
        api.debug("Custom flow example")
        .customers()
        .create("Custom Customer")
        .as_("my_customer")
        .back()
        .properties()
        .create("Custom Property", "TEXT")
        .back()
        .debug("Custom flow completed with customer '{my_customer}'")
        .run()
    )


if __name__ == "__main__":
    main()

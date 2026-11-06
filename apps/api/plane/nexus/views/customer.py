# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Customers, customer properties and values, customer requests, and customer work item links.

Wire format: plane-sdk api/customers/* and models/customers.py. Workspace admins and
members use customers; guests have no access. Only admins configure properties.
"""

import uuid
from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator, validate_email
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.api.views.issue import visible_issue_q
from plane.db.models import FileAsset, Issue, WorkspaceMember
from plane.nexus.models import (
    Customer,
    CustomerProperty,
    CustomerPropertyOption,
    CustomerPropertyValue,
    CustomerRequest,
    CustomerWorkItem,
)
from plane.nexus.serializers.customer import (
    CustomerPropertySerializer,
    CustomerRequestSerializer,
    CustomerSerializer,
    OptionInputSerializer,
)
from plane.utils.permissions import WorkSpaceAdminPermission, WorkspaceOwnerPermission

from .base import NexusAPIView

_ALIVE = Q(deleted_at__isnull=True)


def _soft_delete(queryset):
    """Soft delete rows without the Celery cascade a model instance's delete() schedules."""
    return queryset.filter(deleted_at__isnull=True).update(deleted_at=timezone.now())


def _first_error(errors):
    """A single readable message from DRF serializer errors."""
    if isinstance(errors, dict):
        for field, value in errors.items():
            message = _first_error(value)
            return message if field == "non_field_errors" else f"{field}: {message}"
    if isinstance(errors, list) and errors:
        return _first_error(errors[0])
    return str(errors)


def _uuid_list(raw):
    """A list of UUID strings, or None when raw is not a list of UUIDs."""
    if not isinstance(raw, list):
        return None
    try:
        return [str(uuid.UUID(str(item))) for item in raw]
    except (ValueError, TypeError, AttributeError):
        return None


class CustomerBaseView(NexusAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def customers(self):
        return Customer.objects.filter(workspace__slug=self.workspace_slug)

    def get_customer(self, customer_id) -> Customer:
        return get_object_or_404(self.customers(), pk=customer_id)

    def visible_issues(self):
        """Work items in this workspace the requesting user can view, by Plane's own rule
        (a guest without guest_view_all_features sees only the work items they created)."""
        return Issue.issue_objects.filter(
            workspace__slug=self.workspace_slug,
            project__archived_at__isnull=True,
            id__in=Issue.objects.filter(visible_issue_q(self.request.user)).values("id"),
        )

    def resolve_issues(self, raw):
        """(issue ids, error) for a list of work item ids; every id must be a visible work item."""
        ids = _uuid_list(raw)
        if ids is None:
            return None, "Work item ids must be a list of UUIDs."
        found = {str(pk) for pk in self.visible_issues().filter(pk__in=ids).values_list("pk", flat=True)}
        missing = [pk for pk in ids if pk not in found]
        if missing:
            return None, f"Work item(s) not found in this workspace: {', '.join(missing)}."
        return list(dict.fromkeys(ids)), None

    def link(self, customer, issue_ids, customer_request=None):
        """Link work items to a customer (through a request when given); existing links are kept."""
        existing = set(
            CustomerWorkItem.objects.filter(
                customer=customer, customer_request=customer_request, issue_id__in=issue_ids
            ).values_list("issue_id", flat=True)
        )
        CustomerWorkItem.objects.bulk_create(
            [
                CustomerWorkItem(
                    workspace_id=customer.workspace_id,
                    customer=customer,
                    customer_request=customer_request,
                    issue_id=pk,
                    created_by=self.request.user,
                )
                for pk in issue_ids
                if uuid.UUID(pk) not in existing
            ]
        )


# --------------------------------------------------------------------------- customers


class CustomerListCreateAPIEndpoint(CustomerBaseView):
    def get_queryset(self):
        return self.customers().annotate(
            customer_request_count=Count("requests", filter=Q(requests__deleted_at__isnull=True), distinct=True)
        )

    def get(self, request, slug):
        queryset = self.get_queryset().select_related("logo_asset")
        search = request.GET.get("query") or request.GET.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        for field in ("domain", "stage", "contract_status", "external_source", "external_id"):
            if request.GET.get(field):
                queryset = queryset.filter(**{field: request.GET[field]})
        if request.GET.get("name"):
            queryset = queryset.filter(name__iexact=request.GET["name"])
        return self.paginated(request, queryset, CustomerSerializer)

    def post(self, request, slug):
        """Upsert: match on external_source + external_id, else on name; create only when neither matches."""
        workspace = self.get_workspace()
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        data = {key: value for key, value in request.data.items() if value is not None}
        name = (data.get("name") or "").strip() if isinstance(data.get("name"), str) else ""
        if not name:
            return self.error("name is required.")

        existing = None
        source, external_id = data.get("external_source"), data.get("external_id")
        if source and external_id:
            existing = self.customers().filter(external_source=source, external_id=external_id).first()
        if existing is None:
            existing = self.customers().filter(name__iexact=name).first()

        serializer = CustomerSerializer(
            existing, data=data, partial=existing is not None, context={"workspace_id": workspace.id}
        )
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        try:
            with transaction.atomic():
                customer = serializer.save(workspace=workspace) if existing is None else serializer.save()
        except IntegrityError:
            return self.error("A customer with this name already exists.", "CUSTOMER_NAME_EXISTS")
        return Response(
            CustomerSerializer(customer).data,
            status=status.HTTP_201_CREATED if existing is None else status.HTTP_200_OK,
        )

    def delete(self, request, slug):
        """Delete by external reference; a reference that matches nothing succeeds silently."""
        source, external_id = request.GET.get("external_source"), request.GET.get("external_id")
        if not (source and external_id):
            return self.error("Provide both external_source and external_id, or delete by customer id.")
        for customer in self.customers().filter(external_source=source, external_id=external_id):
            delete_customer(customer)
        return Response(status=status.HTTP_204_NO_CONTENT)


def delete_customer(customer):
    with transaction.atomic():
        _soft_delete(CustomerWorkItem.objects.filter(customer=customer))
        _soft_delete(CustomerPropertyValue.objects.filter(customer=customer))
        _soft_delete(CustomerRequest.objects.filter(customer=customer))
        _soft_delete(Customer.objects.filter(pk=customer.pk))


class CustomerDetailAPIEndpoint(CustomerBaseView):
    def get(self, request, slug, customer_id):
        return Response(CustomerSerializer(self.get_customer(customer_id)).data)

    def patch(self, request, slug, customer_id):
        customer = self.get_customer(customer_id)
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        serializer = CustomerSerializer(
            customer, data=request.data, partial=True, context={"workspace_id": customer.workspace_id}
        )
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        name = serializer.validated_data.get("name")
        if name and self.customers().filter(name__iexact=name).exclude(pk=customer.pk).exists():
            return self.error("A customer with this name already exists.", "CUSTOMER_NAME_EXISTS")
        try:
            with transaction.atomic():
                customer = serializer.save()
        except IntegrityError:
            return self.error("A customer with this name already exists.", "CUSTOMER_NAME_EXISTS")
        return Response(CustomerSerializer(customer).data)

    def delete(self, request, slug, customer_id):
        delete_customer(self.get_customer(customer_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- work item links


class CustomerWorkItemAPIEndpoint(CustomerBaseView):
    def get_request(self, customer):
        """The customer_request_id query param resolved to one of this customer's requests (or None)."""
        request_id = self.request.GET.get("customer_request_id")
        if not request_id:
            return None
        try:
            uuid.UUID(request_id)
        except ValueError:
            raise CustomerRequest.DoesNotExist
        return CustomerRequest.objects.get(pk=request_id, customer=customer)

    def get(self, request, slug, customer_id):
        """Every work item linked to the customer, not paginated."""
        customer = self.get_customer(customer_id)
        links = CustomerWorkItem.objects.filter(customer=customer)
        customer_request = self.get_request(customer)
        if customer_request is not None:
            links = links.filter(customer_request=customer_request)
        issues = self.visible_issues().filter(pk__in=links.values("issue_id"))
        search = request.GET.get("search")
        if search:
            term = Q(name__icontains=search) | Q(project__identifier__icontains=search)
            if search.isdigit():
                term |= Q(sequence_id=int(search))
            elif "-" in search:
                identifier, _, number = search.rpartition("-")
                if number.isdigit():
                    term |= Q(project__identifier__iexact=identifier, sequence_id=int(number))
            issues = issues.filter(term)
        rows = issues.order_by("-created_at").values(
            "id",
            "name",
            "state_id",
            "priority",
            "sequence_id",
            "project_id",
            "project__identifier",
            "created_at",
            "updated_at",
        )
        return Response(list(rows))

    def post(self, request, slug, customer_id):
        customer = self.get_customer(customer_id)
        customer_request = self.get_request(customer)
        if not isinstance(request.data, dict) or "issue_ids" not in request.data:
            return self.error("Send issue_ids, a list of work item ids.")
        issue_ids, err = self.resolve_issues(request.data.get("issue_ids"))
        if err:
            return self.error(err)
        with transaction.atomic():
            self.link(customer, issue_ids, customer_request)
        linked = (
            self.visible_issues()
            .filter(pk__in=issue_ids)
            .values("id", "name", "sequence_id", "project_id", "project__identifier")
        )
        return Response(
            {"message": "Work items linked to the customer.", "linked_issues": list(linked)},
            status=status.HTTP_201_CREATED,
        )


class CustomerWorkItemDetailAPIEndpoint(CustomerWorkItemAPIEndpoint):
    def delete(self, request, slug, customer_id, issue_id):
        """Unlink a work item: only the link made via customer_request_id when given, else every link."""
        customer = self.get_customer(customer_id)
        links = CustomerWorkItem.objects.filter(customer=customer, issue_id=issue_id)
        customer_request = self.get_request(customer)
        if customer_request is not None:
            links = links.filter(customer_request=customer_request)
        if not _soft_delete(links):
            return self.error(
                "This work item is not linked to the customer.", "LINK_NOT_FOUND", status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- requests


class CustomerRequestBaseView(CustomerBaseView):
    def set_request_work_items(self, customer_request, issue_ids):
        """Make the request's linked work items exactly issue_ids."""
        _soft_delete(customer_request.work_item_links.exclude(issue_id__in=issue_ids))
        self.link(customer_request.customer, issue_ids, customer_request)

    def save(self, serializer, work_item_ids, **kwargs):
        issue_ids = None
        if work_item_ids is not None:
            issue_ids, err = self.resolve_issues(work_item_ids)
            if err:
                return None, err
        with transaction.atomic():
            customer_request = serializer.save(**kwargs)
            if issue_ids is not None:
                self.set_request_work_items(customer_request, issue_ids)
        return customer_request, None


class CustomerRequestListCreateAPIEndpoint(CustomerRequestBaseView):
    def get(self, request, slug, customer_id):
        customer = self.get_customer(customer_id)
        queryset = CustomerRequest.objects.filter(customer=customer)
        search = request.GET.get("query") or request.GET.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return self.paginated(request, queryset, CustomerRequestSerializer)

    def post(self, request, slug, customer_id):
        customer = self.get_customer(customer_id)
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        serializer = CustomerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        customer_request, err = self.save(
            serializer, request.data.get("work_item_ids"), customer=customer, workspace_id=customer.workspace_id
        )
        if err:
            return self.error(err)
        return Response(CustomerRequestSerializer(customer_request).data, status=status.HTTP_201_CREATED)


class CustomerRequestDetailAPIEndpoint(CustomerRequestBaseView):
    def get_request(self, customer_id, request_id) -> CustomerRequest:
        return get_object_or_404(CustomerRequest, pk=request_id, customer=self.get_customer(customer_id))

    def get(self, request, slug, customer_id, request_id):
        return Response(CustomerRequestSerializer(self.get_request(customer_id, request_id)).data)

    def patch(self, request, slug, customer_id, request_id):
        customer_request = self.get_request(customer_id, request_id)
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        serializer = CustomerRequestSerializer(customer_request, data=request.data, partial=True)
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        customer_request, err = self.save(serializer, request.data.get("work_item_ids"))
        if err:
            return self.error(err)
        return Response(CustomerRequestSerializer(customer_request).data)

    def delete(self, request, slug, customer_id, request_id):
        customer_request = self.get_request(customer_id, request_id)
        with transaction.atomic():
            _soft_delete(customer_request.work_item_links.all())
            _soft_delete(CustomerRequest.objects.filter(pk=customer_request.pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- properties


class CustomerPropertyBaseView(NexusAPIView):
    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [WorkSpaceAdminPermission()]
        return [WorkspaceOwnerPermission()]

    def properties(self):
        return CustomerProperty.objects.filter(workspace__slug=self.workspace_slug)

    def apply_options(self, prop, raw_options, updating):
        """Create (no id) or update (id) inline options. Returns an error message or None."""
        if raw_options is None:
            return None
        if prop.property_type != "OPTION":
            return "options are only allowed on OPTION properties."
        serializer = OptionInputSerializer(data=raw_options, many=True)
        if not serializer.is_valid():
            return f"options: {_first_error(serializer.errors)}"
        current = {str(o.pk): o for o in prop.options.filter(deleted_at__isnull=True)}
        names = {o.name.lower(): str(o.pk) for o in current.values()}
        for item in serializer.validated_data:
            option_id = str(item.pop("id")) if "id" in item else None
            if option_id is not None:
                if not updating or option_id not in current:
                    return f"Option {option_id} does not belong to this property."
                option = current[option_id]
            else:
                option = CustomerPropertyOption(property=prop, workspace_id=prop.workspace_id)
            if "name" in item:
                item["name"] = item["name"].strip()
                clash = names.get(item["name"].lower())
                if clash and clash != option_id:
                    return f"An option named {item['name']!r} already exists on this property."
            for field, value in item.items():
                setattr(option, field, value)
            option.save()
            names[option.name.lower()] = str(option.pk)
            current[str(option.pk)] = option
        return None

    def write(self, serializer, raw_options, updating, **kwargs):
        try:
            with transaction.atomic():
                prop = serializer.save(**kwargs)
                err = self.apply_options(prop, raw_options, updating)
                if err:
                    transaction.set_rollback(True)
                    return None, err
        except IntegrityError:
            return None, "A customer property with this name already exists."
        return prop, None


class CustomerPropertyListCreateAPIEndpoint(CustomerPropertyBaseView):
    def get(self, request, slug):
        queryset = self.properties()
        if request.GET.get("property_type"):
            queryset = queryset.filter(property_type=request.GET["property_type"])
        if request.GET.get("is_active") in ("true", "false"):
            queryset = queryset.filter(is_active=request.GET["is_active"] == "true")
        return self.paginated(request, queryset.prefetch_related("options"), CustomerPropertySerializer)

    def post(self, request, slug):
        workspace = self.get_workspace()
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        serializer = CustomerPropertySerializer(data=request.data)
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        if self.properties().filter(name=serializer.validated_data["name"]).exists():
            return self.error("A customer property with this name already exists.", "PROPERTY_NAME_EXISTS")
        prop, err = self.write(serializer, request.data.get("options"), updating=False, workspace=workspace)
        if err:
            return self.error(err)
        return Response(CustomerPropertySerializer(prop).data, status=status.HTTP_201_CREATED)


class CustomerPropertyDetailAPIEndpoint(CustomerPropertyBaseView):
    def get_property(self, property_id) -> CustomerProperty:
        return get_object_or_404(self.properties(), pk=property_id)

    def get(self, request, slug, property_id):
        return Response(CustomerPropertySerializer(self.get_property(property_id)).data)

    def patch(self, request, slug, property_id):
        prop = self.get_property(property_id)
        if not isinstance(request.data, dict):
            return self.error("Send a JSON object.")
        new_type = request.data.get("property_type")
        if new_type and new_type != prop.property_type and prop.values.filter(deleted_at__isnull=True).exists():
            return self.error("property_type cannot change once customers hold values for this property.")
        if request.data.get("is_multi") is False and prop.is_multi:
            held = prop.values.filter(deleted_at__isnull=True).values("customer_id").annotate(n=Count("id"))
            if held.filter(n__gt=1).exists():
                return self.error(
                    "is_multi cannot be turned off while a customer holds more than one value for this property."
                )
        serializer = CustomerPropertySerializer(prop, data=request.data, partial=True)
        if not serializer.is_valid():
            return self.error(_first_error(serializer.errors))
        prop, err = self.write(serializer, request.data.get("options"), updating=True)
        if err:
            return self.error(err)
        return Response(CustomerPropertySerializer(prop).data)

    def delete(self, request, slug, property_id):
        prop = self.get_property(property_id)
        with transaction.atomic():
            _soft_delete(CustomerPropertyValue.objects.filter(property=prop))
            _soft_delete(CustomerPropertyOption.objects.filter(property=prop))
            _soft_delete(CustomerProperty.objects.filter(pk=prop.pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- property values


_url = URLValidator()


def _normalize(prop, value, workspace_id):
    """The stored string for one value of a property, plus its option; raises ValueError when invalid."""
    if not isinstance(value, str):
        raise ValueError("every value must be a string")
    value = value.strip()
    kind = prop.property_type
    option = None
    if kind == "DECIMAL":
        try:
            float(value)
        except ValueError:
            raise ValueError(f"{value!r} is not a number")
    elif kind == "BOOLEAN":
        if value.lower() not in ("true", "false"):
            raise ValueError(f'{value!r} is not "True" or "False"')
        value = "True" if value.lower() == "true" else "False"
    elif kind == "DATETIME":
        try:
            value = date.fromisoformat(value[:10]).isoformat()
        except ValueError:
            raise ValueError(f"{value!r} is not a YYYY-MM-DD date")
    elif kind == "URL":
        try:
            _url(value if "://" in value else f"https://{value}")
        except DjangoValidationError:
            raise ValueError(f"{value!r} is not a URL")
    elif kind == "EMAIL":
        try:
            validate_email(value)
        except DjangoValidationError:
            raise ValueError(f"{value!r} is not an email address")
    elif kind in ("OPTION", "RELATION", "FILE"):
        try:
            value = str(uuid.UUID(value))
        except ValueError:
            raise ValueError(f"{value!r} is not a UUID")
        if kind == "OPTION":
            option = prop.options.filter(pk=value, deleted_at__isnull=True, is_active=True).first()
            ok = option is not None
        elif kind == "FILE":
            ok = FileAsset.objects.filter(pk=value, workspace_id=workspace_id).exists()
        elif prop.relation_type == "USER":
            ok = WorkspaceMember.objects.filter(workspace_id=workspace_id, member_id=value, is_active=True).exists()
        else:
            ok = Issue.issue_objects.filter(pk=value, workspace_id=workspace_id).exists()
        if not ok:
            raise ValueError(f"{value} does not exist in this workspace")
    return value, option


class CustomerPropertyValueBaseView(CustomerBaseView):
    def values_map(self, customer, property_id=None):
        rows = CustomerPropertyValue.objects.filter(
            customer=customer, property__is_active=True, property__deleted_at__isnull=True
        )
        if property_id is not None:
            rows = rows.filter(property_id=property_id)
        result = {}
        for prop_id, value in rows.order_by("sort_order", "created_at").values_list("property_id", "value"):
            result.setdefault(str(prop_id), []).append(value)
        return result

    def set_values(self, customer, assignments):
        """Validate then replace every named property's values. Returns an error message or None."""
        props = {
            str(p.pk): p
            for p in CustomerProperty.objects.filter(workspace_id=customer.workspace_id, pk__in=list(assignments))
        }
        prepared = []
        for prop_id, values in assignments.items():
            prop = props.get(prop_id)
            if prop is None:
                return f"Customer property {prop_id} not found in this workspace."
            if not isinstance(values, list):
                return f"Values for {prop.display_name} must be a list of strings."
            if prop.is_required and not values:
                return f"{prop.display_name} is required and cannot be empty."
            if not prop.is_multi and len(values) > 1:
                return f"{prop.display_name} takes a single value."
            normalized = []
            for value in values:
                try:
                    normalized.append(_normalize(prop, value, customer.workspace_id))
                except ValueError as exc:
                    return f"{prop.display_name}: {exc}."
            prepared.append((prop, normalized))
        with transaction.atomic():
            for prop, normalized in prepared:
                _soft_delete(CustomerPropertyValue.objects.filter(customer=customer, property=prop))
                CustomerPropertyValue.objects.bulk_create(
                    [
                        CustomerPropertyValue(
                            workspace_id=customer.workspace_id,
                            customer=customer,
                            property=prop,
                            value=value,
                            value_option=option,
                            sort_order=index,
                            created_by=self.request.user,
                        )
                        for index, (value, option) in enumerate(normalized)
                    ]
                )
        return None


class CustomerPropertyValueListAPIEndpoint(CustomerPropertyValueBaseView):
    def get(self, request, slug, customer_id):
        return Response(self.values_map(self.get_customer(customer_id)))

    def post(self, request, slug, customer_id):
        customer = self.get_customer(customer_id)
        body = request.data.get("customer_property_values") if isinstance(request.data, dict) else None
        if not isinstance(body, dict):
            return self.error("Send customer_property_values, an object of property id to a list of strings.")
        assignments = {}
        for key, values in body.items():
            try:
                assignments[str(uuid.UUID(str(key)))] = values
            except ValueError:
                return self.error(f"Customer property {key} not found in this workspace.")
        err = self.set_values(customer, assignments)
        if err:
            return self.error(err)
        return Response(self.values_map(customer))


class CustomerPropertyValueDetailAPIEndpoint(CustomerPropertyValueBaseView):
    def get_property(self, customer, property_id) -> CustomerProperty:
        return get_object_or_404(CustomerProperty, pk=property_id, workspace_id=customer.workspace_id)

    def get(self, request, slug, customer_id, property_id):
        customer = self.get_customer(customer_id)
        prop = self.get_property(customer, property_id)
        values = self.values_map(customer, prop.pk)
        return Response({str(prop.pk): values.get(str(prop.pk), [])})

    def patch(self, request, slug, customer_id, property_id):
        customer = self.get_customer(customer_id)
        prop = self.get_property(customer, property_id)
        values = request.data.get("values") if isinstance(request.data, dict) else None
        if not isinstance(values, list):
            return self.error("Send values, a list of strings.")
        err = self.set_values(customer, {str(prop.pk): values})
        if err:
            return self.error(err)
        return Response({str(prop.pk): self.values_map(customer, prop.pk).get(str(prop.pk), [])})

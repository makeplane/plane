# Python imports
import socket
import ipaddress
from urllib.parse import urlparse

# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema


class WebhookSerializer(DynamicBaseSerializer):
    url = serializers.URLField(validators=[validate_schema, validate_domain])

    def create(self, validated_data):
        url = validated_data.get("url", None)

        # Extract the hostname from the URL
        hostname = urlparse(url).hostname
        if not hostname:
            raise serializers.ValidationError(
                {"url": "Invalid URL: No hostname found."}
            )

        # Resolve the hostname to IP addresses
        try:
            ip_addresses = socket.getaddrinfo(hostname, None)
        except socket.gaierror:
            raise serializers.ValidationError(
                {"url": "Hostname could not be resolved."}
            )

        if not ip_addresses:
            raise serializers.ValidationError(
                {"url": "No IP addresses found for the hostname."}
            )

        for addr in ip_addresses:
            ip = ipaddress.ip_address(addr[4][0])
            if ip.is_loopback:
                raise serializers.ValidationError(
                    {"url": "URL resolves to a blocked IP address."}
                )

        # Additional validation for multiple request domains and their subdomains
        request = self.context.get("request")
        disallowed_domains = ["plane.so"]  # Add your disallowed domains here
        if request:
            request_host = request.get_host().split(":")[0]  # Remove port if present
            disallowed_domains.append(request_host)

        # Check if hostname is a subdomain or exact match of any disallowed domain
        if any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in disallowed_domains
        ):
            raise serializers.ValidationError(
                {"url": "URL domain or its subdomain is not allowed."}
            )

        return Webhook.objects.create(**validated_data)

    def update(self, instance, validated_data):
        url = validated_data.get("url", None)
        if url:
            # Extract the hostname from the URL
            hostname = urlparse(url).hostname
            if not hostname:
                raise serializers.ValidationError(
                    {"url": "Invalid URL: No hostname found."}
                )

            # Resolve the hostname to IP addresses
            try:
                ip_addresses = socket.getaddrinfo(hostname, None)
            except socket.gaierror:
                raise serializers.ValidationError(
                    {"url": "Hostname could not be resolved."}
                )

            if not ip_addresses:
                raise serializers.ValidationError(
                    {"url": "No IP addresses found for the hostname."}
                )

            for addr in ip_addresses:
                ip = ipaddress.ip_address(addr[4][0])
                if ip.is_loopback:
                    raise serializers.ValidationError(
                        {"url": "URL resolves to a blocked IP address."}
                    )

            # Additional validation for multiple request domains and their subdomains
            request = self.context.get("request")
            disallowed_domains = ["plane.so"]  # Add your disallowed domains here
            if request:
                request_host = request.get_host().split(":")[
                    0
                ]  # Remove port if present
                disallowed_domains.append(request_host)

            # Check if hostname is a subdomain or exact match of any disallowed domain
            if any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in disallowed_domains
            ):
                raise serializers.ValidationError(
                    {"url": "URL domain or its subdomain is not allowed."}
                )

        return super().update(instance, validated_data)

    class Meta:
        model = Webhook
        fields = "__all__"
        read_only_fields = ["workspace", "secret_key"]


class WebhookLogSerializer(DynamicBaseSerializer):
    class Meta:
        model = WebhookLog
        fields = "__all__"
        read_only_fields = ["workspace", "webhook"]

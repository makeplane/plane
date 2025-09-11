# Python imports
import socket
import ipaddress
import re
from urllib.parse import urlparse

# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema


def is_docker_service_name(hostname):
    """
    Check if the hostname appears to be a Docker service name.
    Docker service names typically:
    - Don't contain dots (except for custom networks)
    - Are alphanumeric with hyphens/underscores
    - Don't have TLD extensions
    """
    if not hostname:
        return False
    
    # If hostname contains a dot, check if it looks like a domain
    if '.' in hostname:
        parts = hostname.split('.')
        if len(parts) >= 2:
            # Check if last part looks like a TLD (2-6 letters) or common pseudo-TLD
            last_part = parts[-1].lower()
            # Common TLDs and pseudo-TLDs that indicate it's not a Docker service
            domain_suffixes = [
                # Generic TLDs
                'com', 'net', 'org', 'edu', 'gov', 'mil', 'int',
                # Country TLDs (common ones)
                'uk', 'de', 'fr', 'jp', 'cn', 'au', 'ca', 'in', 'br', 'ru',
                # New gTLDs (common ones)
                'app', 'dev', 'tech', 'cloud', 'io', 'ai', 'co',
                # Common pseudo-TLDs/special domains
                'local', 'localdomain', 'localhost', 'internal', 'corp', 'home'
            ]
            
            if last_part in domain_suffixes or re.match(r'^[a-zA-Z]{2,6}$', last_part):
                return False
    
    # Docker service names are typically alphanumeric with hyphens/underscores/dots
    return re.match(r'^[a-zA-Z0-9._-]+$', hostname) is not None


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

        # Skip DNS resolution and IP validation for Docker service names
        if not is_docker_service_name(hostname):
            # Only perform DNS resolution for external URLs
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
        # Skip this check for Docker service names as they won't match external domains
        if not is_docker_service_name(hostname) and any(
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

            # Skip DNS resolution and IP validation for Docker service names
            if not is_docker_service_name(hostname):
                # Only perform DNS resolution for external URLs
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
            # Skip this check for Docker service names as they won't match external domains
            if not is_docker_service_name(hostname) and any(
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
        read_only_fields = ["workspace", "secret_key", "deleted_at"]


class WebhookLogSerializer(DynamicBaseSerializer):
    class Meta:
        model = WebhookLog
        fields = "__all__"
        read_only_fields = ["workspace", "webhook"]

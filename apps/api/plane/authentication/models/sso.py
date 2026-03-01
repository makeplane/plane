# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import logging
from dns import resolver
import secrets

# Django imports
from django.db import models
from django.core.validators import RegexValidator

# Module imports
from plane.authentication.adapter.error import AuthenticationException, AUTHENTICATION_ERROR_CODES
from plane.db.models.base import BaseModel


logger = logging.getLogger("plane.authentication")


class Domain(BaseModel):
    """
    This model is used to store the workspace domain and the verification token for SSO.
    """

    # Verification status choices
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"

    STATUS_CHOICES = (
        (PENDING, "pending"),
        (VERIFIED, "verified"),
        (FAILED, "failed"),
    )

    # Domain info
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="domains")
    domain = models.CharField(
        max_length=255,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$",
                message="Enter a valid domain name",
            )
        ],
    )
    verification_token = models.CharField(max_length=255, unique=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_status = models.CharField(choices=STATUS_CHOICES, default=PENDING, max_length=255)

    class Meta:
        db_table = "domains"
        verbose_name = "Domain"
        verbose_name_plural = "Domains"
        # Allow multiple pending, but only one verified per domain
        constraints = [
            models.UniqueConstraint(
                fields=["domain"],
                condition=models.Q(verification_status="verified", deleted_at__isnull=True),
                name="unique_verified_domain_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "domain"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_workspace_domain_when_not_deleted",
            ),
        ]

    def __str__(self):
        return f"{self.domain} - {self.verified_at}"

    def save(self, *args, **kwargs):
        # Generate verification token if new
        if not self.verification_token:
            self.verification_token = self.get_dns_txt_record()
        super().save(*args, **kwargs)

    def verify_domain(self):
        """Verify a domain"""
        try:
            txt_records = []
            answers = resolver.resolve(self.domain, "TXT")
            for rdata in answers:
                # Check if the TXT record contains the verification token
                for txt_string in rdata.strings:
                    txt_records.append(txt_string.decode("utf-8"))

            logger.info(
                f"Found {len(txt_records)} TXT records for domain: {self.domain}",
                extra={
                    "domain": self.domain,
                    "txt_records_count": len(txt_records),
                },
            )

            # Check if the verification token is in the TXT records
            expected_txt_record = self.get_dns_txt_record()
            verification_token_found = False

            for txt_record in txt_records:
                if expected_txt_record in txt_record or self.verification_token in txt_record:
                    verification_token_found = True
                    break

            if not verification_token_found:
                logger.warning(f"Verification token not found in TXT records for domain: {self.domain}")
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_VERIFICATION_FAILED"],
                    error_message="DOMAIN_VERIFICATION_FAILED",
                    payload={"domain": self.domain},
                )

            # Mark the domain as verified
            self.mark_as_verified()

            logger.info(
                f"Domain verified: {self.domain}",
                extra={
                    "domain": self.domain,
                },
            )
            return self

        except resolver.NXDOMAIN:
            logger.warning(f"Domain not found: {self.domain}")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_NOT_FOUND"],
                error_message="DOMAIN_NOT_FOUND",
                payload={"domain": self.domain},
            )
        except resolver.NoAnswer:
            logger.warning(f"No TXT record found for domain: {self.domain}")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_NOT_VERIFIED"],
                error_message="DOMAIN_NOT_VERIFIED",
                payload={"domain": self.domain},
            )
        except resolver.Timeout:
            logger.warning(f"Timeout while verifying domain: {self.domain}")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_VERIFICATION_FAILED"],
                error_message="DOMAIN_VERIFICATION_FAILED",
                payload={"domain": self.domain},
            )
        except Exception as e:
            logger.warning(f"Unexpected error during domain verification: {e}")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_VERIFICATION_FAILED"],
                error_message="DOMAIN_VERIFICATION_FAILED",
                payload={"domain": self.domain},
            )

    def get_dns_txt_record(self):
        """Get the DNS TXT record string for verification"""
        return f"domain={self.domain};verification=plane-workspace-verify-{secrets.token_urlsafe(32)}"

    @property
    def is_verified(self):
        """Check if the domain is verified"""
        return self.verification_status == self.VERIFIED and self.verified_at is not None

    @property
    def is_pending(self):
        """Check if the domain verification is pending"""
        return self.verification_status == self.PENDING

    @property
    def is_failed(self):
        """Check if the domain verification failed"""
        return self.verification_status == self.FAILED

    @classmethod
    def check_domain_verification_status(cls, domain_name):
        """
        Check if a domain has already been verified by any workspace.

        Returns:
            tuple: (bool, Domain or None) - (is_verified, domain_object)
        """
        verified_domain = cls.objects.filter(domain=domain_name, verification_status=cls.VERIFIED).first()

        if verified_domain:
            return True, verified_domain
        return False, None

    @classmethod
    def get_or_create_domain(cls, domain_name, workspace_id, created_by=None):
        """
        Get or create a domain for a workspace.
        """
        # Check if domain is already verified
        is_verified, verified_domain = cls.check_domain_verification_status(domain_name)
        if is_verified:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_ALREADY_VERIFIED_FOR_ANOTHER_WORKSPACE"],
                error_message="DOMAIN_ALREADY_VERIFIED_FOR_ANOTHER_WORKSPACE",
                payload={"domain": domain_name, "workspace_id": workspace_id},
            )

        # Check if this workspace already has an entry for this domain
        existing_domain = cls.objects.filter(domain=domain_name, workspace_id=workspace_id).first()
        if existing_domain:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_ALREADY_ASSOCIATED_WITH_WORKSPACE"],
                error_message="DOMAIN_ALREADY_ASSOCIATED_WITH_WORKSPACE",
                payload={"domain": domain_name},
            )

        # Create new domain with pending status
        new_domain = cls.objects.create(
            domain=domain_name,
            workspace_id=workspace_id,
            created_by=created_by,
            verification_status=cls.PENDING,
        )

        logger.info(
            f"Created new domain record: {domain_name}",
            extra={
                "domain": domain_name,
                "workspace_id": workspace_id,
            },
        )
        return new_domain, True

    def mark_as_verified(self):
        """
        Mark this domain as verified and fail all other pending verifications for the same domain.
        """
        from django.utils import timezone

        # Mark this domain as verified
        self.verification_status = self.VERIFIED
        self.verified_at = timezone.now()
        self.save()

        logger.info(
            "Domain verified for workspace",
            extra={
                "domain": self.domain,
                "workspace_id": str(self.workspace_id),
            },
        )

        # Fail all other pending verifications for this domain
        failed_count = (
            Domain.objects.filter(domain=self.domain, verification_status=self.PENDING)
            .exclude(id=self.id)
            .update(verification_status=self.FAILED, updated_at=timezone.now())
        )

        if failed_count > 0:
            logger.info(
                "Failed other pending domain verification(s) for domain",
                extra={
                    "domain": self.domain,
                    "verified_workspace_id": str(self.workspace_id),
                    "failed_count": failed_count,
                },
            )

        return failed_count

    @classmethod
    def get_pending_domains_for_workspace(cls, workspace_id):
        """Get all pending domains for a workspace."""
        return cls.objects.filter(workspace_id=workspace_id, verification_status=cls.PENDING)

    @classmethod
    def get_verified_domains_for_workspace(cls, workspace_id):
        """Get all verified domains for a workspace."""
        return cls.objects.filter(workspace_id=workspace_id, verification_status=cls.VERIFIED)

    @classmethod
    def get_failed_domains_for_workspace(cls, workspace_id):
        """Get all failed domain verifications for a workspace."""
        return cls.objects.filter(workspace_id=workspace_id, verification_status=cls.FAILED)


class IdentityProvider(BaseModel):
    """
    This model is used to store the identity provider for SSO.
    """

    SAML = "saml"
    OIDC = "oidc"

    PROVIDER_CHOICES = (
        (SAML, "SAML"),
        (OIDC, "OIDC"),
    )

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="identity_providers")

    # OIDC configuration
    client_id = models.TextField(null=True, blank=True)
    client_secret = models.TextField(null=True, blank=True)
    authorize_url = models.TextField(null=True, blank=True)
    token_url = models.TextField(null=True, blank=True)
    userinfo_url = models.TextField(null=True, blank=True)
    logout_url = models.TextField(null=True, blank=True)

    # SAML configuration
    entity_id = models.TextField(null=True, blank=True)
    sso_url = models.TextField(null=True, blank=True)
    slo_url = models.TextField(null=True, blank=True)
    certificate = models.TextField(null=True, blank=True)
    # When True, removes RequestedAuthnContext from SAML AuthnRequest
    # This fixes Azure AD error AADSTS75011 when users authenticate with MFA/certificates
    disable_requested_authn_context = models.BooleanField(default=True)
    # Configurable NameID format for SAML metadata
    name_id_format = models.CharField(
        max_length=255,
        default="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    )
    # Configurable attribute mapping: maps Plane fields to IdP attribute names
    # e.g. {"email": "Email", "first_name": "FirstName", "last_name": "LastName"}
    attribute_mapping = models.JSONField(default=dict, blank=True)

    # provider type
    provider = models.CharField(choices=PROVIDER_CHOICES, max_length=255)
    is_enabled = models.BooleanField(default=False)

    class Meta:
        db_table = "identity_providers"
        verbose_name = "Identity Provider"
        verbose_name_plural = "Identity Providers"
        unique_together = [("workspace", "provider")]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "provider"],
                condition=models.Q(deleted_at__isnull=True),
                name="identity_provider_unique_workspace_provider_when_deleted_at_null",
            )
        ]

    def save(self, *args, **kwargs):
        """Save the identity provider"""
        # OIDC configuration
        if self.provider == "oidc":
            if (
                not self.client_id
                or not self.client_secret
                or not self.authorize_url
                or not self.token_url
                or not self.userinfo_url
            ):
                raise ValueError("OIDC configuration is incomplete.")

        # SAML configuration
        if self.provider == "saml":
            if not self.entity_id or not self.sso_url or not self.certificate:
                raise ValueError("SAML configuration is incomplete.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.workspace.name} - {self.domain.domain} - {self.provider}"

    @classmethod
    def is_oidc_configured(cls, workspace_id):
        """Check if OIDC is configured for the workspace"""
        return cls.objects.filter(workspace_id=workspace_id, provider=cls.OIDC, is_enabled=True).exists()

    @classmethod
    def is_saml_configured(cls, workspace_id):
        """Check if SAML is configured for the workspace"""
        return cls.objects.filter(workspace_id=workspace_id, provider=cls.SAML, is_enabled=True).exists()


class IdentityProviderDomain(BaseModel):
    """
    This model is used to store the identity provider domain for SSO.
    """

    identity_provider = models.ForeignKey(
        "authentication.IdentityProvider", on_delete=models.CASCADE, related_name="provider_domains"
    )
    domain = models.ForeignKey("authentication.Domain", on_delete=models.CASCADE, related_name="provider_domains")

    class Meta:
        db_table = "identity_provider_domains"
        verbose_name = "Identity Provider Domain"
        verbose_name_plural = "Identity Provider Domains"
        unique_together = [("identity_provider", "domain")]
        constraints = [
            models.UniqueConstraint(
                fields=["identity_provider", "domain"],
                condition=models.Q(deleted_at__isnull=True),
                name="identity_provider_domain_unique_identity_provider_domain_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.identity_provider.workspace.name} - {self.domain.domain}"

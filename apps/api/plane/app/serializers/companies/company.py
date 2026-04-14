from rest_framework import serializers
from plane.app.serializers.base import BaseSerializer
from plane.db.models import Company, CompanySettings, CompanyMemberRole


class CompanySettingsSerializer(BaseSerializer):
    class Meta:
        model  = CompanySettings
        fields = [
            "id", "annual_leave_days", "sick_leave_days",
            "carry_over_max_days", "carry_over_expiry_months",
            "leave_year_start", "weekend_policy", "public_holiday_region",
            "pay_cycle", "pay_day", "probation_period_days",
            "default_notice_period_days", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CompanyLiteSerializer(BaseSerializer):
    """Minimal — for nesting inside People, Contracts, etc."""
    class Meta:
        model  = Company
        fields = ["id", "name", "trading_name", "logo", "status", "default_currency"]
        read_only_fields = ["id"]


class CompanySerializer(BaseSerializer):
    settings = CompanySettingsSerializer(read_only=True)

    class Meta:
        model  = Company
        fields = [
            "id", "name", "trading_name", "registration_number",
            "tax_id", "vat_number", "company_type", "logo",
            "country", "city", "registered_address", "billing_address",
            "status", "default_currency", "default_timezone",
            "settings", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CompanyMemberRoleSerializer(BaseSerializer):
    member_detail = serializers.SerializerMethodField()

    class Meta:
        model  = CompanyMemberRole
        fields = ["id", "company", "member", "role", "member_detail", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_member_detail(self, obj):
        user = obj.member.member  # WorkspaceMember.member → User
        return {
            "id":           str(obj.member.id),
            "display_name": getattr(user, "display_name", user.email),
            "email":        user.email,
            "avatar":       getattr(user, "avatar", ""),
        }

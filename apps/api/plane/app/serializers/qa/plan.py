from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.db.models import PlanModule, PlanCase, PlanCaseRecord


class PlanModuleCreateUpdateSerializer(ModelSerializer):
    class Meta:
        model = PlanModule
        fields = '__all__'


class PlanModuleListSerializer(ModelSerializer):
    count = serializers.SerializerMethodField()

    def get_count(self, obj: PlanModule):
        return obj.plans.count()

    class Meta:
        model = PlanModule
        fields = '__all__'


class PlanCaseListSerializer(ModelSerializer):
    class Meta:
        model = PlanCase
        fields = '__all__'
        depth = 1


class PlanCaseCardSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()

    def get_name(self, obj: PlanCase):
        return obj.case.name

    def get_priority(self, obj: PlanCase):
        return obj.case.priority

    class Meta:
        model = PlanCase
        fields = '__all__'


class PlanCaseRecordSerializer(ModelSerializer):
    class Meta:
        model = PlanCaseRecord
        fields = '__all__'

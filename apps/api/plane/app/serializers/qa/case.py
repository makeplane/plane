from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.db.models import PlanCaseRecord, CaseLabel


class CaseExecuteRecordSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, obj: PlanCaseRecord):
        return obj.plan_case.plan.name

    class Meta:
        model = PlanCaseRecord
        fields = '__all__'

class CaseLabelListSerializer(ModelSerializer):
    class Meta:
        model = CaseLabel
        fields = '__all__'


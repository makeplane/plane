from rest_framework.serializers import (
    ModelSerializer,
    Serializer,
    CharField,
    SerializerMethodField,
)
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken


from plane.db.models import User


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}


class ChangePasswordSerializer(Serializer):
    model = User

    """
    Serializer for password change endpoint.
    """
    old_password = CharField(required=True)
    new_password = CharField(required=True)


class ResetPasswordSerializer(Serializer):
    model = User

    """
    Serializer for password change endpoint.
    """
    new_password = CharField(required=True)
    confirm_password = CharField(required=True)


class TokenSerializer(ModelSerializer):

    user = UserSerializer()
    access_token = SerializerMethodField()
    refresh_token = SerializerMethodField()

    def get_access_token(self, obj):
        refresh_token = RefreshToken.for_user(obj.user)
        return str(refresh_token.access_token)

    def get_refresh_token(self, obj):
        refresh_token = RefreshToken.for_user(obj.user)
        return str(refresh_token)

    class Meta:
        model = Token
        fields = "__all__"

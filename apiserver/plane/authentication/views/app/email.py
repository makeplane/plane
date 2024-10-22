from urllib.parse import urlencode, urljoin
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View
from plane.authentication.provider.credentials.email import EmailProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import User
from plane.authentication.adapter.error import AuthenticationException, AUTHENTICATION_ERROR_CODES

class AuthEndpoint(View):

    def rediret_with_error(self, request, error_code, error_message, next_path=None, payload=None):
        exc = AuthenticationException(
            error_code=error_code,
            error_message=error_message,
            payload=payload,
        ) 
        params = exc.get_error_dict()
        if next_path:
            params["next_path"] = str(next_path)
        url = urljoin(base_host(request=request, is_app=True), "?" + urlencode(params))
        return HttpResponseRedirect(url)
    
    def check_instace_setup(self, request, next_path):
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return self.rediret_with_error(
                request,
                AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                "INSTANCE_NOT_CONFIGURED",
                next_path
            )
        return None
    
    def validate_email_and_password(self, email, password, next_path, request):
        if not email or not password:
            return self.redirect_with_error(
                request,
                AUTHENTICATION_ERROR_CODES["REQUIRED_EMAIL_PASSWORD_SIGN_IN"],
                "REQUIRED_EMAIL_PASSWORD_SIGN_IN"
                next_path,
                {"email": str(email)},
                )
                
                
                
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            return self.redirect_with_error(
                request,
                    AUTHENTICATION_ERROR_CODES["INVAILD_EMAIL_SIGN_IN"],
                    "INVALID_EMAIL_SIGN_IN",
                    next_path,
                    {"email": str(email)}
                )
        return email

    def handle_user_authentication(self, request, email, password, next_path):
        existing_user = User.objects.filter(email=email).first()
        if not existing_user:
            return self.redirect_with_error(
                request,
                AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXSIT"],
                "USER_DOES_NOT_EXIST",
                next_path,
                {"email": str(email)}

            )
        
        try:
            provider = EmailProvider(
                request=request,
                key=email,
                code=password,
                is_signup= False,
                callback=post_user_auth_workflow,
                
            )

            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)

            path = next_path if next_path else get_redirection_path(user=user)
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            return self.redirect_with_error(request,e.error_message, next_path)
class SignInAuthEndpoint (AuthEndpoint):

    def post(self, request):
        next_path = request.POST.get("next_path")
        redirect_response = self.check_instace_setup(request, next_path)
        if redirect_response:
            return redirect_response
        
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        email = self.validate_email_and_password(email, password, next_path, request)
        if isinstance(email, HttpResponseRedirect):
            return email
        return self.handle_user_authentication(request, email, password, next_path)
    
class SignUpAuthEndpoint(AuthEndpoint):
    def post(self, request):
        next_path = request.POST.get("next_path")
        redirect_reponse = self.check_instace_setup(request, next_path)
        if redirect_reponse:
            return redirect_reponse
        
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        email = self.validate_email_and_password(email, password, next_path, request)
        if isinstance(email, HttpResponseRedirect):
            return email
        
        existing_user = User.objects.filiter(email=email).first()
        if existing_user:
            return self.rediret_with_error(
                request,
                AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXIST"],
                "USER_ALREADY_EXIST",
                next_path,
                {"email": str(email)}                
            )
        
        try:
            provider = EmailProvider(
                request=request
                key=email,
                code=password
                is_signup=True,
                callback=post_user_auth_workflow,
            )

            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)
            path = next_path if next_path else get_redirection_path(user=user)
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:

            return self.redirect_with_error(request, e.error_code, e.error_message, next_path)

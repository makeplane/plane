# Python imports
import json
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.provider.credentials.magic_code import (
    MagicCodeProvider,
)
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import (
    post_user_auth_workflow,
)
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.db.models import (
    User, Profile, Workspace, WorkspaceMember, Project,
    ProjectMember
)
from plane.app.serializers import ProjectSerializer

from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.rate_limit import AuthenticationThrottle
from plane.api.views.base import BaseAPIView
from plane.api.views.project import create_project

class MagicGenerateEndpoint(BaseAPIView):
    # permission_classes = [
    #     AllowAny,
    # ]

    throttle_classes = [
        AuthenticationThrottle,
    ]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            print("[MAGIC_GENERATE] Instance not configured")
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "INSTANCE_NOT_CONFIGURED"
                ],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(
                exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST
            )

        origin = request.META.get("HTTP_ORIGIN", "/")
        email = request.data.get("email", False)
        if not email:
            username = request.data.get("username", False)
            if username:
                email = username + "@plane-shipsy.com"
        
        print(f"[MAGIC_GENERATE] Request received - email: {email}, origin: {origin}, username: {request.data.get('username', 'N/A')}")
        
        try:
            # Clean up the email
            email = email.strip().lower()
            validate_email(email)
            print(f"[MAGIC_GENERATE] Email validated - email: {email}")
            
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            
            print(f"[MAGIC_GENERATE] Token generated successfully - email: {email}, key: {key}, token: {token}")
            
            # If the smtp is configured send through here
            # magic_link.delay(email, key, token, origin)
            return Response({"key": str(key), "token": token}, status=status.HTTP_200_OK)
        except AuthenticationException as e:
            params = e.get_error_dict()
            print(f"[MAGIC_GENERATE] AuthenticationException - email: {email}, error: {params}")
            return Response(
                params,
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_classes = [
        AuthenticationThrottle,
    ]
    
    def extract_hub_codes_from_hub_list(self, hub_list_str):
        """
        Extract hub codes from hub_list JSON string.
        
        Args:
            hub_list_str: JSON string containing array of hub objects with 'code' field
            
        Returns:
            List of hub codes (strings), empty list if parsing fails or no codes found
        """
        if not hub_list_str:
            return []
        
        try:
            hub_list = json.loads(hub_list_str)
            if not isinstance(hub_list, list):
                return []
            
            hub_codes = []
            for hub in hub_list:
                if isinstance(hub, dict) and "code" in hub:
                    code = hub.get("code")
                    if code:
                        hub_codes.append(str(code))
            
            return hub_codes
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            # Log error but don't break authentication flow
            print(f"[MAGIC_SIGNIN] Error parsing hub_list: {e}")
            return []
    
    def extract_hub_names_from_hub_list(self, hub_list_str):
        """
        Extract hub names from hub_list JSON string.
        
        Args:
            hub_list_str: JSON string containing array of hub objects with 'name' field
            
        Returns:
            List of hub names (strings), empty list if parsing fails or no names found
        """
        if not hub_list_str:
            return []
        
        try:
            hub_list = json.loads(hub_list_str)
            if not isinstance(hub_list, list):
                return []
            
            hub_names = []
            for hub in hub_list:
                if isinstance(hub, dict) and "name" in hub:
                    name = hub.get("name")
                    if name:
                        hub_names.append(str(name))
            
            return hub_names
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            print(f"[MAGIC_SIGNIN] Error parsing hub_list for names: {e}")
            return []
    
    def add_user_to_workspace(self, user, workspace_slug):
        admin_user = User.objects.filter(is_superuser=True).first()
        workspace, base_project = self.get_workspace(workspace_slug, admin_user)
        self.add_to_workspace(workspace, user)
        self.add_to_project(base_project, user)
        self.add_to_project(base_project, admin_user)
        return workspace
    

    def add_to_workspace(self, workspace, user):
        workspace_member = WorkspaceMember.objects.filter(
            workspace=workspace, member=user
        ).first()
        if not workspace_member:
            workspace_member = WorkspaceMember.objects.create(
                workspace=workspace, member=user, is_active=True,
                role=15
            )
            try:
                user.profile.last_workspace_id = workspace.id
                user.profile.onboarding_step.update({
                    'profile_complete': True,
                    'workspace_join': True
                })
                user.profile.is_tour_completed = True
                user.profile.is_onboarded = True
                user.is_password_autoset = False
                user.profile.company_name = workspace.name
                user.save()
                user.profile.save()
            except Exception as e:
                print(f"[MAGIC_SIGNIN] Error updating user profile: {e}")

    def add_to_project(self, project, user):
        pm = ProjectMember.objects.filter(
            member=user, 
            project=project
        )
        if not pm.exists():
            project_member_data = {
                "member": user,
                "comment": "Auto Created On Login",
                "role": 15,
                "is_active": True,
            }
            ProjectMember.objects.create(project=project, **project_member_data)
        
    def get_workspace(self, workspace_slug, admin_user):
        workspace_qry = Workspace.objects.filter(
            slug=workspace_slug
        )
        if workspace_qry.exists():
            workspace = workspace_qry.first()
        else:
            workspace = Workspace.objects.create(
                slug=workspace_slug,
                name=workspace_slug,
                owner_id=admin_user.id
            )
        project = self.get_or_create_project(workspace, admin_user)
        return workspace, project
        
    def get_or_create_project(self, workspace, user):
        default_project_dict ={
            'identifier': 'TICKET',
            'workspace_id': workspace.id,
            'name': 'TICKET'
        }
        project = Project.objects.filter(**default_project_dict).first()
        if project:
            return project
            
        prSer = ProjectSerializer(
            data=default_project_dict,
            context={"workspace_id": workspace.id}
        )
        prSer.is_valid()
        if prSer.errors:
            raise Exception(prSer.errors)
        
        prSer.save()
        create_project(
            workspace.slug,
            '', 
            user, 
            prSer,
            prSer.validated_data
        )
        return prSer.instance
        

    def post(self, request):
        # set the referer as session to redirect after login
        base_host_url = base_host(request=request, is_app=True)
        print(f"[MAGIC_SIGNIN] Request received - base_host: {base_host_url}")
        
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()
        app_url = request.POST.get("app_url", "").strip().lower()
        workspace = request.POST.get("workspace", "").strip().lower()
        language = request.POST.get("language", "en").strip()  # Get language, default to 'en'
        next_path = request.POST.get("next_path")
        hub_list_str = request.POST.get("hub_list")
        extra_hubs_str = request.POST.get("extra_hubs", "false").strip().lower()
        employee_permissions_str = request.POST.get("employee_permissions")
        
        print(f"[MAGIC_SIGNIN] Request parameters - email: {email}, code: {code}, workspace: {workspace}, app_url: {app_url}, next_path: {next_path}, language: {language}")
        
        hub_codes = None
        hub_names = None
        extra_hubs = None
        employee_permissions = None
        
        if hub_list_str is not None:
            hub_codes = self.extract_hub_codes_from_hub_list(hub_list_str)
            hub_names = self.extract_hub_names_from_hub_list(hub_list_str)
        
        if extra_hubs_str:
            extra_hubs = extra_hubs_str == "true"
        
        if employee_permissions_str:
            try:
                employee_permissions = json.loads(employee_permissions_str)
                if not isinstance(employee_permissions, list):
                    employee_permissions = []
            except (json.JSONDecodeError, TypeError, ValueError) as e:
                print(f"[MAGIC_SIGNIN] Error parsing employee_permissions: {e}")
                employee_permissions = []
        if code == "" or email == "":
            print(f"[MAGIC_SIGNIN] Missing required parameters - email: {email}, code: {code}")
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        # Existing User
        try:
            existing_user = User.objects.filter(email=email).first()
            print(f"[MAGIC_SIGNIN] User lookup - email: {email}, user_exists: {existing_user is not None}")
            
            if not existing_user:
                print(f"[MAGIC_SIGNIN] New user sign-in flow - email: {email}, code: {code}")
                provider = MagicCodeProvider(
                    request=request,
                    key=f"magic_{email}",
                    code=code,
                    callback=post_user_auth_workflow,
                )
                print(f"[MAGIC_SIGNIN] Attempting authentication for new user - email: {email}, redis_key: magic_{email}")
                user = provider.authenticate()
                print(f"[MAGIC_SIGNIN] Authentication successful for new user - email: {email}, user_id: {user.id}")
                
                profile, _ = Profile.objects.get_or_create(user=user)
                profile.language = language
                profile.save()
                update_fields = []
                if hub_codes is not None:
                    user.hub_codes = hub_codes
                    update_fields.append("hub_codes")
                if hub_names is not None:
                    user.hub_names = hub_names
                    update_fields.append("hub_names")
                if extra_hubs is not None:
                    user.extra_hubs = extra_hubs
                    update_fields.append("extra_hubs")
                if employee_permissions is not None:
                    user.employee_permissions = employee_permissions
                    update_fields.append("employee_permissions")
                if update_fields:
                    user.save(update_fields=update_fields)
                # Login the user and record his device info
                user_login(request=request, user=user, is_app=True)
                self.add_user_to_workspace(user, workspace)
                # Get the redirection path
                if next_path:
                    path = str(next_path)
                else:
                    path = get_redirection_path(user=user)
                # redirect to referer path
                url = urljoin(base_host(request=request, is_app=True), path)
                if app_url:
                    url = urljoin(app_url, path)
                print(f"[MAGIC_SIGNIN] New user sign-in complete - email: {email}, redirect_url: {url}")
                return HttpResponseRedirect(url)
            else:
                print(f"[MAGIC_SIGNIN] Existing user sign-in flow - email: {email}, code: {code}, user_id: {existing_user.id}")
                provider = MagicCodeProvider(
                    request=request,
                    key=f"magic_{email}",
                    code=code,
                    callback=post_user_auth_workflow,
                )
                print(f"[MAGIC_SIGNIN] Attempting authentication for existing user - email: {email}, redis_key: magic_{email}")
                user = provider.authenticate()
                print(f"[MAGIC_SIGNIN] Authentication successful for existing user - email: {email}, user_id: {user.id}")
                
                profile, _ = Profile.objects.get_or_create(user=user)
                profile.language = language
                profile.save()
                update_fields = []
                if hub_codes is not None:
                    user.hub_codes = hub_codes
                    update_fields.append("hub_codes")
                if hub_names is not None:
                    user.hub_names = hub_names
                    update_fields.append("hub_names")
                if extra_hubs is not None:
                    user.extra_hubs = extra_hubs
                    update_fields.append("extra_hubs")
                if employee_permissions is not None:
                    user.employee_permissions = employee_permissions
                    update_fields.append("employee_permissions")
                if update_fields:
                    user.save(update_fields=update_fields)
                # Login the user and record his device info
                self.add_user_to_workspace(user, workspace)
                user_login(request=request, user=user, is_app=True)
                # Get the redirection path
                path = (
                    str(next_path)
                    if next_path
                    else "/" + workspace
                )
                # redirect to referer path
                url = urljoin(base_host(request=request, is_app=True), path)
                if app_url:
                    url = urljoin(app_url, path)
                
                print(f"[MAGIC_SIGNIN] Existing user sign-in complete - email: {email}, redirect_url: {url}")
                return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            print(f"[MAGIC_SIGNIN] AuthenticationException - email: {email}, code: {code}, error_code: {params.get('error_code')}, error_message: {params.get('error_message')}, error_dict: {params}")
            if next_path:
                params["next_path"] = str(next_path)
            path = "sign-in?" + urlencode(params)
            url = urljoin(
                base_host(request=request, is_app=True),
                path
            )
            if app_url:
                url = urljoin(app_url, path)
            print(f"[MAGIC_SIGNIN] Redirecting to error page - url: {url}")
            return HttpResponseRedirect(url)


class MagicSignUpEndpoint(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_classes = [
        AuthenticationThrottle,
    ]
    def post(self, request):

        # set the referer as session to redirect after login
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()
        is_app = request.POST.get("is_app", False)
        next_path = request.POST.get("next_path")

        if code == "" or email == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        # Existing user
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXIST"],
                error_message="USER_ALREADY_EXIST",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user, is_app=True)
            # Get the redirection path
            if next_path:
                path = str(next_path)
            else:
                path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

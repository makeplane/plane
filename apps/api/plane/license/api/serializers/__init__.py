# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .instance import InstanceSerializer

from .configuration import InstanceConfigurationSerializer
from .admin import InstanceAdminSerializer, InstanceAdminMeSerializer
from .workspace import WorkspaceSerializer
from .mailbox import MailDomainSerializer, MailboxSerializer, MailAliasSerializer
from .user import InstanceUserSerializer

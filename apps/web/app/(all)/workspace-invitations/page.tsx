/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Boxes, Share2, Star, User2 } from "lucide-react";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { EmptySpace, EmptySpaceItem } from "@/components/ui/empty-space";
// constants
import { WORKSPACE_INVITATION } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceService } from "@/services/workspace.service";
// services

// service initialization
const workspaceService = new WorkspaceService();

function WorkspaceInvitationPage() {
  // router
  const router = useAppRouter();
  // query params
  const searchParams = useSearchParams();
  const invitation_id = searchParams.get("invitation_id");
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");
  // store hooks
  const { data: currentUser } = useUser();

  const { data: invitationDetail, error } = useSWR(
    invitation_id && slug && WORKSPACE_INVITATION(invitation_id.toString()),
    invitation_id && slug
      ? () => workspaceService.getWorkspaceInvitation(slug.toString(), invitation_id.toString())
      : null
  );

  const handleAccept = () => {
    if (!invitationDetail) return;
    workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: true,
        token: token,
      })
      .then(() => {
        if (invitationDetail.email === currentUser?.email) {
          router.push(`/${invitationDetail.workspace.slug}`);
        } else {
          router.push("/");
        }
      })
      .catch((err: unknown) => console.error(err));
  };

  const handleReject = () => {
    if (!invitationDetail || !token) return;
    void workspaceService
      .joinWorkspace(invitationDetail.workspace.slug, invitationDetail.id, {
        accepted: false,
        token: token,
      })
      .then(() => {
        router.push("/");
      })
      .catch((err: unknown) => console.error(err));
  };

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail && !invitationDetail.responded_at ? (
          error ? (
            <div className="shadow-2xl flex w-full flex-col space-y-4 rounded-sm border border-subtle bg-surface-1 px-4 py-8 text-center md:w-1/3">
              <h2 className="text-18 uppercase">Приглашение не найдено</h2>
            </div>
          ) : (
            <EmptySpace
              title={`Вас пригласили в ${invitationDetail.workspace.name}`}
              description="Рабочее пространство — это место, где вы создаёте проекты, совместно работаете над рабочими элементами и организуете различные потоки работы в вашей учётной записи Gizmo."
            >
              <EmptySpaceItem Icon={CheckIcon} title="Принять" action={handleAccept} />
              <EmptySpaceItem Icon={CloseIcon} title="Игнорировать" action={handleReject} />
            </EmptySpace>
          )
        ) : error || invitationDetail?.responded_at ? (
          invitationDetail?.accepted ? (
            <EmptySpace
              title={`Вы уже являетесь участником ${invitationDetail.workspace.name}`}
              description="Рабочее пространство — это место, где вы создаёте проекты, совместно работаете над рабочими элементами и организуете различные потоки работы в вашей учётной записи Gizmo."
            >
              <EmptySpaceItem Icon={Boxes} title="Перейти на главную" href="/" />
            </EmptySpace>
          ) : (
            <EmptySpace
              title="Эта ссылка-приглашение больше не активна."
              description="Рабочее пространство — это место, где вы создаёте проекты, совместно работаете над рабочими элементами и организуете различные потоки работы в вашей учётной записи Gizmo."
              link={{ text: "Или начните с пустого проекта", href: "/" }}
            >
              {!currentUser ? (
                <EmptySpaceItem Icon={User2} title="Войдите, чтобы продолжить" href="/" />
              ) : (
                <EmptySpaceItem Icon={Boxes} title="Перейти на главную" href="/" />
              )}
              <EmptySpaceItem Icon={Star} title="Поставьте нам звезду на GitHub" href="https://github.com/makeplane" />
              <EmptySpaceItem
                Icon={Share2}
                title="Присоединяйтесь к нашему сообществу активных авторов"
                href="https://forum.gizmo.so"
              />
            </EmptySpace>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LogoSpinner />
          </div>
        )}
      </div>
    </AuthenticationWrapper>
  );
}

export default observer(WorkspaceInvitationPage);

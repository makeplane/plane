import { useState } from "react";
import { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout/layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
//types
import { IApiToken } from "types/api_token";
//Mobx
import { observer } from "mobx-react-lite";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { APITokenForm, DeleteTokenModal } from "components/api-token";

const CreateApiToken: NextPage = () => {
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null>();
  const [deleteTokenModal, setDeleteTokenModal] = useState<boolean>(false);

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Api Tokens" />}>
      <WorkspaceSettingLayout>
        <DeleteTokenModal
          isOpen={deleteTokenModal}
          handleClose={() => setDeleteTokenModal(false)}
          tokenId={generatedToken?.id}
        />
        <APITokenForm
          generatedToken={generatedToken}
          setGeneratedToken={setGeneratedToken}
          setDeleteTokenModal={setDeleteTokenModal}
        />
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default observer(CreateApiToken);

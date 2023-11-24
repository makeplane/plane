import { useState } from "react";
// layouts
import { AppLayout } from "layouts/app-layout/layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { APITokenForm, DeleteTokenModal } from "components/api-token";
// types
import { IApiToken } from "types/api_token";
import { NextPageWithLayout } from "types/app";

const CreateApiTokenPage: NextPageWithLayout = () => {
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null>();
  const [deleteTokenModal, setDeleteTokenModal] = useState<boolean>(false);

  return (
    <>
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
    </>
  );
};

CreateApiTokenPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="API Tokens" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default CreateApiTokenPage;

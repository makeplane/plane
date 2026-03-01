/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useEffect } from "react";
// plane imports
import type { TDomain } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local components
import { AddDomainForm } from "./add-domain-form";
import { VerifyDomainForm } from "./verify-domain-form";

type TModalStep = "CREATE" | "VERIFY";

type TAddDomainModal = {
  isOpen: boolean;
  domain: TDomain | undefined;
  onClose: () => void;
  workspaceSlug: string;
};

export function AddDomainModal(props: TAddDomainModal) {
  const { isOpen, domain, onClose, workspaceSlug } = props;
  // state
  const [currentStep, setCurrentStep] = useState<TModalStep>(domain ? "VERIFY" : "CREATE");
  const [verificationDomain, setVerificationDomain] = useState<TDomain | null>(domain || null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow modal close animation
      const timeout = setTimeout(() => {
        setCurrentStep("CREATE");
        setVerificationDomain(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleDomainCreated = (domain: TDomain) => {
    setVerificationDomain(domain);
    setCurrentStep("VERIFY");
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {currentStep === "VERIFY" && verificationDomain ? (
        <VerifyDomainForm workspaceSlug={workspaceSlug} domain={verificationDomain} onClose={handleClose} />
      ) : (
        <AddDomainForm workspaceSlug={workspaceSlug} onClose={handleClose} onSuccess={handleDomainCreated} />
      )}
    </ModalCore>
  );
}

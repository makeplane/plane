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

// plane imports
import type { EIssuePropertyType, IIssueProperty, TBaseActivityVerbs, TIssuePropertyTypeKeys } from "@plane/types";
import { getIssuePropertyTypeKey, joinUrlPath, renderFormattedDate } from "@plane/utils";
// store context
import { store } from "@/lib/store-context";

type TGetWorkItemAdditionalPropertiesActivityMessageParams = {
  action: TBaseActivityVerbs | undefined;
  newValue: string | undefined;
  oldValue: string | undefined;
  propertyDetail: IIssueProperty<EIssuePropertyType> | undefined;
  workspaceId: string | undefined;
};

type TGetWorkItemAdditionalPropertiesActivityMessage = (
  props: TGetWorkItemAdditionalPropertiesActivityMessageParams
) => React.ReactNode;

// ------------ TEXT ------------
const getWorkItemTextPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail } = props;
  // derived values
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {newValue ? (
        <>
          {action === "created" ? "set " : "changed "}
          <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{`"${newValue}"`}.</span>
        </>
      ) : (
        <>
          cleared the previous text in <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ NUMBER ------------
const getWorkItemNumberPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail } = props;
  // derived values
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {newValue ? (
        <>
          {action === "created" ? "set " : "changed "}
          <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{newValue}.</span>
        </>
      ) : (
        <>
          removed the previous number in <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ DROPDOWN ------------
const getWorkItemDropdownPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail, oldValue } = props;
  // derived values
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {action === "created" && newValue ? (
        <>
          selected{" "}
          <span className="font-medium text-primary">{propertyDetail?.getPropertyOptionById(newValue)?.name}</span> as
          value(s) for <span className="font-medium text-primary">{propertyName}</span>.
        </>
      ) : (
        action === "deleted" &&
        oldValue && (
          <>
            deselected{" "}
            <span className="font-medium text-primary">{propertyDetail?.getPropertyOptionById(oldValue)?.name}</span>{" "}
            from the previous selection in <span className="font-medium text-primary">{propertyName}</span>.
          </>
        )
      )}
      {action === "updated" && oldValue && newValue && (
        <>
          changed{" "}
          <span className="font-medium text-primary">{propertyDetail?.getPropertyOptionById(oldValue)?.name}</span> to{" "}
          <span className="font-medium text-primary">{propertyDetail?.getPropertyOptionById(newValue)?.name}</span> in{" "}
          <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ BOOLEAN ------------
const getWorkItemBooleanPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail } = props;
  // derived values
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {newValue && (
        <>
          {action === "created" ? "set " : "updated "}
          <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{newValue === "true" ? "True" : "False"}.</span>
        </>
      )}
    </>
  );
};

// ------------ DATE ------------
const getWorkItemDatePropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail, oldValue } = props;
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {action === "created" && (
        <>
          set <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{renderFormattedDate(newValue)}.</span>
        </>
      )}
      {action === "updated" && (
        <>
          changed <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{renderFormattedDate(newValue)}</span> from{" "}
          <span className="font-medium text-primary">{renderFormattedDate(oldValue)}.</span>{" "}
        </>
      )}
      {action === "deleted" && (
        <>
          removed <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ RELATION USER ------------
const getWorkItemMemberPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail, oldValue, workspaceId } = props;
  // derived values
  const propertyName = propertyDetail?.display_name;
  const workspaceDetail = workspaceId ? store.workspaceRoot.getWorkspaceById(workspaceId) : null;
  const getUserDetails = store.memberRoot.getUserDetails;

  function MemberDetail({ id }: { id: string }) {
    const userDetail = getUserDetails(id);
    const memberDetailContent = (
      <span className="font-medium text-primary">{userDetail?.first_name + " " + userDetail?.last_name}</span>
    );

    return workspaceDetail?.slug && id ? (
      <a
        href={joinUrlPath(workspaceDetail?.slug, "profile", id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center font-medium text-primary hover:underline capitalize"
      >
        {memberDetailContent}
      </a>
    ) : (
      memberDetailContent
    );
  }

  return (
    <>
      {action === "created" && newValue ? (
        <>
          selected <MemberDetail id={newValue} /> as member(s) for{" "}
          <span className="font-medium text-primary">{propertyName}</span>.
        </>
      ) : (
        action === "deleted" &&
        oldValue && (
          <>
            deselected <MemberDetail id={oldValue} /> from the previous selection in{" "}
            <span className="font-medium text-primary">{propertyName}</span>.
          </>
        )
      )}
      {action === "updated" && oldValue && newValue && (
        <>
          changed <MemberDetail id={oldValue} /> to <MemberDetail id={newValue} /> in{" "}
          <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ URL ------------
const getWorkItemUrlPropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = (props) => {
  const { newValue, action, propertyDetail } = props;
  const propertyName = propertyDetail?.display_name;

  return (
    <>
      {newValue ? (
        <>
          {action === "created" ? "set " : "changed "}
          <span className="font-medium text-primary">{propertyName}</span> to{" "}
          <span className="font-medium text-primary">{newValue}.</span>
        </>
      ) : (
        <>
          removed the previous URL in <span className="font-medium text-primary">{propertyName}</span>.
        </>
      )}
    </>
  );
};

// ------------ RELATION ISSUE ------------
const getWorkItemRelationIssuePropertyActivityMessage: TGetWorkItemAdditionalPropertiesActivityMessage = () => null;

// ------------ CUSTOM PROPERTY MESSAGE HELPER ------------
export const getWorkItemCustomPropertyActivityMessage = (
  props: TGetWorkItemAdditionalPropertiesActivityMessageParams
) => {
  const { propertyDetail } = props;
  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);

  const getWorkItemCustomPropertyActivityMessageHelpers: Record<
    TIssuePropertyTypeKeys,
    TGetWorkItemAdditionalPropertiesActivityMessage
  > = {
    TEXT: getWorkItemTextPropertyActivityMessage,
    DECIMAL: getWorkItemNumberPropertyActivityMessage,
    OPTION: getWorkItemDropdownPropertyActivityMessage,
    BOOLEAN: getWorkItemBooleanPropertyActivityMessage,
    DATETIME: getWorkItemDatePropertyActivityMessage,
    RELATION_USER: getWorkItemMemberPropertyActivityMessage,
    RELATION_ISSUE: getWorkItemRelationIssuePropertyActivityMessage,
    URL: getWorkItemUrlPropertyActivityMessage,
  };

  const getWorkItemCustomPropertyActivityMessageHelper =
    getWorkItemCustomPropertyActivityMessageHelpers[propertyTypeKey];

  if (!getWorkItemCustomPropertyActivityMessageHelper) return null;

  return getWorkItemCustomPropertyActivityMessageHelper(props);
};

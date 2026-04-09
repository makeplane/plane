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

type Props = {
  nameIdFormat?: string;
  attributeMapping?: Record<string, string>;
};

export const NAME_ID_FORMAT_OPTIONS = [
  {
    value: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    label: "Email Address",
    shortLabel: "emailAddress",
  },
  { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent", label: "Persistent", shortLabel: "persistent" },
  { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient", label: "Transient", shortLabel: "transient" },
  { value: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified", label: "Unspecified", shortLabel: "unspecified" },
] as const;

export function SAMLAttributeMappingTable(props: Props) {
  const {
    nameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    attributeMapping = {
      email: "email",
      first_name: "first_name",
      last_name: "last_name",
      display_name: "preferred_username",
    },
  } = props;

  const selectedOption = NAME_ID_FORMAT_OPTIONS.find((opt) => opt.value === nameIdFormat);
  const formatLabel = selectedOption?.shortLabel || nameIdFormat;

  return (
    <table className="table-auto border-collapse text-secondary text-13 w-full">
      <thead>
        <tr className="text-left border-b border-subtle-1">
          <th className="py-2">IdP attribute</th>
          <th className="py-2">Plane field</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-subtle-1">
          <td className="py-2">Name ID format</td>
          <td className="py-2">{formatLabel}</td>
        </tr>
        {Object.entries(attributeMapping).map(([planeField, idpAttr]) => (
          <tr key={planeField} className="border-b border-subtle-1">
            <td className="py-2">{idpAttr || planeField}</td>
            <td className="py-2">{planeField}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

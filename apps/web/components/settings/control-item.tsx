/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Field } from "@base-ui/react/field";
import { FieldDescription } from "@makeplane/propel/components/field";
import { FieldLabel } from "@makeplane/propel/elements/field";

type Props = {
  control: React.ReactNode;
  description: string;
  title: React.ReactNode;
};

export function SettingsControlItem(props: Props) {
  const { control, description, title } = props;

  return (
    <Field.Root className="flex w-full flex-col items-start gap-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8">
      <div className="flex min-w-0 flex-col gap-1">
        <Field.Label
          nativeLabel={false}
          render={
            <FieldLabel
              size="xl"
              inset={false}
              render={({ children, ...headingProps }) => <h4 {...headingProps}>{children}</h4>}
            />
          }
        >
          {title}
        </Field.Label>
        <FieldDescription size="md">{description}</FieldDescription>
      </div>
      <div className="shrink-0">{control}</div>
    </Field.Root>
  );
}

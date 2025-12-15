import React from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
// hooks
import useTimezone from "@/hooks/use-timezone";
// local imports
import { PowerKModalCommandItem } from "../../modal/command-item";

type Props = {
  onSelect: (timezone: string) => void;
};

export const PowerKPreferencesTimezonesMenu = observer(function PowerKPreferencesTimezonesMenu(props: Props) {
  const { onSelect } = props;
  // timezones
  const { timezones } = useTimezone();

  return (
    <Command.Group>
      {timezones.map((timezone) => (
        <PowerKModalCommandItem
          key={timezone.value}
          onSelect={() => onSelect(timezone.value)}
          label={timezone.content}
        />
      ))}
    </Command.Group>
  );
});

import { Menu, Transition } from "@headlessui/react";
import { ToggleSwitch } from "@plane/ui";
import { Dispatch, Fragment, SetStateAction } from "react";
import { Control, Controller } from "react-hook-form";
import { IApiFormFields } from "./types";

interface IApiTokenExpiry {
  neverExpires: boolean;
  selectedExpiry: number;
  setSelectedExpiry: Dispatch<SetStateAction<number>>;
  setNeverExpire: Dispatch<SetStateAction<boolean>>;
  renderExpiry: () => string;
  control: Control<IApiFormFields, any>;
}

export const expiryOptions = [
  {
    title: "7 Days",
    days: 7,
  },
  {
    title: "30 Days",
    days: 30,
  },
  {
    title: "1 Month",
    days: 30,
  },
  {
    title: "3 Months",
    days: 90,
  },
  {
    title: "1 Year",
    days: 365,
  },
];

export const ApiTokenExpiry = ({
  neverExpires,
  selectedExpiry,
  setSelectedExpiry,
  setNeverExpire,
  renderExpiry,
  control,
}: IApiTokenExpiry) => (
  <>
    <Menu>
      <p className="text-sm font-medium mb-2"> Expiration Date</p>
      <Menu.Button className={"w-[40%]"} disabled={neverExpires}>
        <div className="py-3 w-full font-medium px-3 flex border border-custom-border-200 rounded-md justify-center items-baseline">
          <p className={`text-base ${neverExpires ? "text-custom-text-400/40" : ""}`}>
            {expiryOptions[selectedExpiry].title.toLocaleLowerCase()}
          </p>
          <p className={`text-sm mr-auto ml-2 text-custom-text-400${neverExpires ? "/40" : ""}`}>({renderExpiry()})</p>
        </div>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 overflow-y-scroll whitespace-nowrap rounded-sm max-h-36 border origin-top-right mt-1 overflow-auto min-w-[10rem] border-custom-border-100 p-1 shadow-lg focus:outline-none bg-custom-background-100">
          {expiryOptions.map((option, index) => (
            <Menu.Item key={index}>
              {({ active }) => (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExpiry(index);
                    }}
                    className={`w-full text-sm select-none truncate rounded px-3 py-1.5 text-left text-custom-text-300 hover:bg-custom-background-80 ${
                      active ? "bg-custom-background-80" : ""
                    }`}
                  >
                    {option.title}
                  </button>
                </div>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>

    <div className="mt-4 mb-6 flex items-center">
      <span className="text-sm font-medium"> Never Expires</span>
      <Controller
        control={control}
        name="never_expires"
        render={({ field: { onChange, value } }) => (
          <ToggleSwitch
            className="ml-3"
            value={value}
            onChange={(val) => {
              onChange(val);
              setNeverExpire(val);
            }}
            size="sm"
          />
        )}
      />
    </div>
  </>
);

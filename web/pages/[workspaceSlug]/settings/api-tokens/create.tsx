import { Menu, Transition } from "@headlessui/react";
import { Button, Input, TextArea, ToggleSwitch } from "@plane/ui";
import { WorkspaceSettingHeader } from "components/headers";
import { PrimaryButton } from "components/ui";
import { AppLayout } from "layouts/app-layout/layout";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { Copy } from "lucide-react";
import { NextPage } from "next";
import { useState, Fragment } from "react";
import { Controller, useForm } from "react-hook-form";
import { addDays, renderDateFormat } from "helpers/date-time.helper";
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
import { ApiTokenService } from "services/api_token.service";
import { useRouter } from "next/router";
import { IApiToken } from "types/api_token";

const expiryOptions = [
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

const apiTokenService = new ApiTokenService();
const CreateApiToken: NextPage = () => {
  const [neverExpires, setNeverExpire] = useState<boolean>(false);
  const [focusTitle, setFocusTitle] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [focusDescription, setFocusDescription] = useState<boolean>(false);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(1);
  const { setToastAlert } = useToast();
  const { theme: themStore } = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      never_expires: false,
      title: "",
      description: "",
    },
  });
  const getExpiryDate = (): string | null => {
    if (neverExpires === true) return null;
    return addDays({ date: new Date(), days: expiryOptions[selectedExpiry].days }).toISOString();
  };
  const generateToken = async (data: any) => {
    if (!workspaceSlug) return;
    setLoading(true);
    await apiTokenService
      .createApiToken(workspaceSlug.toString(), {
        label: data.title,
        description: data.description,
        expired_at: getExpiryDate(),
      })
      .then((res) => {
        setGeneratedToken(res);
        setLoading(false);
      })
      .catch((err) => {
        setToastAlert({
          message: err.message,
          type: "error",
          title: "Error",
        });
      });
  };
  function renderExpiry(): string {
    return renderDateFormat(addDays({ date: new Date(), days: expiryOptions[selectedExpiry].days }), true);
  }

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Api Tokens" />}>
      <WorkspaceSettingLayout>
        <form
          onSubmit={handleSubmit(generateToken, (err) => {
            if (err.title) {
              setFocusTitle(true);
            }
          })}
          className={`${themStore.sidebarCollapsed ? "xl:w-[50%] lg:w-[60%] " : "w-[60%]"} mx-auto py-8`}
        >
          <div className="border-b border-custom-border-200 pb-4">
            <Controller
              control={control}
              name="title"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) =>
                focusTitle ? (
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    inputSize="md"
                    onBlur={() => {
                      setFocusTitle(false);
                    }}
                    onError={() => {
                      console.log("error");
                    }}
                    autoFocus={true}
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.title)}
                    placeholder="Title"
                    className="resize-none text-xl w-full"
                  />
                ) : (
                  <p
                    onClick={() => {
                      if (generatedToken != null) return;
                      setFocusDescription(false);
                      setFocusTitle(true);
                    }}
                    className={`${value.length === 0 ? "text-custom-text-400/60" : ""} font-medium text-[24px]`}
                  >
                    {value.length != 0 ? value : "Api Title"}
                  </p>
                )
              }
            />
            {errors.title && focusTitle && <p className=" text-red-600">{errors.title.message}</p>}
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) =>
                focusDescription ? (
                  <TextArea
                    id="description"
                    name="description"
                    autoFocus={true}
                    onBlur={() => {
                      setFocusDescription(false);
                    }}
                    value={value}
                    defaultValue={value}
                    onChange={onChange}
                    placeholder="Description"
                    className="mt-3"
                    rows={3}
                  />
                ) : (
                  <p
                    onClick={() => {
                      if (generatedToken != null) return;
                      setFocusTitle(false);
                      setFocusDescription(true);
                    }}
                    className={`${
                      value.length === 0 ? "text-custom-text-400/60" : "text-custom-text-300"
                    } text-lg pt-3`}
                  >
                    {value.length != 0 ? value : "Description"}
                  </p>
                )
              }
            />
          </div>

          {!generatedToken && (
            <div className="mt-12">
              <Menu>
                <p className="text-sm font-medium mb-2"> Expiration Date</p>
                <Menu.Button className={"w-[40%]"} disabled={neverExpires}>
                  <div className="py-3 w-full font-medium px-3 flex border border-custom-border-200 rounded-md justify-center items-baseline">
                    <p className={`text-base ${neverExpires ? "text-custom-text-400/40" : ""}`}>
                      {expiryOptions[selectedExpiry].title.toLocaleLowerCase()}
                    </p>
                    <p className={`text-sm mr-auto ml-2 text-custom-text-400${neverExpires ? "/40" : ""}`}>
                      ({renderExpiry()})
                    </p>
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

              {!generatedToken && (
                <PrimaryButton type="submit">{loading ? "generating..." : "Add Api key"}</PrimaryButton>
              )}
            </div>
          )}
          {generatedToken && (
            <div className={`mt-${generatedToken ? "8" : "16"}`}>
              <p className="font-medium text-base pb-2">Api key created successfully</p>
              <p className="text-sm pb-4 w-[80%] text-custom-text-400/60">
                Save this API key somewhere safe. You will not be able to view it again once you close this page or
                reload this page.
              </p>
              <Button variant="neutral-primary" className="py-3 w-[85%] flex justify-between items-center">
                <p className="font-medium text-base">{generatedToken.token}</p>

                <Copy
                  size={18}
                  color="#B9B9B9"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken.token);
                    setToastAlert({
                      message: "The Secret key has been successfully copied to your clipboard",
                      type: "success",
                      title: "Copied to clipboard",
                    });
                  }}
                />
              </Button>
              <p className="mt-2 text-sm text-custom-text-400/60">
                {generatedToken.expired_at ? "Expires on " + renderExpiry() : "Never Expires"}
              </p>
              <button className="border py-3 px-5 text-custom-primary-100 text-sm mt-8 rounded-md border-custom-primary-100 w-fit font-medium">
                Revoke
              </button>
            </div>
          )}
        </form>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default observer(CreateApiToken);

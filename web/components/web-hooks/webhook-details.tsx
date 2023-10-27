import React, { useState } from "react";
import { Button, ToggleSwitch } from "@plane/ui";
import { RefreshCw } from "lucide-react";

export const WebhookDetails = () => {
  const [isIndividualEventsSelected, setIndividualEventsSelected] = useState<boolean>(false);
  const [isWebhookEnabled, setWebhookEnabled] = useState<boolean>(false);
  const [isRegenarateKeyLoading, setRegenarateKeyLoading] = useState<boolean>(false);
  const [showGenaratedKey, setShowGenaratedKey] = useState<boolean>(true);
  return (
    <>
      <div className="px-32 pt-10">
        <h3 className="font-medium text-2xl">Webhook Name</h3>
        <p className="font-normal text-base my-1 text-neutral-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex.
        </p>
        <div className="border-b my-6 border-custom-border-200 " />
        <h4 className="font-medium text-sm">URL</h4>
        <input
          type="url"
          placeholder="Enter URL"
          className="border h-10 border-neutral-200 py-1 px-2 w-full rounded-s text-sm mt-2"
        />
        {/* WebHook toggle */}
        <div className="flex gap-6 mt-6">
          <h4 className="text-sm"> Enable webhook</h4>
          <ToggleSwitch value={isWebhookEnabled} onChange={(value) => setWebhookEnabled(value)} />
        </div>
        <h4 className="mt-8 text-sm font-medium">Which event do you like to trigger this webhook</h4>

        {/* Radio */}
        <input
          type="radio"
          name="whatToSend"
          value="everything"
          defaultChecked={true}
          className="w-3.5 mt-4"
          onChange={(value) => setIndividualEventsSelected(value.target.value == "individual")}
        />

        <label className="text-xs"> Send everything </label>
        <br />
        <input
          type="radio"
          name="whatToSend"
          value="individual"
          defaultChecked={false}
          onChange={(value) => setIndividualEventsSelected(value.target.value == "individual")}
          className="w-3.5 mt-5 mb-2"
        />
        <label className="text-xs"> Select Individual events </label>

        {/* Grid */}
        {isIndividualEventsSelected && (
          <div className="bg-custom-background-80 rounded-md grid grid-cols-2 p-7 gap-2 max-w-md mt-6 ">
            <div>
              <input type="checkbox" name="selectIndividualEvents" /> <label htmlFor="1"> Project </label>{" "}
            </div>
            <div>
              <input type="checkbox" name="selectIndividualEvents" /> <label htmlFor="2"> Cycle </label>{" "}
            </div>
            <div>
              <input type="checkbox" name="selectIndividualEvents" /> <label htmlFor="3"> Issues </label>
            </div>
            <div>
              <input type="checkbox" name="selectIndividualEvents" /> <label htmlFor="4"> Modules </label>
            </div>
            <div>
              <input type="checkbox" name="selectIndividualEvents" /> <label htmlFor="5"> IssueComment </label>
            </div>
          </div>
        )}
        <h4 className="text-sm font-medium mt-3.5"> Secret Key </h4>
        <p className="text-sm text-neutral-400 mt-2.5"> Genarate a token to sign-in the webhook payload </p>
      </div>
      <div className="pl-32 ">
        {showGenaratedKey && (
          <div className="flex gap-5">
            <div className="h-10 w-full border rounded-md shadow-sm mt-3.5">
              <div className="flex justify-between items-center h-full">
                <div className="border-dotted w-[60%] h-0 border-t-8 ml-4 border-neutral-300 "></div>
                <div className="flex justify-end space-x-2 mr-2">
                  <img className="h-5 w-5" src="" />
                  <img className="h-5 w-5" src="" />
                </div>
              </div>
            </div>
            <Button className="mt-2.5 ">
              <RefreshCw className={`h-3 w-3 ${isRegenarateKeyLoading ? "animate-spin" : ""}`} />
              Re-genarate Key
            </Button>
          </div>
        )}
        <Button className="mt-2.5"> Genarate Key </Button>
      </div>
    </>
  );
};

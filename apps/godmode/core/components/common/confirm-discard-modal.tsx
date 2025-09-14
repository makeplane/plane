"use client";

import React from "react";
import { Link } from "react-router";
// headless ui
import { Dialog } from "@plane/propel/dialog";
// ui
import { Button, getButtonStyling } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscardHref: string;
};

export const ConfirmDiscardModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, onDiscardHref } = props;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-32">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[30rem]">
            <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-300">
                    You have unsaved changes
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-custom-text-400">
                      Changes you made will be lost if you go back. Do you wish to go back?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center p-4 sm:px-6 gap-2">
              <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                Keep editing
              </Button>
              <Link to={onDiscardHref} className={getButtonStyling("primary", "sm")}>
                Go back
              </Link>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

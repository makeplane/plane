"use client"
import React, { useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { TApplicationPublishDetails, TUserApplication } from "@plane/types";
import { Button, Input, ModalCore } from "@plane/ui";

// form to publish app

type ApplicationPublishModalProps = {
    isOpen: boolean;
    handleClose: () => void;
    app: TUserApplication;
}

const defaultFormData: TApplicationPublishDetails = {
    description_html: "",
    category: "",
    supported_languages: "",
    contact_email: "",
    privacy_policy_tnc_url: "",
    document_urls: "",
    photo_urls: "",
}

export const ApplicationPublishModal: React.FC<ApplicationPublishModalProps> = observer((props) => {
    const { isOpen, handleClose, app } = props;
    // states
    const [isPublishing, setIsPublishing] = React.useState(false);
    const [publishError, setPublishError] = React.useState<string | null>(null);

    // form
    const {
        watch,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control
    } = useForm<TApplicationPublishDetails>({
        defaultValues: defaultFormData,
    });

    const handleTextChange = (key: keyof TApplicationPublishDetails, value: string) => {
        setValue(key, value, { shouldValidate: true });
    }

    const handleAppPublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPublishing(true);
        try {
        } catch (error) {
            setPublishError(error instanceof Error ? error.message : "Something went wrong. Please try again later.");
        } finally {
            setIsPublishing(false);
        }
    }


    return (
        <ModalCore isOpen={isOpen} handleClose={handleClose}>
            <form onSubmit={handleAppPublish}>
                <div className="space-y-3 p-5 pb-4">
                    <h3 className="text-xl font-medium text-custom-text-200">Publish your integration to Marketplace</h3>
                    <div>
                        <Input
                            id="name"
                            type="text"
                            placeholder="What will you call this app"
                            className="w-full resize-none text-sm"
                            hasError={Boolean(errors.contact_email)}
                            tabIndex={1}
                            {...register("contact_email", { required: "Contact email is required" })}
                            onChange={(e) => handleTextChange("contact_email", e.target.value)}
                        />
                        {errors.contact_email && <p className="text-red-500 text-xs">{errors.contact_email.message}</p>}
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <div className="flex items-center space-x-2">
                        <Button variant="neutral-primary" className="bg-custom-background-100">Cancel</Button>
                        <Button variant="primary">Next</Button>
                    </div>
                </div>
            </form>
        </ModalCore>
    );
});
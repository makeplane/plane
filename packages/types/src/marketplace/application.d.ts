export type TApplication = {
    id: string;
    name: string;
    slug: string;
    short_description: string;
    description_html: string;
    description_stripped?: string;
    logo_asset?: string;
    logo_url?: string;
    company_name: string;
    published_at?: string;
    published_by?: string;
    publish_requested_at?: string;
    client_secret?: string;
    client_id?: string;
    redirect_uris: string;
    allowed_origins: string;
    webhook_url?: string;
    created_at: string;
};


export type TUserApplication = TApplication & {
    is_owned: boolean;
    is_installed: boolean;
}

export type TApplicationOwner = {
    id: string;
    user: string;
    application: string;
    workspace: string;
}

export type TWorkspaceAppInstallation = {
    id: string;
    workspace: string;
    application: string;
    installed_by: string;
    app_bot: string;
    status: string;
}


export type TApplicationPublishDetails = {
    description_html: string;
    category: string;
    supported_languages: string;
    contact_email: string;
    privacy_policy_tnc_url: string;
    document_urls: string;
    photo_urls: string;
}
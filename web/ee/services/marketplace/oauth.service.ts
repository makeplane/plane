// helpers
import { API_BASE_URL  } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export type TConsentParams = {
    client_id: string;
    redirect_uri: string;
    code_challenge?: string;
    code_challenge_method?: string;
    response_type: string;
    scope: string;
    nonce?: string;
    state?: string;
    claims?: string;
};

export class OAuthService extends APIService {
    constructor() {
        super(`${API_BASE_URL}/auth/o`);
    }

    async authorizeApplication(consentParams: TConsentParams, csrf_token: string, additionalParams: Record<string, string> | null = null) {
        // Filter out undefined params
        const filteredParams: Record<string, string> = Object.fromEntries(
            Object.entries(consentParams)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => [key, value])
        );

        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${this.baseURL}/authorize-app/`;

        const element1 = document.createElement("input");
        element1.value = csrf_token;
        element1.name = "csrfmiddlewaretoken";
        element1.type = "hidden";
        form.appendChild(element1);

        const element2 = document.createElement("input");
        element2.value = "Authorize";
        element2.name = "allow";
        element2.type = "hidden";
        form.appendChild(element2);

        Object.entries(filteredParams).forEach(([key, value]) => {
            const element = document.createElement("input");
            element.value = value;
            element.name = key;
            element.type = "hidden";
            form.appendChild(element);
        });

        if (additionalParams) {
          const element = document.createElement("input");
          element.value = new URLSearchParams(additionalParams).toString();
          element.name = "additional_params";
          element.type = "hidden";
          form.appendChild(element);
        }

        document.body.appendChild(form);
        form.submit();
    }

    getAuthorizationUrl(consentParams: TConsentParams) {
        return `${this.baseURL}/authorize-app/?${new URLSearchParams(consentParams).toString()}`;
    }
}

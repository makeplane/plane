#!/bin/bash -e

print_header(){
    clear
    echo "------------------------------------------------"
    echo "Plane Commercial (All-In-One)"
    echo "------------------------------------------------"
    echo ""
    echo "You are required to pass below environment variables to the script"
    echo "    DOMAIN_NAME, DATABASE_URL, REDIS_URL, AMQP_URL"
    echo "    AWS_REGION, AWS_ACCESS_KEY_ID"
    echo "    AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME"
    echo ""
    echo "Other optional environment variables: "
    echo "    SITE_ADDRESS (default: ':80')"
    echo "    INTAKE_EMAIL_DOMAIN (default: intake.<DOMAIN_NAME>)"
    echo "    LISTEN_SMTP_PORT_25 (default: 20025)"
    echo "    LISTEN_SMTP_PORT_465 (default: 20465)"
    echo "    LISTEN_SMTP_PORT_587 (default: 20587)"
    echo "    FILE_SIZE_LIMIT (default: 5242880)"
    echo "    APP_PROTOCOL (http or https)"
    echo "    MACHINE_SIGNATURE (default: random uuid)"
    echo "    SECRET_KEY (default: 60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5)"
    echo "    SILO_HMAC_SECRET_KEY (default: tnbbvj6ATPvze4zaygdujxg4dpk4hqx0WDW)"
    echo "    AES_SECRET_KEY (default: wvRonyo2xksk00E2h0hAbR5pFETQwbBK)"
    echo "    LIVE_SERVER_SECRET_KEY (default: htbqvBJAgpm9bzvf3r4urJer0ENReatceh)"
    echo "    ENABLE_PLANE_AI (default: 0, set to 1 to enable Plane Intelligence)"
    echo "    PLANE_PI_DATABASE_URL (required when ENABLE_PLANE_AI=1)"
    echo ""
    echo ""
}

check_required_env(){
    echo "Checking required environment variables..."
    local keys=("DOMAIN_NAME" "DATABASE_URL" "REDIS_URL" "AMQP_URL" 
                "AWS_REGION" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_S3_BUCKET_NAME")
    
    local missing_keys=()
    # Check if the environment variable is set and not empty
    for key in "${keys[@]}"; do
        if [ -z "${!key}" ]; then
            echo "  ❌  '$key' is not set or is empty"
            missing_keys+=("$key")
        fi
    done

    if [ ${#missing_keys[@]} -gt 0 ]; then
        echo ""
        exit 1
    fi
    # add checkmark
    echo "✅ Required environment variables are available"
    echo ""
}

update_env_value(){
    local key="$1"
    local value="$2"

    # check if the file exists
    if [ ! -f "plane.env" ]; then
        echo "plane.env file not found"
        exit 1
    fi

    # check if the key exists and add it if it doesn't
    if ! grep -q "^$key=.*" plane.env; then
        echo "${key}=${value}" >> plane.env
        return 0
    fi

    # if key and value are not empty, update the value
    if [ -n "$key" ] && [ -n "$value" ]; then
        sed -i "s|^$key=.*|$key=$value|" plane.env
        return 0
    fi

}

check_pre_requisites(){
    check_required_env

    # check if the file exists
    if [ ! -f "plane.env" ]; then
        echo "plane.env file not found"
        exit 1
    fi
    # add a new line to the end of the file
    echo "" >> plane.env
    echo "" >> plane.env
    echo "✅ Pre-requisites checked"
    echo ""
    
}

validate_domain_name() {
    local domain="$1"
    
    # Check if it's an IP address first
    if [[ "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "IP"
        return 0
    fi
    
    # FQDN validation regex
    local fqdn_regex='^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.?$'
    
    if [[ "$domain" =~ $fqdn_regex ]]; then
        # Additional checks
        if [[ ${#domain} -le 253 ]] && [[ ! "$domain" =~ \.\. ]] && [[ ! "$domain" =~ ^- ]] && [[ ! "$domain" =~ -\. ]]; then
            echo "FQDN"
            return 0
        fi
    fi
    
    echo "INVALID"
    return 1
}

update_env_file(){
    echo "Updating environment file..."
    # check if DOMAIN_NAME is valid IP address
    local domain_type=$(validate_domain_name "$DOMAIN_NAME")
    if [ "$domain_type" == "INVALID" ]; then
        echo "DOMAIN_NAME is not a valid FQDN or IP address"
        exit 1
    fi

    local app_protocol=${APP_PROTOCOL:-http}
    
    update_env_value "APP_PROTOCOL" "$app_protocol"
    update_env_value "DOMAIN_NAME" "$DOMAIN_NAME"
    update_env_value "APP_DOMAIN" "$DOMAIN_NAME"
    update_env_value "IS_AIRGAPPED" "${IS_AIRGAPPED:-0}"
    if [ -n "$SITE_ADDRESS" ]; then
        update_env_value "SITE_ADDRESS" "$SITE_ADDRESS"
    else
        update_env_value "SITE_ADDRESS" ":80"
    fi
    update_env_value "WEB_URL" "$app_protocol://$DOMAIN_NAME"
    update_env_value "CORS_ALLOWED_ORIGINS" "http://$DOMAIN_NAME,https://$DOMAIN_NAME"

    if [ "$domain_type" == "FQDN" ]; then
        local default_intake_domain="intake.${DOMAIN_NAME}"
        update_env_value "INTAKE_EMAIL_DOMAIN" "${INTAKE_EMAIL_DOMAIN:-$default_intake_domain}"
    fi

    # check MACHINE_SIGNATURE for length>=24 and alphanumeric with `-` and `_`
    local machine_signature=${MACHINE_SIGNATURE:-}
    if [ ${#machine_signature} -lt 24 ] || [[ ! "$machine_signature" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        machine_signature=$(uuidgen)
    fi
    update_env_value "MACHINE_SIGNATURE" "$machine_signature"

    # update database url
    update_env_value "DATABASE_URL" "$DATABASE_URL"
    update_env_value "REDIS_URL" "$REDIS_URL"
    update_env_value "AMQP_URL" "$AMQP_URL"
    
    # update aws credentials
    update_env_value "AWS_REGION" "$AWS_REGION"
    update_env_value "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
    update_env_value "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
    update_env_value "AWS_S3_BUCKET_NAME" "$AWS_S3_BUCKET_NAME"
    update_env_value "AWS_S3_ENDPOINT_URL" "${AWS_S3_ENDPOINT_URL:-https://s3.${AWS_REGION}.amazonaws.com}"
    update_env_value "USE_MINIO" "${USE_MINIO:-0}"

    # update opensearch settings
    update_env_value "OPENSEARCH_ENABLED" "${OPENSEARCH_ENABLED:-0}"
    update_env_value "OPENSEARCH_URL" "${OPENSEARCH_URL:-}"
    update_env_value "OPENSEARCH_USERNAME" "${OPENSEARCH_USERNAME:-}"
    update_env_value "OPENSEARCH_PASSWORD" "${OPENSEARCH_PASSWORD:-}"
    update_env_value "OPENSEARCH_INDEX_PREFIX" "${OPENSEARCH_INDEX_PREFIX:-}"

    # Optional environment variables
    update_env_value "SECRET_KEY" "${SECRET_KEY:-60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5}"
    update_env_value "FILE_SIZE_LIMIT" "${FILE_SIZE_LIMIT:-5242880}"
    update_env_value "SILO_HMAC_SECRET_KEY" "${SILO_HMAC_SECRET_KEY:-tnbbvj6ATPvze4zaygdujxg4dpk4hqx0WDW}"
    update_env_value "AES_SECRET_KEY" "${AES_SECRET_KEY:-wvRonyo2xksk00E2h0hAbR5pFETQwbBK}"
    update_env_value "LIVE_SERVER_SECRET_KEY" "${LIVE_SERVER_SECRET_KEY:-htbqvBJAgpm9bzvf3r4urJer0ENReatceh}"

    update_env_value "LISTEN_SMTP_PORT_25" "${LISTEN_SMTP_PORT_25:-20025}"
    update_env_value "LISTEN_SMTP_PORT_465" "${LISTEN_SMTP_PORT_465:-20465}"
    update_env_value "LISTEN_SMTP_PORT_587" "${LISTEN_SMTP_PORT_587:-20587}"

    if [ -n "$INTEGRATION_CALLBACK_BASE_URL" ]; then
        update_env_value "INTEGRATION_CALLBACK_BASE_URL" "$INTEGRATION_CALLBACK_BASE_URL"
    fi

    if [ -n "$GITHUB_CLIENT_ID" ]; then
        update_env_value "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
    fi
    if [ -n "$GITHUB_CLIENT_SECRET" ]; then
        update_env_value "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"
    fi
    if [ -n "$GITHUB_APP_NAME" ]; then
        update_env_value "GITHUB_APP_NAME" "$GITHUB_APP_NAME"
    fi
    if [ -n "$GITHUB_APP_ID" ]; then
        update_env_value "GITHUB_APP_ID" "$GITHUB_APP_ID"
    fi
    if [ -n "$GITHUB_PRIVATE_KEY" ]; then
        update_env_value "GITHUB_PRIVATE_KEY" "$GITHUB_PRIVATE_KEY"
    fi
    if [ -n "$SLACK_CLIENT_ID" ]; then
        update_env_value "SLACK_CLIENT_ID" "$SLACK_CLIENT_ID"
    fi
    if [ -n "$GITLAB_CLIENT_ID" ]; then
        update_env_value "GITLAB_CLIENT_ID" "$GITLAB_CLIENT_ID"
    fi
    if [ -n "$GITLAB_CLIENT_SECRET" ]; then
        update_env_value "GITLAB_CLIENT_SECRET" "$GITLAB_CLIENT_SECRET"
    fi

    update_env_value "SMTP_DOMAIN" "${SMTP_DOMAIN:-0.0.0.0}"
    if [ -n "$TLS_CERT_PATH" ]; then
        update_env_value "TLS_CERT_PATH" "$TLS_CERT_PATH"
    fi
    if [ -n "$TLS_PRIV_KEY_PATH" ]; then
        update_env_value "TLS_PRIV_KEY_PATH" "$TLS_PRIV_KEY_PATH"
    fi

    update_env_value "API_KEY_RATE_LIMIT" "${API_KEY_RATE_LIMIT:-60/minute}"

    # Plane AI (PI) environment variables
    if [ "${ENABLE_PLANE_AI:-0}" == "1" ]; then
        update_env_value "ENABLE_PLANE_AI" "1"
        if [ -n "$PLANE_PI_DATABASE_URL" ]; then
            update_env_value "PLANE_PI_DATABASE_URL" "$PLANE_PI_DATABASE_URL"
        fi
        if [ -n "$FOLLOWER_POSTGRES_URI" ]; then
            update_env_value "FOLLOWER_POSTGRES_URI" "$FOLLOWER_POSTGRES_URI"
        fi
        update_env_value "PI_INTERNAL_SECRET" "${PI_INTERNAL_SECRET:-tyfvfqvBJAgpm9bzvf3r4urJer0Ehfdubk}"
        update_env_value "PI_BASE_URL" "$app_protocol://$DOMAIN_NAME/pi"
        update_env_value "PI_BASE_PATH" "${PI_BASE_PATH:-/pi}"
        update_env_value "PLANE_FRONTEND_URL" "$app_protocol://$DOMAIN_NAME"
        update_env_value "PLANE_API_HOST" "$app_protocol://$DOMAIN_NAME"
        update_env_value "PLANE_OAUTH_REDIRECT_URI" "$app_protocol://$DOMAIN_NAME/pi/api/v1/oauth/callback/"

        if [ -n "$OPENAI_API_KEY" ]; then
            update_env_value "OPENAI_API_KEY" "$OPENAI_API_KEY"
        fi
        if [ -n "$OPENAI_BASE_URL" ]; then
            update_env_value "OPENAI_BASE_URL" "$OPENAI_BASE_URL"
        fi
        if [ -n "$CLAUDE_API_KEY" ]; then
            update_env_value "CLAUDE_API_KEY" "$CLAUDE_API_KEY"
        fi
        if [ -n "$CLAUDE_BASE_URL" ]; then
            update_env_value "CLAUDE_BASE_URL" "$CLAUDE_BASE_URL"
        fi
        if [ -n "$GROQ_API_KEY" ]; then
            update_env_value "GROQ_API_KEY" "$GROQ_API_KEY"
        fi
        if [ -n "$GROQ_BASE_URL" ]; then
            update_env_value "GROQ_BASE_URL" "$GROQ_BASE_URL"
        fi
        if [ -n "$COHERE_API_KEY" ]; then
            update_env_value "COHERE_API_KEY" "$COHERE_API_KEY"
        fi
        if [ -n "$COHERE_BASE_URL" ]; then
            update_env_value "COHERE_BASE_URL" "$COHERE_BASE_URL"
        fi
        if [ -n "$CUSTOM_LLM_ENABLED" ]; then
            update_env_value "CUSTOM_LLM_ENABLED" "$CUSTOM_LLM_ENABLED"
        fi
        if [ -n "$CUSTOM_LLM_MODEL_KEY" ]; then
            update_env_value "CUSTOM_LLM_MODEL_KEY" "$CUSTOM_LLM_MODEL_KEY"
        fi
        if [ -n "$CUSTOM_LLM_BASE_URL" ]; then
            update_env_value "CUSTOM_LLM_BASE_URL" "$CUSTOM_LLM_BASE_URL"
        fi
        if [ -n "$CUSTOM_LLM_API_KEY" ]; then
            update_env_value "CUSTOM_LLM_API_KEY" "$CUSTOM_LLM_API_KEY"
        fi
        if [ -n "$CUSTOM_LLM_NAME" ]; then
            update_env_value "CUSTOM_LLM_NAME" "$CUSTOM_LLM_NAME"
        fi
        if [ -n "$CUSTOM_LLM_DESCRIPTION" ]; then
            update_env_value "CUSTOM_LLM_DESCRIPTION" "$CUSTOM_LLM_DESCRIPTION"
        fi
        if [ -n "$CUSTOM_LLM_MAX_TOKENS" ]; then
            update_env_value "CUSTOM_LLM_MAX_TOKENS" "$CUSTOM_LLM_MAX_TOKENS"
        fi
        if [ -n "$EMBEDDING_MODEL" ]; then
            update_env_value "EMBEDDING_MODEL" "$EMBEDDING_MODEL"
        fi
        if [ -n "$EMBEDDING_MODEL_ID" ]; then
            update_env_value "OPENSEARCH_ML_MODEL_ID" "$EMBEDDING_MODEL_ID"
        fi
        if [ -n "$BR_AWS_ACCESS_KEY_ID" ]; then
            update_env_value "BR_AWS_ACCESS_KEY_ID" "$BR_AWS_ACCESS_KEY_ID"
        fi
        if [ -n "$BR_AWS_SECRET_ACCESS_KEY" ]; then
            update_env_value "BR_AWS_SECRET_ACCESS_KEY" "$BR_AWS_SECRET_ACCESS_KEY"
        fi
        if [ -n "$BR_AWS_REGION" ]; then
            update_env_value "BR_AWS_REGION" "$BR_AWS_REGION"
        fi
        if [ -n "$BR_AWS_SESSION_TOKEN" ]; then
            update_env_value "BR_AWS_SESSION_TOKEN" "$BR_AWS_SESSION_TOKEN"
        fi
    fi

    echo "✅ Environment file updated"
    echo ""
}

main(){
    print_header
    check_pre_requisites
    update_env_file

    # Enable Plane AI supervisor programs if ENABLE_PLANE_AI=1
    if [ "${ENABLE_PLANE_AI:-0}" == "1" ]; then
        echo "Enabling Plane AI (PI) services..."
        sed -i '/^\[program:pi-migrator\]/,/^\[/{s/autostart=false/autostart=true/}' /etc/supervisor/conf.d/supervisor.conf
        sed -i '/^\[program:pi-api\]/,/^\[/{s/autostart=false/autostart=true/}' /etc/supervisor/conf.d/supervisor.conf
        sed -i '/^\[program:pi-beat\]/,/^\[/{s/autostart=false/autostart=true/}' /etc/supervisor/conf.d/supervisor.conf
        sed -i '/^\[program:pi-worker\]/,/^\[/{s/autostart=false/autostart=true/}' /etc/supervisor/conf.d/supervisor.conf
        echo "✅ Plane AI services enabled"
        echo ""
    fi

    # load plane.env as exported variables
    set -a
    source plane.env
    set +a

    supervisord -c /etc/supervisor/conf.d/supervisor.conf
}

main "$@"
#!/bin/bash -e

print_header(){
    clear
    echo "------------------------------------------------"
    echo "Plane Community (All-In-One)"
    echo "------------------------------------------------"
    echo ""
    echo "You are required to pass below environment variables to the script"
    echo "    DOMAIN_NAME, DATABASE_URL, REDIS_URL, AMQP_URL"
    echo "    AWS_REGION, AWS_ACCESS_KEY_ID"
    echo "    AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME"
    echo ""
    echo "Other optional environment variables: "
    echo "    SITE_ADDRESS (default: ':80')"
    echo "    FILE_SIZE_LIMIT (default: 5242880)"
    echo "    APP_PROTOCOL (http or https)"
    echo "    SECRET_KEY (default: 60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5)"
    echo "    LIVE_SERVER_SECRET_KEY (default: htbqvBJAgpm9bzvf3r4urJer0ENReatceh)"
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
    if [ -n "$SITE_ADDRESS" ]; then
        update_env_value "SITE_ADDRESS" "$SITE_ADDRESS"
    else
        update_env_value "SITE_ADDRESS" ":80"
    fi
    update_env_value "WEB_URL" "$app_protocol://$DOMAIN_NAME"
    update_env_value "CORS_ALLOWED_ORIGINS" "http://$DOMAIN_NAME,https://$DOMAIN_NAME"

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
    update_env_value "BUCKET_NAME" "$AWS_S3_BUCKET_NAME"
    update_env_value "USE_MINIO" "0"

    # Optional environment variables
    update_env_value "SECRET_KEY" "${SECRET_KEY:-60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5}"
    update_env_value "FILE_SIZE_LIMIT" "${FILE_SIZE_LIMIT:-5242880}"
    update_env_value "LIVE_SERVER_SECRET_KEY" "${LIVE_SERVER_SECRET_KEY:-htbqvBJAgpm9bzvf3r4urJer0ENReatceh}"

    update_env_value "API_KEY_RATE_LIMIT" "${API_KEY_RATE_LIMIT:-60/minute}"

    echo "✅ Environment file updated"
    echo ""
}

main(){
    print_header
    check_pre_requisites
    update_env_file

    # load plane.env as exported variables
    export $(grep -v '^#' plane.env | xargs)

    /usr/local/bin/supervisord -c /etc/supervisor/conf.d/supervisor.conf
}

main "$@"
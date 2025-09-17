#!/bin/bash

set -e

DIST_DIR=${DIST_DIR:-./dist}
CPU_ARCH=$(uname -m)
IMAGE_NAME=${IMAGE_NAME:-plane-aio-commercial}


# loop though all flags and set the variables
for arg in "$@"; do
    case $arg in
        --release)
            APP_RELEASE_VERSION="$2"
            shift
            shift
            ;;
        --release=*)
            APP_RELEASE_VERSION="${arg#*=}"
            shift
            ;;
        --image-name)
            IMAGE_NAME="$2"
            shift
            shift
            ;;
        --image-name=*)
            IMAGE_NAME="${arg#*=}"
            shift
            ;;
    esac
done


if [ -z "$APP_RELEASE_VERSION" ]; then
    echo ""
    echo "Usage: "
    echo "   ./build.sh [flags]"
    echo ""
    echo "Flags:"
    echo "  --release=<APP_RELEASE_VERSION>     required (e.g. v1.14.0)"
    echo ""
    echo "Example: ./build.sh --release=v1.9.2 --platform=linux/amd64"
    exit 1
fi

echo "Downloading images for $APP_RELEASE_VERSION on $BUILD_PLATFORM"
echo ""

# Install yq if not present
if ! command -v yq &> /dev/null; then
    echo "Installing yq..."
    sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${CPU_ARCH}
    sudo chmod +x /usr/local/bin/yq
fi

cd $(dirname $0)

string_replace(){
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|$search|$replace|g" "$file"
    else
        sed -i "s|$search|$replace|g" "$file"
    fi
}
remove_line(){
    local file="$1"
    local line="$2"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/'$line'/d' "$file"
    else
        sed -i '/'$line'/d' "$file"
    fi
}

update_env_file(){
    local file="$1"
    local key="$2"
    local value="$3"

    # if key is in file, replace it
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|^'$key'=.*|'$key'='$value'|' "$file"
    else
        sed -i 's|^'$key'=.*|'$key'='$value'|' "$file"
    fi

    # if key not in file, add it
    if ! grep -q "^$key=" "$file"; then
        echo "$key=$value" >> "$file"
    fi
}

build_dist_files(){
    cp ./variables.env $DIST_DIR/plane.env
    cp ../../../apps/proxy/Caddyfile.ee $DIST_DIR/Caddyfile

    echo "" >> $DIST_DIR/plane.env
    echo "" >> $DIST_DIR/plane.env

    # update the plane.env file with the APP_RELEASE_VERSION
    update_env_file $DIST_DIR/plane.env "APP_RELEASE_VERSION" "$APP_RELEASE_VERSION"
    update_env_file $DIST_DIR/plane.env "APP_VERSION" "$APP_RELEASE_VERSION"
    update_env_file $DIST_DIR/plane.env "DEPLOY_PLATFORM" "docker_compose"
    
    update_env_file $DIST_DIR/plane.env "FEATURE_FLAG_SERVER_BASE_URL" "http://localhost:3007"
    update_env_file $DIST_DIR/plane.env "PAYMENT_SERVER_BASE_URL" "http://localhost:3007"
    update_env_file $DIST_DIR/plane.env "API_BASE_URL" "http://localhost:3004"
    update_env_file $DIST_DIR/plane.env "API_HOSTNAME" "http://localhost:3004"
    update_env_file $DIST_DIR/plane.env "SITE_ADDRESS" ":80"

    update_env_file $DIST_DIR/plane.env "LISTEN_SMTP_PORT_25" "20025"
    update_env_file $DIST_DIR/plane.env "LISTEN_SMTP_PORT_465" "20465"
    update_env_file $DIST_DIR/plane.env "LISTEN_SMTP_PORT_587" "20587"

    # remove this line containing `plane-minio:9000`
    string_replace $DIST_DIR/Caddyfile "plane-minio:9000" ""

    # in caddyfile, update `reverse_proxy /spaces/* space:3000` to `reverse_proxy /spaces/* space:3002` 
    string_replace $DIST_DIR/Caddyfile "web:3000" "localhost:3001"
    string_replace $DIST_DIR/Caddyfile "space:3000" "localhost:3002"
    string_replace $DIST_DIR/Caddyfile "admin:3000" "localhost:3003"
    string_replace $DIST_DIR/Caddyfile "api:8000" "localhost:3004"
    string_replace $DIST_DIR/Caddyfile "live:3000" "localhost:3005"
    string_replace $DIST_DIR/Caddyfile "silo:3000" "localhost:3006"
    # replace `:10025 {` with `:20025 {`
    string_replace $DIST_DIR/Caddyfile ":10025 {" ":{\$LISTEN_SMTP_PORT_25} {"
    string_replace $DIST_DIR/Caddyfile ":10465 {" ":{\$LISTEN_SMTP_PORT_465} {"
    string_replace $DIST_DIR/Caddyfile ":10587 {" ":{\$LISTEN_SMTP_PORT_587} {"
    
    # remove line with {$BUCKET_NAME} and {$BUCKET_NAME}/*
    remove_line $DIST_DIR/Caddyfile "BUCKET_NAME"

    # print docker build command
    echo "------------------------------------------------"
    echo ""
    echo "docker build -t $IMAGE_NAME \\"
    echo "  -f $(pwd)/Dockerfile \\"
    echo "  --build-arg PLANE_VERSION=$APP_RELEASE_VERSION \\"
    echo "  $(pwd)"
    echo ""
    echo "------------------------------------------------"
}


main(){
    # check if the dist directory exists
    if [ -d "$DIST_DIR" ]; then
        echo "Removing existing dist directory..."
        rm -rf $DIST_DIR
    fi
    echo "Creating dist directory..."
    mkdir -p $DIST_DIR

    build_dist_files
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build docker image"
        exit 1
    fi

    echo "All images downloaded and content copied successfully!"
}

main "$@"


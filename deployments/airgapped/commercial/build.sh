#!/bin/bash

set -e

BUILD_PLATFORM=${BUILD_PLATFORM:-linux/amd64}

# loop though all flags and set the variables
for arg in "$@"; do
    case $arg in
        --platform)
            BUILD_PLATFORM="$2"
            shift
            shift
            ;;
        --platform=*)
            BUILD_PLATFORM="${arg#*=}"
            shift
            ;;
        --release)
            APP_RELEASE_VERSION="$2"
            shift
            shift
            ;;
        --release=*)
            APP_RELEASE_VERSION="${arg#*=}"
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
    echo "  --release=<APP_RELEASE_VERSION>     required (e.g. v1.10.0)"
    echo "  --platform=<BUILD_PLATFORM>         optional (default: linux/amd64)"
    echo ""
    echo "Example: ./build.sh --release=v1.9.2 --platform=linux/amd64"
    exit 1
fi

echo "Building airgapped artifacts for $APP_RELEASE_VERSION on $BUILD_PLATFORM"

# Install yq if not present
if ! command -v yq &> /dev/null; then
    echo "Installing yq..."
    sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
    sudo chmod +x /usr/local/bin/yq
fi


# Ensure we're in the correct directory
cd $(dirname $0)

rm -rf dist
mkdir -p dist

# Copy variables.env and docker-compose.yml out of cli-install
cp ../../portainer/commercial/portainer-compose.yml ./dist/docker-compose.yml
cp ../../cli/commercial/variables.env ./dist/plane.env
cp ./install.sh ./dist/install.sh
cp ./README.md ./dist/README.md

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's@APP_RELEASE_VERSION=.*@APP_RELEASE_VERSION='${APP_RELEASE_VERSION}'@' ./dist/plane.env
    sed -i '' 's@${APP_RELEASE_VERSION.*@'${APP_RELEASE_VERSION}'@' ./dist/docker-compose.yml
else
    sed -i 's@APP_RELEASE_VERSION=.*@APP_RELEASE_VERSION='${APP_RELEASE_VERSION}'@' ./dist/plane.env
    sed -i 's@${APP_RELEASE_VERSION.*@'${APP_RELEASE_VERSION}'@' ./dist/docker-compose.yml
fi

cd dist


# LOAD ENV 
source plane.env

cp docker-compose.yml new-docker-compose.yml

# insert "name: Plane-airgapped" in the first line of docker-compose.yml using yq
yq -i '. = {"name": "plane-airgapped"} + .' "new-docker-compose.yml"

# add new env "IS_AIRGAPPED=1" to docker-compose.yml in x-monitor-env and x-proxy-env
yq -i '."x-monitor-env"."IS_AIRGAPPED" = "1"' "new-docker-compose.yml"
yq -i '."x-app-env"."IS_AIRGAPPED" = "1"' "new-docker-compose.yml"
yq -i '."x-plane"."APP_VERSION" = "'${APP_RELEASE_VERSION}'"' "new-docker-compose.yml"

# get all services from docker-compose.yml
services=$(yq '.services | keys | .[]' "docker-compose.yml")
services=($services)
# loop through services and add platform=$BUILD_PLATFORM to the service
for service in "${services[@]}"; do
    yq '.services.'$service'.platform = "'$BUILD_PLATFORM'"' -i "new-docker-compose.yml"

    # if $service == monitor, add command: ["prime-monitor", "start-airgapped"]
    if [ "$service" == "monitor" ]; then
        yq '.services.'$service'.command = ["prime-monitor", "start-airgapped"]' -i "new-docker-compose.yml"
    fi

    # Check if service has volumes defined
    has_volumes=$(yq '.services.'\"$service\"'.volumes != null' "docker-compose.yml")
    
    if [ "$has_volumes" == "true" ]; then
        # Get the number of volumes for this service
        volume_count=$(yq '.services.'\"$service\"'.volumes | length' "docker-compose.yml")
        
        # Reset volumes array in the new file to avoid mix-ups
        yq -i '.services.'\"$service\"'.volumes = []' "new-docker-compose.yml"
        
        # Process each volume
        for (( i=0; i<$volume_count; i++ )); do
            # Get the volume definition at this index
            volume_def=$(yq '.services.'\"$service\"'.volumes['$i']' "docker-compose.yml")
            
            # Check if it's a volume:path mapping or just a path
            if [[ "$volume_def" == *":"* ]]; then
                # It's a volume:path mapping, extract the parts
                volume_name=${volume_def%%:*}
                container_path=${volume_def#*:}
                # Determine the host path based on volume name
                if [[ "$volume_name" == *"_logs" ]]; then
                    service_name=${volume_name%_logs}
                    host_path="./logs/$service_name"
                else
                    host_path="./data/$volume_name"
                fi
                # Add the new mapping to the service
                new_mapping="$host_path:$container_path"
                yq -i '.services.'\"$service\"'.volumes += ["'"$new_mapping"'"]' "new-docker-compose.yml"
            else
                # It's something else, keep it as is
                yq -i '.services.'\"$service\"'.volumes += ["'"$volume_def"'"]' "new-docker-compose.yml"
            fi
        done
    fi
done

# Remove the global volumes section as it's no longer needed
yq -i 'del(.volumes)' "new-docker-compose.yml"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/!!merge //g' "new-docker-compose.yml"
else
    sed -i 's/!!merge //g' "new-docker-compose.yml"
fi

mv new-docker-compose.yml docker-compose.yml

images=$(docker compose --env-file plane.env config | grep image: | awk '{print $2}' | uniq | xargs | tr ' ' '\n' | sort -u | tr '\n' ' ')

# if crane does not exists, print a warning
if !command -v crane &> /dev/null; then
    echo "****************************************************"
    echo "Install \"crane\" to speed up image pulling and saving"
    echo "****************************************************"
fi


# loop through images and save them to a tarball
for image in $images; do
    # get the last part of the image name after the last "/"
    img_name=$(echo $image | awk -F'/' '{print $NF}')
    # remove trailing ":" from image
    img_name=$(echo $img_name | sed 's/:/-/g')
    tarfile="./${img_name}.tar"
   
    # if crane exists
    if command -v crane &> /dev/null; then
        echo "Pulling and Saving $image"
        crane pull --platform "$BUILD_PLATFORM" $image $tarfile
        if [ $? -ne 0 ]; then
            echo "Failed to pull $image"
            exit 1
        fi
        echo "Image saved to $tarfile"
    else
        echo "Pulling $image"
        docker pull -q --platform "$BUILD_PLATFORM" $image > /dev/null
        if [ $? -ne 0 ]; then
            echo "Failed to pull $image"
            exit 1
        fi
        echo "Saving $image"
        docker save -o $tarfile $image
        echo "Image saved to $tarfile"
        echo "Removing $image"
        docker rmi $image > /dev/null 2>&1 || true
    fi
done

echo "Images pulled successfully"


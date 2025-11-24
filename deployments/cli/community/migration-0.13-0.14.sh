#!/bin/bash

echo '
******************************************************************

This script is solely for the migration purpose only. 
This is a 1 time migration of volume data from v0.13.2 => v0.14.x

Assumption: 
1. Postgres data volume name ends with _pgdata
2. Minio data volume name ends with _uploads
3. Redis data volume name ends with _redisdata

Any changes to this script can break the migration. 

Before you proceed, make sure you run the below command
to know the docker volumes

docker volume ls -q | grep -i "_pgdata"
docker volume ls -q | grep -i "_uploads"
docker volume ls -q | grep -i "_redisdata"

*******************************************************
'

DOWNLOAD_FOL=./download
rm -rf ${DOWNLOAD_FOL}
mkdir -p ${DOWNLOAD_FOL}

function volumeExists {
  if [ "$(docker volume ls -f name=$1 | awk '{print $NF}' | grep -E '^'$1'$')" ]; then
    return 0
  else
    return 1
  fi
}

function readPrefixes(){
    echo ''
    echo 'Given below list of REDIS volumes, identify the prefix of source and destination volumes leaving "_redisdata" '
    echo '---------------------'
    docker volume ls -q | grep -i "_redisdata"
    echo ''
    
    read -p "Provide the Source Volume Prefix : " SRC_VOL_PREFIX
    until [ "$SRC_VOL_PREFIX"  ]; do
        read -p "Provide the Source Volume Prefix : " SRC_VOL_PREFIX
    done

    read -p "Provide the Destination Volume Prefix : " DEST_VOL_PREFIX
    until [ "$DEST_VOL_PREFIX"  ]; do
        read -p "Provide the Source Volume Prefix : " DEST_VOL_PREFIX
    done

    echo ''
    echo 'Prefix Provided '
    echo "  Source : ${SRC_VOL_PREFIX}"
    echo "  Destination : ${DEST_VOL_PREFIX}"
    echo '---------------------------------------'
}

function migrate(){

    SRC_VOLUME=${SRC_VOL_PREFIX}_${VOL_NAME_SUFFIX}
    DEST_VOLUME=${DEST_VOL_PREFIX}_${VOL_NAME_SUFFIX}

    if volumeExists $SRC_VOLUME; then
        if volumeExists $DEST_VOLUME; then
            GOOD_TO_GO=1
        else 
            echo "Destination Volume '$DEST_VOLUME' does not exist"
            echo ''
        fi
    else
        echo "Source Volume '$SRC_VOLUME' does not exist"
        echo ''
    fi

    if [ $GOOD_TO_GO = 1 ]; then

        echo "MIGRATING ${VOL_NAME_SUFFIX} FROM ${SRC_VOLUME} => ${DEST_VOLUME}"
    
        TEMP_CONTAINER=$(docker run -d -v $SRC_VOLUME:$CONTAINER_VOL_FOLDER busybox true)
        docker cp -q $TEMP_CONTAINER:$CONTAINER_VOL_FOLDER ${DOWNLOAD_FOL}/${VOL_NAME_SUFFIX}
        docker rm $TEMP_CONTAINER &> /dev/null
        
        TEMP_CONTAINER=$(docker run -d -v $DEST_VOLUME:$CONTAINER_VOL_FOLDER busybox true)
        if [ "$VOL_NAME_SUFFIX" = "pgdata" ]; then
            docker cp -q ${DOWNLOAD_FOL}/${VOL_NAME_SUFFIX} $TEMP_CONTAINER:$CONTAINER_VOL_FOLDER/_temp
            docker run --rm -v $DEST_VOLUME:$CONTAINER_VOL_FOLDER \
                    -e DATA_FOLDER="${CONTAINER_VOL_FOLDER}" \
                    busybox /bin/sh -c 'cp -Rf $DATA_FOLDER/_temp/* $DATA_FOLDER '
        else
            docker cp -q ${DOWNLOAD_FOL}/${VOL_NAME_SUFFIX} $TEMP_CONTAINER:$CONTAINER_VOL_FOLDER   
        fi
        docker rm $TEMP_CONTAINER &> /dev/null

        echo ''
    fi
}

readPrefixes

# MIGRATE DB
CONTAINER_VOL_FOLDER=/var/lib/postgresql/data
VOL_NAME_SUFFIX=pgdata
migrate

# MIGRATE REDIS
CONTAINER_VOL_FOLDER=/data
VOL_NAME_SUFFIX=redisdata
migrate

# MIGRATE MINIO
CONTAINER_VOL_FOLDER=/export
VOL_NAME_SUFFIX=uploads
migrate


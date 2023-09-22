#!/bin/bash

AWS_ACCESS_KEY_ID=$1
AWS_SECRET_ACCESS_KEY=$2
AWS_S3_BUCKET_NAME=$3

/usr/bin/mc config host add plane-minio http://plane-minio:9000 $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY; 

/usr/bin/mc mb $AWS_S3_BUCKET_NAME; 
/usr/bin/mc anonymous set download $AWS_S3_BUCKET_NAME;

# Create the policy JSON file
cat <<EOF > policy.json
{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "s3:ListBucket"
        ],
        "Effect": "Deny",
        "Resource": [
          "arn:aws:s3:::uploads/*"
        ]
      },
      {
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Effect": "Allow",
        "Resource": [
          "arn:aws:s3:::uploads/*"
        ]
      }
    ]
}
EOF

# Create and apply the policy
/usr/bin/mc admin policy create plane-minio blocking-file-listing policy.json
# /usr/bin/mc admin policy attach plane-minio read-only-policy user

/usr/bin/mc admin service restart plane-minio

exit 0;

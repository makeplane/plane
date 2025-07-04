# Plane Instance Setup Instructions

Thank you for launching a Plane instance! Please follow these steps to ensure proper setup:

## Important: Wait for Initialization

Your Plane instance needs time to initialize after launch. The cloud-init process typically takes 3-5 minutes to complete.

## How to check setup status

### Option 1: SSH into the instance
Once you can SSH into the instance, you'll see the setup status in the welcome message:

```
$ ssh -i your_key.pem ubuntu@your-instance-ip
...
✅ PLANE SETUP IS COMPLETE
You can access Plane at: http://10.0.0.1
Setup completed: Sun May 18 12:34:56 UTC 2025
```

You can also check the detailed setup logs:
```
$ sudo cat /var/log/plane-setup.log
```

### Option 2: Check instance tags (if using AWS CLI)
```
$ aws ec2 describe-tags --filters "Name=resource-id,Values=i-0123456789abcdef0" "Name=key,Values=PlaneStatus"
```

### Option 3: Check EC2 Instance Connect console
You can connect to your instance through the AWS console and check the welcome message that appears.

## Accessing Plane after setup

Once initialization is complete:
- Access Plane at: `http://<your-instance-public-ip>`
- If you configured a custom domain, access Plane at: `http://<your-custom-domain>`

## Troubleshooting

If you encounter issues during setup:
1. Ensure your security groups allow traffic on ports 80 (HTTP) and 22 (SSH)
2. Wait at least 5 minutes for cloud-init to complete
3. Check the setup logs as described above

For additional support, please visit our documentation at https://docs.plane.so/ or contact support at support@plane.so.

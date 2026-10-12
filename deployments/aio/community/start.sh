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
    echo "    SECRET_KEY (generated on first boot and stored in /app/data if not set)"
    echo "    LIVE_SERVER_SECRET_KEY (generated on first boot and stored in /app/data if not set)"
    echo ""
    echo "Mount /app/data as a named volume or bind mount so generated secrets"
    echo "survive container recreation."
    echo ""
    echo ""
}

# Persisted secrets live outside the image so they survive container recreation.
SECRETS_PERSIST_FILE="${SECRETS_PERSIST_FILE:-/app/data/.secrets.env}"
OLD_DEFAULT_SECRET_KEY="60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5"
SECRET_PLACEHOLDER="change-this-key-on-deployment"
SECRET_PROBE_ATTEMPTS="${SECRET_PROBE_ATTEMPTS:-10}"
SECRET_PROBE_DELAY="${SECRET_PROBE_DELAY:-3}"

# Exit codes: 0 nothing encrypted, 10 old default decrypts, 11 none decrypt,
# 2 cannot connect, 3 any other failure. Mirrors plane/license/utils/encryption.py.
read -r -d '' SECRET_PROBE_PY <<'PYEOF' || true
import base64, hashlib, os, sys
try:
    import psycopg
    from cryptography.fernet import Fernet
except Exception as exc:
    print("cannot load psycopg/cryptography: %r" % (exc,), file=sys.stderr)
    sys.exit(3)
try:
    conn = psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=10)
except psycopg.OperationalError as exc:
    print("database connection failed: %s" % (exc,), file=sys.stderr)
    sys.exit(2)
except Exception as exc:
    print("database connection error: %r" % (exc,), file=sys.stderr)
    sys.exit(3)
try:
    with conn, conn.cursor() as cur:
        cur.execute("SELECT to_regclass('instance_configurations')")
        if cur.fetchone()[0] is None:
            sys.exit(0)
        cur.execute(
            "SELECT value FROM instance_configurations "
            "WHERE is_encrypted AND value IS NOT NULL AND value <> ''"
        )
        rows = [r[0] for r in cur.fetchall()]
    if not rows:
        sys.exit(0)
    dk = hashlib.pbkdf2_hmac("sha256", os.environ["PROBE_OLD_KEY"].encode(), b"salt", 100000)
    cipher = Fernet(base64.urlsafe_b64encode(dk))
    for value in rows:
        try:
            cipher.decrypt(value.encode())
            sys.exit(10)
        except Exception:
            pass
    sys.exit(11)
except SystemExit:
    raise
except Exception as exc:
    print("probe failed: %r" % (exc,), file=sys.stderr)
    sys.exit(3)
PYEOF

probe_database_for_encrypted_settings(){
    local attempt=1 rc=0
    while :; do
        rc=0
        DATABASE_URL="$DATABASE_URL" PROBE_OLD_KEY="$OLD_DEFAULT_SECRET_KEY" \
            python3 -c "$SECRET_PROBE_PY" || rc=$?
        [ "$rc" -ne 2 ] && return "$rc"
        [ "$attempt" -ge "$SECRET_PROBE_ATTEMPTS" ] && return 2
        echo "  database not reachable yet (attempt $attempt/$SECRET_PROBE_ATTEMPTS), retrying..."
        sleep "$SECRET_PROBE_DELAY"
        attempt=$((attempt + 1))
    done
}

reject_newline(){
    case "$2" in
        *$'\n'*|*$'\r'*)
            echo "❌ $1: the value contains a newline, which cannot be stored. Pass it as a single line." >&2
            return 1 ;;
    esac
}

persisted_value(){
    [ -f "$SECRETS_PERSIST_FILE" ] || return 0
    { grep -m1 "^$1=" "$SECRETS_PERSIST_FILE" || true; } | cut -d'=' -f2-
}

persist_secret(){
    local key="$1" value="$2" src tmp="${SECRETS_PERSIST_FILE}.tmp"
    reject_newline "$key" "$value" || return 1
    mkdir -p "$(dirname "$SECRETS_PERSIST_FILE")" || return 1
    src="$SECRETS_PERSIST_FILE"
    [ -f "$src" ] || src=/dev/null
    ( umask 077; PS_KEY="$key" PS_VAL="$value" awk '
        BEGIN { line = ENVIRON["PS_KEY"] "=" ENVIRON["PS_VAL"] }
        index($0, ENVIRON["PS_KEY"] "=") == 1 { if (!done) print line; done = 1; next }
        { print }
        END { if (!done) print line }' "$src" > "$tmp" ) || {
        echo "❌ Cannot write $SECRETS_PERSIST_FILE; mount a writable volume at /app/data." >&2
        return 1
    }
    chmod 600 "$tmp" && mv "$tmp" "$SECRETS_PERSIST_FILE" && chmod 600 "$SECRETS_PERSIST_FILE"
}

generate_secret(){
    tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c50
}

volume_notice(){
    echo "  ℹ️  Keep /app/data on a named volume or bind mount. If it is lost while the"
    echo "     database is kept, saved instance settings cannot be decrypted."
}

# Sets RESOLVED_SECRET. Precedence: explicit env, persisted file, then the
# caller-provided fallback function (probe/generate) whose result is persisted.
resolve_secret(){
    local key="$1" fallback="$2" explicit persisted
    explicit="${!key:-}"
    [ "$explicit" = "$SECRET_PLACEHOLDER" ] && explicit=""
    persisted=$(persisted_value "$key")
    [ "$persisted" = "$SECRET_PLACEHOLDER" ] && persisted=""

    if [ -n "$explicit" ]; then
        reject_newline "$key" "$explicit" || exit 1
        RESOLVED_SECRET="$explicit"
        echo "  ✅ $key: explicit environment variable"
        if [ "$key" = "SECRET_KEY" ] && [ "$explicit" = "$OLD_DEFAULT_SECRET_KEY" ]; then
            echo "  ⚠️  WARNING: this SECRET_KEY is the previous default and is publicly known."
        fi
        [ -n "$persisted" ] || persist_secret "$key" "$explicit" || exit 1
    elif [ -n "$persisted" ]; then
        RESOLVED_SECRET="$persisted"
        echo "  ✅ $key: persisted at $SECRETS_PERSIST_FILE"
    else
        "$fallback"
        persist_secret "$key" "$RESOLVED_SECRET" || exit 1
    fi
}

fallback_secret_key(){
    local rc=0
    echo "  Checking the database for settings encrypted with an earlier key..."
    probe_database_for_encrypted_settings || rc=$?
    case "$rc" in
        0)
            RESOLVED_SECRET=$(generate_secret)
            echo "  ✅ SECRET_KEY: generated and persisted at $SECRETS_PERSIST_FILE"
            volume_notice ;;
        10)
            RESOLVED_SECRET="$OLD_DEFAULT_SECRET_KEY"
            echo "  ⚠️  WARNING: saved instance settings in this database are encrypted with the"
            echo "     previous default SECRET_KEY, which is publicly known. It is kept (and persisted at"
            echo "     $SECRETS_PERSIST_FILE) so those settings keep working."
            echo "     To rotate deliberately: pass a new SECRET_KEY on every start, then re-enter the"
            echo "     saved email, OAuth, AI and Unsplash settings in the admin app. Users are signed out."
            volume_notice ;;
        11)
            RESOLVED_SECRET=$(generate_secret)
            echo "  ⚠️  WARNING: saved instance settings in this database cannot be decrypted with the"
            echo "     default key, and no earlier key was found. A new SECRET_KEY was generated and"
            echo "     persisted at $SECRETS_PERSIST_FILE. Email, OAuth, AI and Unsplash settings saved"
            echo "     earlier may need to be re-entered in the admin app."
            volume_notice ;;
        2)
            echo "❌ Cannot reach the database to check for existing encrypted settings." >&2
            echo "   Fix DATABASE_URL, or pass the existing key with -e SECRET_KEY=..." >&2
            exit 1 ;;
        *)
            echo "❌ The database check for SECRET_KEY failed (see the error above)." >&2
            echo "   Pass the existing key with -e SECRET_KEY=... to skip this check." >&2
            exit 1 ;;
    esac
}

fallback_live_server_secret_key(){
    RESOLVED_SECRET=$(generate_secret)
    echo "  ✅ LIVE_SERVER_SECRET_KEY: generated and persisted at $SECRETS_PERSIST_FILE"
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

# Writes KEY=<%q-quoted value>; plane.env is sourced. awk with ENVIRON keeps
# `& | \ $` and quotes intact; newlines are rejected.
update_env_value(){
    local key="$1"
    local value="$2"

    # check if the file exists
    if [ ! -f "plane.env" ]; then
        echo "plane.env file not found"
        exit 1
    fi

    reject_newline "$key" "$value" || exit 1

    local line="${key}="
    [ -n "$value" ] && line="${key}=$(printf '%q' "$value")"

    # check if the key exists and add it if it doesn't
    if ! grep -q "^$key=.*" plane.env; then
        printf '%s\n' "$line" >> plane.env
        return 0
    fi

    # if key and value are not empty, update the value
    if [ -n "$key" ] && [ -n "$value" ]; then
        UEV_KEY="$key" UEV_LINE="$line" awk \
            'index($0, ENVIRON["UEV_KEY"] "=") == 1 { print ENVIRON["UEV_LINE"]; next } { print }' \
            plane.env > plane.env.tmp
        mv plane.env.tmp plane.env
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
    resolve_secret "SECRET_KEY" fallback_secret_key
    update_env_value "SECRET_KEY" "$RESOLVED_SECRET"
    update_env_value "FILE_SIZE_LIMIT" "${FILE_SIZE_LIMIT:-5242880}"
    resolve_secret "LIVE_SERVER_SECRET_KEY" fallback_live_server_secret_key
    update_env_value "LIVE_SERVER_SECRET_KEY" "$RESOLVED_SECRET"

    update_env_value "API_KEY_RATE_LIMIT" "${API_KEY_RATE_LIMIT:-60/minute}"

    echo "✅ Environment file updated"
    echo ""
}

main(){
    print_header
    check_pre_requisites
    update_env_file

    # load plane.env as exported variables
    set -a
    # shellcheck disable=SC1091
    . ./plane.env
    set +a

    /usr/local/bin/supervisord -c /etc/supervisor/conf.d/supervisor.conf
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    main "$@"
fi

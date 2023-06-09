#!/bin/sh
FROM=$1
TO=$2

if [ "${FROM}" = "${TO}" ]; then
    echo "Nothing to replace, the value is already set to ${TO}."

    exit 0
fi

# Only peform action if $FROM and $TO are different.
echo "Replacing all statically built instances of $FROM with this string $TO ."

grep -R -la "${FROM}" apps/app/.next | xargs -I{} sed -i "s|$FROM|$TO|g" "{}"

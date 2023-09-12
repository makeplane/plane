#!/bin/sh
FROM=$1
TO=$2
DIRECTORY=$3

if [ "${FROM}" = "${TO}" ]; then
    echo "Nothing to replace, the value is already set to ${TO}."

    exit 0
fi

# Only perform action if $FROM and $TO are different.
echo "Replacing all statically built instances of $FROM with this string $TO ."

grep -R -la "${FROM}" $DIRECTORY/.next | xargs -I{} sed -i "s|$FROM|$TO|g" "{}"

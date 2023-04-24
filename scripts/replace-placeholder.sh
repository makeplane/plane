FROM=$1
TO=$2

if [ "${FROM}" = "${TO}" ]; then
    echo "Nothing to replace, the value is already set to ${TO}."
    exit 0
fi

echo "Replacing all statically built instances of $FROM with $TO."

find apps/app/.next/ apps/app/public -type f |
while read file; do
    sed -i "s|$FROM|$TO|g" "$file"
done
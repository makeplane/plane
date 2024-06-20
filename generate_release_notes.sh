#!/bin/bash

# Initialize temporary files for each category
FEATURES_FILE=$(mktemp)
IMPROVEMENTS_FILE=$(mktemp)
BUGS_FILE=$(mktemp)
OTHERS_FILE=$(mktemp)

FEATURES_COUNT=0
IMPROVEMENTS_COUNT=0
BUGS_COUNT=0
OTHERS_COUNT=0

# Check if there are any tags in the repository
if git describe --tags --abbrev=0 > /dev/null 2>&1; then
  # Fetch all commits from the last tag to HEAD
  COMMITS=$(git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s|%h")
else
  # If no tags are found, list all commits
  COMMITS=$(git log --pretty=format:"%s|%h")
fi

# Save IFS and set it to newline to handle commits correctly
OLD_IFS=$IFS
IFS=$'\n'

# Loop through each commit to categorize
for commit in $COMMITS; do
  IFS="|" read -r commit_message hash <<< "$commit"
  
  # Normalize commit message to handle case sensitivity
  normalized_message=$(echo "$commit_message" | tr '[:upper:]' '[:lower:]')
  
  # Skip commits that start with "merge" or "chore" or do not contain a PR number
  if echo "$normalized_message" | grep -qE '^(merge|chore)'; then
    continue
  fi
  
  # Extract PR number if present
  PR_NUMBER=$(echo $commit_message | grep -o -E "#[0-9]+" || echo "")
  if [[ -z "$PR_NUMBER" ]]; then
    continue  # Skip commits without a PR number
  fi
  
  # Format the commit message
  CLEAN_MESSAGE=$(echo $commit_message | sed -E "s/#[0-9]+//; s/^(feat|refactor|fix|chore): //I; s/^([Ff]eat|[Rr]efactor|[Ff]ix|[Cc]hore) //I; s/^\[.*\] //; s/[:\-] / /; s/\(\) //")
  CLEAN_MESSAGE="$(tr '[:lower:]' '[:upper:]' <<< ${CLEAN_MESSAGE:0:1})${CLEAN_MESSAGE:1}."
  CLEAN_MESSAGE=$(echo $CLEAN_MESSAGE | sed 's/()//g') # Remove empty brackets
  
  # Categorize and limit the number of commits under each heading
  if [[ $FEATURES_COUNT -lt 30 && $normalized_message =~ ^feat ]]; then
    echo "- $CLEAN_MESSAGE $PR_NUMBER" >> "$FEATURES_FILE"
    ((FEATURES_COUNT++))
  elif [[ $IMPROVEMENTS_COUNT -lt 30 && $normalized_message =~ ^refactor ]]; then
    echo "- $CLEAN_MESSAGE $PR_NUMBER" >> "$IMPROVEMENTS_FILE"
    ((IMPROVEMENTS_COUNT++))
  elif [[ $BUGS_COUNT -lt 30 && $normalized_message =~ ^fix ]]; then
    echo "- $CLEAN_MESSAGE $PR_NUMBER" >> "$BUGS_FILE"
    ((BUGS_COUNT++))
  elif [[ $OTHERS_COUNT -lt 30 ]]; then
    echo "- $CLEAN_MESSAGE $PR_NUMBER" >> "$OTHERS_FILE"
    ((OTHERS_COUNT++))
  fi
done

# Restore IFS
IFS=$OLD_IFS

# Generate the release notes by concatenating the temporary files
{
  echo '## What Changed'
  echo "## Features"
  cat "$FEATURES_FILE"
  echo "## Improvements"
  cat "$IMPROVEMENTS_FILE"
  echo "## Bugs"
  cat "$BUGS_FILE"
  echo "## Others"
  cat "$OTHERS_FILE"
} > RELEASE_NOTES.md

# Clean up temporary files
rm "$FEATURES_FILE" "$IMPROVEMENTS_FILE" "$BUGS_FILE" "$OTHERS_FILE"

echo "Release notes generated in RELEASE_NOTES.md"

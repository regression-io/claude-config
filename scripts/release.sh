#!/bin/bash
# Auto-release script: bumps patch version, commits, tags, and pushes
# Usage: ./scripts/release.sh "commit message"
#        ./scripts/release.sh "commit message" --minor
#        ./scripts/release.sh "commit message" --major

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 \"commit message\" [--minor|--major]"
  exit 1
fi

MESSAGE="$1"
BUMP_TYPE="${2:---patch}"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Parse version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump based on type
case "$BUMP_TYPE" in
  --major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  --minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  --patch|*)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
TAG="v$NEW_VERSION"

echo "Releasing $CURRENT_VERSION -> $NEW_VERSION"

# Update version in package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Sync version to other files
npm run version:sync

# Stage all changes
git add -A

# Commit
git commit -m "$MESSAGE

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Tag
git tag "$TAG"

# Push with tags
git push && git push --tags

echo ""
echo "✅ Released $TAG"
echo "   CI will publish to npm automatically"

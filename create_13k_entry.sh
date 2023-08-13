#!/bin/bash


# Remove old submission zip
rm -f submission.zip

# Remove current build dir
rm -rf dist/

# Build with webpack
npm run dist

# Create submission dir
cp -r dist/ submission/


# Perform any post-build steps here
#...

# Create the zip and remove the submission dir
zip -r submission.zip submission/
rm -rf submission/

echo ""
echo "Submission size:"
du -sh submission.zip
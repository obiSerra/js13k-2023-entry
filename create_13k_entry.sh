#!/bin/bash


# Remove old submission zip
rm -f submission.zip

# Remove current build dir
rm -rf dist/


node removeModules.js

# prettier src/index_concat.ts --write --config .prettierrc
echo "Manually fix the file [enter to continue]?"
read varname
cp src/index.ts src/index.ts.bak
cp src/index_concat.ts src/index.ts


# Build with webpack
npm run dist


# Remove temporary files
mv src/index.ts.bak src/index.ts
rm -f index.ts.bak
rm -f index_concat.ts

# Create submission dir
cp -r dist/ submission/


# Perform any post-build steps here
#...

# Create the zip and remove the submission dir
zip -r submission.zip submission/
rm -rf submission/

echo ""
echo "Submission size:"
stat -f%z submission.zip
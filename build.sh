
yarn remove fs-xattr
npx build --linux --x64 --arm64  &
npx build --win 
yarn add fs-xattr
npx build --mac 

git add -A && git commit -m "Update Version"
git push

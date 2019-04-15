
yarn remove fs-xattr
npx build --linux --x64 --arm64  --publish always &
npx build --win  --publish always
yarn add fs-xattr
npx build --mac  --publish always

cd ../
cd Space-Saver
git commit versions.json -m "Update Version"
git push
cd ../
cd Space-Saver-develop



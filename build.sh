
yarn remove fs-xattr
npx build --linux --x64  undefined &
npx build --linux --arm64 undefined &
npx build --win  undefined
yarn add fs-xattr
npx build --mac  undefined

cd ../
cd Space-Saver
git commit versions.json -m "Update Version"
git push
cd ../
cd Space-Saver-develop



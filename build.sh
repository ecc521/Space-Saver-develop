
yarn remove fs-xattr
npx build --linux --x64 --arm64  --publish always &
npx build --win  --publish always
yarn add fs-xattr
npx build --mac  --publish always

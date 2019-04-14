#Linux and Windows don't need this. With electron-forge Linux failed if this is installed.
yarn remove fs-xattr

npx electron-builder --linux --x64 &
npx electron-builder --linux --arm64 &
npx electron-builder --win

yarn add fs-xattr
npx electron-builder --mac

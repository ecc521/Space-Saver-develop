# Space-Saver-develop



Settings should add windows compact compactOS:always thingy.
It is complex to add it elseware, and should be super simple to add.





#If you want to publish, use node build.js publish
node build.js
./build.sh

Platform Specific Builds:
Windows: npx electron-builder --win
Mac: yarn add fs-xattr && npx electron-builder --mac && yarn remove fs-xattr
Linux arm64: npx electron-builder --linux --arm64
Linux x64: npx electron-builder --linux --x64

Note: MacOS Catalina removed 32 bit support. This means that the Windows binary must, as of now, be built on Windows.

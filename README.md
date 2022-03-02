# Space-Saver-develop

TODO

Delete the browser thing. It was a cool thing to build, but isn't actually useful, and doesn't belong here. 

Settings should add windows compact compactOS:always thingy.
It is complex to add it elseware, and should be super simple to add.


Notes: The language pack deleting menu does not show up during development. If you would like it to show up, you will need to delete 2 lines around 97-99 in languagePacks.js

Building:


#If you want to publish, use node build.js publish
node build.js
./build.sh

Platform Specific Builds:
Windows: npx electron-builder --win
Mac: yarn add fs-xattr && npx electron-builder --mac && yarn remove fs-xattr
Linux arm64: npx electron-builder --linux --arm64
Linux x64: npx electron-builder --linux --x64

Note: MacOS Catalina removed 32 bit support. This means that the Windows binary must, as of now, be built on Windows.

# Space-Saver-develop

TODO

Settings should add windows compact compactOS:always thingy.
It is complex to add it elseware, and is super simple to add.








Build for host system:

electron-forge make




Although I wish I could just use: 
electron-forge make --arch=ia32,x64,armv7l,arm64,mips64el all

Electron forge has some bugs with it. The below code should be used instead




Build for all systems and arch (does not build for mac app store):

Run build.sh

OR:

electron-forge make --arch=ia32,x64,armv7l,arm64 --platform=linux --targets=deb
electron-forge make --arch=x64 --platform=darwin --targets=zip,dmg
electron-forge make --arch=ia32,x64,armv7l,arm64 --platform=win32 --targets=squirrel



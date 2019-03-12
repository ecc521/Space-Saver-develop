# Space-Saver-develop

TODO

Settings should add windows compact compactOS:always thingy.
It is complex to add it elseware, and should be super simple to add.



Reason that one image file is a duplicate (64x64)
Correction: This may not be necessary - there was some issues with Linux on the Chromebook I was testing on
https://github.com/electron/electron/issues/6205



Build for host system:

electron-forge make




Although I wish I could just use: 
electron-forge make --arch=ia32,x64,armv7l,arm64,mips64el all

Electron forge has some bugs with it. To build for all systems and architectures (except Mac app store), simply run build.sh

# Space-Saver-develop

TODO

Settings should add windows compact compactOS:always thingy.
It is complex to add it elseware, and should be super simple to add.



Reason that one image file is a duplicate (64x64)
Correction: This may not be necessary - there was some issues with Linux on the Chromebook I was testing on
https://github.com/electron/electron/issues/6205




Building:
Run electron-forge make to build for host system
Run build.sh to build for all supported systems
Unless jpegtran is compiled to WebAssembly and electron-forge fixes some bugs, we won't be able to simply run
electron-forge make --arch=ia32,x64,armv7l,arm64,mips64el all




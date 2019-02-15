
echo "The first linux build will likely error - the second one should succeed"

#For somer reason rpm targets are erroring
electron-forge make --arch=ia32,x64,armv7l,arm64 --platform=linux --targets=deb

cd out

cd Space\ Saver-linux-x64
ln -fs Space\ Saver space-saver
cd ../

cd Space\ Saver-linux-ia32
ln -fs Space\ Saver space-saver
cd ../

cd Space\ Saver-linux-armv7l
ln -fs Space\ Saver space-saver
cd ../

cd Space\ Saver-linux-arm64
ln -fs Space\ Saver space-saver
cd ../


cd ../

electron-forge make --skip-package --arch=ia32,x64,armv7l,arm64 --platform=linux --targets=deb





electron-forge make --arch=x64 --platform=darwin --targets=zip,dmg

#Not working
#electron-forge make --arch=ia32,x64,armv7l,arm64 --platform=win32 --targets=squirrel
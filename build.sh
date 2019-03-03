
#May need to run brew install rpm
#May need to run npm install


#May need to delete package-lock.json (only if it fails first time)



#Didn't see a reason to build zip targets

#rpmbuild is SINGLE THREADED!!! (So it takes forever)
#It is run at high priority so it the other builds don't slow it down


{
electron-forge package --platform=linux --arch=x64

#Bypass issues where name and productName get mixed up
#It looks for an executable named space-saver when the executable is named Space Saver. This creates symbolic links to the actual executable so it works.
cd out
cd Space\ Saver-linux-x64
ln -fs Space\ Saver space-saver
cd ../
cd ../

electron-forge make --skip-package --arch=x64 --platform=linux --targets=deb & 
nice -10 electron-forge make --skip-package --arch=x64 --platform=linux --targets=rpm
}&
{
sleep 0.1
electron-forge package --platform=linux --arch=arm64

#Bypass issues where name and productName get mixed up
#It looks for an executable named space-saver when the executable is named Space Saver. This creates symbolic links to the actual executable so it works.
cd out
cd Space\ Saver-linux-arm64
ln -fs Space\ Saver space-saver
cd ../
cd ../

electron-forge make --skip-package --arch=arm64 --platform=linux --targets=deb & 
nice -10 electron-forge make --skip-package --arch=arm64 --platform=linux --targets=rpm
}&
{
sleep 0.2
electron-forge make --arch=x64 --platform=darwin --targets=dmg
}&
{
sleep 0.3
electron-forge make --arch=x64 --platform=win32 --targets=squirrel
}











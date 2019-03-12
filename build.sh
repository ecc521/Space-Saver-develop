
#May need to run brew install rpm
#May need to run npm install


#May need to delete package-lock.json (only if it fails first time)



#Didn't see a reason to build zip targets

#rpmbuild is SINGLE THREADED!!! (So it takes forever)
#TODO: Run other builds at low priority so they don't slow it down

#Delete the old output directory
rm -rf out
rm space-saver #In case build breaking symlinks get left around as result of failed build

rm -rf /private/var/folders/5m/t7mk0wv57836nwr0zy1jp21r0000gn/T/electron-packager

npm install ./fs-xattr
electron-forge make --arch=x64 --platform=darwin --targets=dmg

#Linux fails if this in installed.
npm uninstall fs-xattr

{
electron-forge package --platform=linux --arch=x64

#Bypass issues where name and productName get mixed up
#It looks for an executable named space-saver when the executable is named Space Saver. This creates symbolic links to the actual executable so it works.
cd out
cd "Space Saver-linux-x64"
ln -fs "Space Saver" "space-saver"
cd ../
cd ../

electron-forge make --skip-package --arch=x64 --platform=linux --targets=deb &
electron-forge make --skip-package --arch=x64 --platform=linux --targets=rpm
}&
{
electron-forge package --platform=linux --arch=arm64

#Bypass issues where name and productName get mixed up
#It looks for an executable named space-saver when the executable is named Space Saver. This creates symbolic links to the actual executable so it works.
cd out
cd "Space Saver-linux-arm64"
ln -fs "Space Saver" "space-saver"
cd ../
cd ../

electron-forge make --skip-package --arch=arm64 --platform=linux --targets=deb &
electron-forge make --skip-package --arch=arm64 --platform=linux --targets=rpm
}&
{
electron-forge make --arch=x64 --platform=win32 --targets=squirrel
}










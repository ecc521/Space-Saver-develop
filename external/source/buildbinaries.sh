THREADS=18 #Threads to build on

#$1 is source directory
#$2 is output directory

cd $1

autoreconf -fiv

cd

rm -rf amd64
rm -rf i686
rm-rf arm64
rm -rf armv7

cp -r $1 amd64
cp -r $1 i686
cp -r $1 arm64
cp -r $1 armv7


cd amd64

#amd64
./configure --host x86_64-apple-darwin NASM=/opt/local/bin/nasm
make -j $THREADS

cp jpegtran "$2/jpegtran-amd64"



cd
cd i686

#i686
./configure --host i686-apple-darwin CFLAGS='-O3 -m32' LDFLAGS=-m32
make -j $THREADS

cp jpegtran "$2/jpegtran-i686"


cd
cd arm64

#ARMv8 (arm64)

IOS_PLATFORMDIR=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform
IOS_SYSROOT=$IOS_PLATFORMDIR/Developer/SDKs/iPhoneOS*.sdk
IOS_GCC=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang
IOS_CFLAGS="-arch arm64"

./configure --host aarch64-apple-darwin

CC="$IOS_GCC" LD="$IOS_GCC" \
CFLAGS="-isysroot $IOS_SYSROOT -O3 $IOS_CFLAGS" \
LDFLAGS="-isysroot $IOS_SYSROOT $IOS_CFLAGS"

make -j $THREADS
cp jpegtran "$2/jpegtran-arm64"


cd
cd armv7

#ARMv7

IOS_PLATFORMDIR=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform
IOS_SYSROOT=$IOS_PLATFORMDIR/Developer/SDKs/iPhoneOS*.sdk
IOS_GCC=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang

IOS_CFLAGS="-arch armv7"

./configure --host arm-apple-darwin10

CC="$IOS_GCC" LD="$IOS_GCC" \
CFLAGS="-mfloat-abi=softfp -isysroot $IOS_SYSROOT -O3 $IOS_CFLAGS" \
LDFLAGS="-mfloat-abi=softfp -isysroot $IOS_SYSROOT $IOS_CFLAGS" \
CCASFLAGS="-no-integrated-as $IOS_CFLAGS"


make -j $THREADS
cp jpegtran "$2/jpegtran-armv7"

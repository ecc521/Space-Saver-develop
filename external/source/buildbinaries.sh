THREADS=18 #Threads to build on

git clone https://github.com/mozilla/mozjpeg.git


cd mozjpeg
autoreconf -fiv
cd

rm -rf amd64
rm -rf i686
rm -rf arm64
rm -rf armv7

cp -r mozjpeg amd64
cp -r mozjpeg i686
cp -r mozjpeg arm64
cp -r mozjpeg armv7


cd amd64

#amd64
./configure --host x86_64-apple-darwin NASM=/opt/local/bin/nasm
make SHARED=0 -j $THREADS




cd
cd i686

#i686
./configure --host i686-apple-darwin CFLAGS='-O3 -m32' LDFLAGS=-m32
make SHARED=0 -j $THREADS



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

make SHARED=0 -j $THREADS


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


make SHARED=0 -j $THREADS

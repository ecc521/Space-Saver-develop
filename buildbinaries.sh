THREADS=18 #Threads to build on
#Currently builds must be run on a mac

#$1 is source directory
#$2 is build directory




cd $1
git clone https://github.com/mozilla/mozjpeg.git
cd

SOURCE="$1/mozjpeg"


#amd64
AMD64_DIR="$2/amd64"

mkdir $AMD64_DIR
cd $AMD64_DIR

cmake $SOURCE
make -j $THREADS




#ARMv8

ARMv8_DIR="$2/armv8"
mkdir $ARMv8_DIR
cd $ARMv8_DIR

IOS_PLATFORMDIR=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform
IOS_SYSROOT=($IOS_PLATFORMDIR/Developer/SDKs/iPhoneOS*.sdk)
export CFLAGS="-Wall -arch arm64 -miphoneos-version-min=7.0 -funwind-tables"

cat <<EOF >toolchain.cmake
set(CMAKE_SYSTEM_NAME Darwin)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_C_COMPILER /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang)
EOF


cmake -G"Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE=toolchain.cmake \
-DCMAKE_OSX_SYSROOT=${IOS_SYSROOT[0]} \
$SOURCE
make -j $THREADS





















#32 bit builds
CFLAGS=-m32
LDFLAGS=-m32

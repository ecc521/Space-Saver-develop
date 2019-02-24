'use strict'


const fs = require("fs")
const path = require("path") //Likely not necessary given this file is macOS only
const { spawn } = require('child_process');


const zlibComressionLevel = 9



//Since APFS (which most mac's should be running on at this point) doesn't use much extra storage for copies
//and merely references them twice, we shouldn't cause a significant number of unnecessary disk writes when files aren't compressed by ditto


//RAMDisks or memory mapped files could be used to make sure the file actually shrunk. This likely doesn't matter because APFS only stores duplicates once on disk.


//ditto has it's own method of deciding if something is compressable. 
//Example: The clang-9 executable is 338.1 MB. ditto does not compress it, but when compressed with zip (build in utility), the size goes down from 338.1 MB to 68.5 MB.

//We may be able to do the compression ourselves, allowing for more control over which files are compressed and how much CPU time we spend on compression. The best information I could find on the compression is below. It was taken from one of the comments on http://hints.macworld.com/article.php?story=20090902223042255

/*
The first thing that I tried to do was figure out the system call used for compression; ditto uses the private framework Bom to compress files. However, looking into it further I found that the Bom framework makes a call to another private framework: AppleFSCompression. Unfortunately the syntax for the functions in AppleFSCompression is far from obvious, especially since it is a private framework which means that there are no included headers for it (and it also means that it will probably remain closed source). It didn't in the end matter however, because I found that zlib is used for the actual compression and that library is well documented. So I decided to simply figure out how the HFS+ compressed files are constructed and added that to my program.
Here's how the HFS+ compression is applied:
1. Check the file to ensure it does not have a resource fork or com.apple.decmpfs extended attribute.
2. Construct the headers, calculate the number of 64 KiB blocks needed based on the source file size.
3. Compress the 64 KiB blocks using zlib (Apple uses compression level 5, but other compression levels also work); if there is only one block then append it to the com.apple.decmpfs extended attribute if the compressed data is 3786 bytes or less in size, otherwise the compressed data is put into the resource fork of the file. If the resource fork is used to store the compressed data, then no block is allowed to be larger after compression (if a block is larger after compression then compression for the entire file will fail). After the compressed blocks are created then their locations and sizes are written to the resource fork data header.
4. Add the com.apple.decmpfs extended attribute to the file, then the resource fork if one is needed.
5. Truncate the data fork length to zero and use chflags to set the HFS+ compression flag.
This produces compressed files that are identical to the ones produced by ditto, provided compression level 5 was used for the zlib functions.
*/


async function getDiskUsage(src) {
    
    let result = await new Promise((resolve, reject) => {
        //-s flag makes du sum up file sizes for directories and nested subdirectories, instead
        //of printing out each subdirectory seperatly
        let sizer = spawn("du", ["-s", src], {
                detached: true,
                stdio: [ 'ignore', 'pipe', "pipe" ]
        })
        
        sizer.stdout.on("data", resolve)
        sizer.stderr.on("data", reject)
        sizer.on("close", resolve)
    })
    
    result = result.toString()

    //Seperate the resut from the filename
    result = result.slice(0, result.indexOf("\t"))
    
    result = Number(result) * 512 //du measures in 512 byte blocks on Mac
    
    return result
    
}


async function transparentlyCompress(src) {
        
    //Consider using the temp directory - it might be partially or fully memory backed
    //It should also get us a totally empty filename
    const tempsrc = src + "odtxyhstd" //Just picked some characters as a postfix
        
    //Detect if file exists. If tempsrc exists, error (ditto would overwrite)
    
    if (fs.existsSync(tempsrc)) {
        throw "Failed to find an unused temporary location - but didn't really try"
    }
    
    
    let originalSize = await getDiskUsage(src)
    
    await new Promise((resolve, reject) => {
		
        let detector = spawn("ditto", ["--hfsCompression", "--zlibCompressionLevel", zlibComressionLevel, src, tempsrc], {
            detached: true,
            stdio: [ 'ignore', 'pipe', "pipe" ]
        })

        detector.stdout.on("data", resolve)
        detector.stderr.on("data", reject)

        detector.on("close", resolve)
		
	})    
    
    
    //Delete the input file
    fs.unlinkSync(src)
    
    //Move the temporary file to the original location
    fs.renameSync(tempsrc, src)
    
    let compressedSize = await getDiskUsage(src)
    
    
    return {
        originalSize,
        compressedSize,
        mark: !(await isTransparentlyCompressed(src)), //We can detect if the file is already compressed
    }
        
}




//Undo transparent compression:
//afscexpand PATH
//Can be used on a single file or on directories
async function undoTransparentCompression(src) {
    
    return new Promise((resolve, reject) => {
		
        let decompressor = spawn("afscexpand", [src], {
            detached: true,
            stdio: [ 'ignore', 'ignore', "pipe" ]
        })

        decompressor.stderr.on("data", reject)

        decompressor.on("close", resolve)
		
	})
    
    return {
        
    }
    
}
    

//Detect if file is compressed:
//stat -f %f PATH
//If 32 bit (sixth lowest value bit) is set, it is compressed, if unset, uncompressed
async function isTransparentlyCompressed (src) {
    
    let value = await new Promise((resolve, reject) => {
		
        let detector = spawn("stat", ["-f", "%f", src], {
            detached: true,
            stdio: [ 'ignore', 'pipe', "pipe" ]
        })

        detector.stdout.on("data", function(data) {
            resolve(data.toString("utf8"))
        })
        
        detector.stderr.on("data", reject)

        detector.on("close", resolve)
		

		
	})
    
    return !!(value & 32) //true if 32 bit is set, false otherwise
    
}

    
    
    

//Note: du returns disk usage - ls returns actual size
//We likely want both to do the same thing
//We can either try to count the uncompressed size based on block size, or
//we can attempt to find an alternative way to calculate this
//Use ls -l to get uncompressed size (note - need to filter out other data)
//Use du -s to get compressed size







module.exports = {
    isTransparentlyCompressed,
    undoTransparentCompression,
    transparentlyCompress,
    getDiskUsage,
}

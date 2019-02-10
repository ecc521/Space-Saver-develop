'use strict'

//Remember to add information about the compression - return how much space was saved/lost

//Also report if the file needs to be marked as compressed
//Since some files in directories may be compressed, but not others, and directories contents can change, 
//All files that aren't compressed may need to be marked

//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)


const fs = require("fs")
const path = require("path") //Likely not necessary given this file is macOS only
const { spawn } = require('child_process');


const zlibComressionLevel = 9 //zlib may not always be used. Zopfli, Gzip, or some other compressor might be used in some cases depending on scenario



function deletePathRecursive(dirSrc) {
    
    //If we were passed a file instead of a directory, delete the file
    if (!fs.lstatSync(dirSrc).isDirectory()) {
        fs.unlinkSync(dirSrc)
        return;
    }
    
    let contents = fs.readdirSync(dirSrc)
    
    //All the contents have to be removed before the directory can be deleted
    contents.forEach(name => {
        let contentSrc = path.join(dirSrc, name)
        deletePathRecursive(contentSrc) 
    })
    
    fs.rmdirSync(dirSrc) //The directory is now empty
}



//Since APFS (which most mac's should be running on at this point) doesn't use much extra storage for copies
//and merely references them twice, we shouldn't cause a significant number of unnecessary disk writes when files aren't compressed by ditto

//One issue is that this program has potential to use significantly more storage while compression is in progress
//Storing the result in a RAMDisk should work, but could be annoying to the user

//To mostly resolve the storage issue, it might be a good idea to do this one file at a time, instead of copying whole directories. Given some functions have single file limits, all compression utilities may well be called one at a time


//Transparently Compress File:
//ditto --hfsCompression --zlibCompressionLevel 0-9 inputpath outputpath
//Either RAMDisks or memory mapped files could be used to avoid disk writes for files that don't actually get compressed (at the same time, APFS has some optimizations here, so it may not actually matter)


//It may be better to avoid using ditto though
//ditto has it's own method of deciding if something is compressable. If we do the compression ourselves, we may be able to allow anything to be compressed, and to compress it better using more CPU if wanted.
//Example: The clang-9 executable is 338.1 MB. ditto does not compress it, but when compressed with zip (build in utility), the size goes down from 338.1 MB to 68.5 MB.

/*
http://hints.macworld.com/article.php?story=20090902223042255
One of the comments

The first thing that I tried to do was figure out the system call used for compression; ditto uses the private framework Bom to compress files. However, looking into it further I found that the Bom framework makes a call to another private framework: AppleFSCompression. Unfortunately the syntax for the functions in AppleFSCompression is far from obvious, especially since it is a private framework which means that there are no included headers for it (and it also means that it will probably remain closed source). It didn't in the end matter however, because I found that zlib is used for the actual compression and that library is well documented. So I decided to simply figure out how the HFS+ compressed files are constructed and added that to my program.

Here's how the HFS+ compression is applied:
1. Check the file to ensure it does not have a resource fork or com.apple.decmpfs extended attribute.
2. Construct the headers, calculate the number of 64 KiB blocks needed based on the source file size.
3. Compress the 64 KiB blocks using zlib (Apple uses compression level 5, but other compression levels also work); if there is only one block then append it to the com.apple.decmpfs extended attribute if the compressed data is 3786 bytes or less in size, otherwise the compressed data is put into the resource fork of the file. If the resource fork is used to store the compressed data, then no block is allowed to be larger after compression (if a block is larger after compression then compression for the entire file will fail). After the compressed blocks are created then their locations and sizes are written to the resource fork data header.
4. Add the com.apple.decmpfs extended attribute to the file, then the resource fork if one is needed.
5. Truncate the data fork length to zero and use chflags to set the HFS+ compression flag.

This produces compressed files that are identical to the ones produced by ditto, provided compression level 5 was used for the zlib functions.
*/



async function transparentlyCompress(src) {
    
    //Worsens random read performance, but should improve sequential reads on Hard Drives
    //Solid state drives will likely suffer a performance hit, but it depends on how Apple implemented decompression
    //DEFLATE streams can be uncompressed fast, and if Apple uses seperate cores for seperate blocks, speeds of over 2 GB/s would be possible
        
    //Maximum compression level is likely the best idea
    //Use ditto --hfsCompression --zlibCompressionLevel
    
    //Consider using the temp directory - it might be partially or fully memory backed
    const tempsrc = src + "odtxyhstd" //Just picked some characters as a postfix
        
    //Detect if file exists. If tempsrc exists, error (ditto would overwrite)
    
    if (fs.existsSync(tempsrc)) {
        throw "Failed to find an unused temporary location - but didn't really try"
    }
    
    
    await new Promise((resolve, reject) => {
		
        let detector = spawn("ditto", ["--hfsCompression", "--zlibCompressionLevel", zlibComressionLevel, src, tempsrc], {
            detached: true,
            stdio: [ 'ignore', 'pipe', "pipe" ]
        })

        detector.stdout.on("data", resolve)
        detector.stderr.on("data", reject)

        detector.on("close", resolve)
		
	})    
    
    
    //Delete the input file/directory
    deletePathRecursive(src)
    
    //Move the temporary file to the original location
    fs.renameSync(tempsrc, src)
        
}




//Undo transparent compression:
//afscexpand PATH
//Can be used on a single file or on directories
//Uncompresses all files in directory and nested subdirectories
async function undoTransparentCompression(src) {
    
    return new Promise((resolve, reject) => {
		
        let decompressor = spawn("afscexpand", [src], {
            detached: true,
            stdio: [ 'ignore', 'ignore', "pipe" ]
        })

        decompressor.stderr.on("data", reject)

        decompressor.on("close", resolve)
		
	})
    
}
    

//Detect if file is compressed:
//stat -f %f PATH
//If 32 bit (sixth lowest value bit) is set, it is compressed, if unset, uncompressed
async function getCompressionData (src) {
    
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
    
    return {
        isCompressed: !!(value & 32), //true if 32 bit is set, false otherwise
    } 
}






//Get file Size on Disk (also handles directories)
//du -s PATH (returns number of 512 byte blocks)

//Get file uncompressed size (note - need to filter out other data)
//ls -l PATH





(async function() {
    
    await transparentlyCompress("/Users/tuckerwillenborg/llvm-build/bin/clang-9")
    
}())



module.exports = {
    getCompressionData,
    undoTransparentCompression,
    transparentlyCompress,
}


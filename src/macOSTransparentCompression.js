'use strict'


//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)


module.exports.transparentCompression = function() {
    //Maximum compression level is likely the best idea
    //Worsens random read performance, but should improve sequential
        
    //Use ditto --hfsCompression --zlibCompressionLevel
        
        
}
    
//Transparently Compress File:
//ditto --hfsCompression --zlibCompressionLevel 0-9 inputpath outputpath
//Check that it is actually 0-9
//Either RAMDisks or memory mapped files could be used to avoid disk writes for files that don't actually get compressed (at the same time, APFS has some optimizations here, so it may not actually matter)


//Undo transparent compression:
//afscexpand PATH
//Can be used on a single file or on directories, in which case it decompresses all compressed files
    

//Detect if file is compressed:
//stat -f %f
//Returns 32 if compressed, 0 if uncompressed



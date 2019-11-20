'use strict'

let {spawn} = require("child_process")
//Different operating systems have different transparent filesystem comp

//Some little info - NOTE: Compression speeds were not accurately timed, but counted

//All the XPRESS algorithms compressed VERY fast. (Seemed to be around 270-130 MB/s)
//LZX and NTFS both got around 40 MB/s

//NTFS (not putting a /EXE flag) did the worst on compression - probably not what we want to use

//My tests did not determine a difference in decompression speeds

async function transparentlyCompress(src) {

    //Algorithm Options (fastest to most compact): XPRESS4K XPRESS8K XPRESS16K or LZX
    //They all appear to decompress at same speed (about the same as no compression), so
    //LZX is always used. This can be changed if needed.

    if ((await getCompressionData(src)).isCompressed) {
        return {
            compressed: false,
            mark: false,
        }
    }



    //compact /C /EXE:ALGORITHM PATH

    await new Promise((resolve, reject) => {

        let compressor = spawn("compact", ["/C", "/EXE:LZX", src], {
                detached: true,
                stdio: [ 'ignore', 'pipe', "pipe" ]
        })


        //compressor.stdout.on("data", resolve)
        compressor.stderr.on("data", reject)

        compressor.on("close", resolve)
	})


    //This returns compression data like:
    /*
        C:\Users\REDACTED>compact /C /EXE:LZX "C:\Users\REDACTED\Documents\chrome - NONE - Copy.tar"

         Compressing files in C:\Users\REDACTED\Documents\

        chrome - NONE - Copy.tar 406835200 : 164442112 = 2.5 to 1 [OK]

        1 files within 1 directories were compressed.
        406,835,200 total bytes of data are stored in 164,442,112 bytes.
        The compression ratio is 2.5 to 1.
    */
    //I didn't bother implementing parsing for this data, and instead call getCompressionData

    let compressionData = await getCompressionData(src)

    return {
        mark: !compressionData.isCompressed,
        originalSize: compressionData.originalSize,
        compressedSize: compressionData.compressedSize
    }
}


async function undoTransparentCompression(src) {
    //compact /U /EXE:LZX PATH

    await new Promise((resolve, reject) => {

        let compressor = spawn("compact", ["/U", "/EXE:LZX", src], {
                detached: true,
                stdio: [ 'ignore', 'pipe', "pipe" ]
        })

        compressor.stderr.on("data", reject)
        compressor.on("close", resolve)
	})
}


async function getCompressionData(src) {

    let output = await new Promise((resolve, reject) => {

        let detector = spawn("compact", [src], {
            detached: true,
            stdio: [ 'ignore', 'pipe', "pipe" ]
        })

        detector.stdout.on("data", resolve)
        detector.stderr.on("data", reject)

        detector.on("close", resolve)
	})


    let text = output.toString()
    console.log(text)
    //Finds and parses "    originalSize :     CompressedSize"
    let matchedSizes = text.match(/\d+\s+:\s+\d+/)[0].split(/\s+:\s+/)

    let originalSize = Number(matchedSizes[0])
    let compressedSize = Number(matchedSizes[1])

    let isCompressed = text.includes("1 are compressed")

    return {
        isCompressed,
        originalSize,
        compressedSize
    }
}



module.exports = {
    getCompressionData,
    undoTransparentCompression,
    transparentlyCompress,
}

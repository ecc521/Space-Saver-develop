const compressFile = require("./compressFile.js")

//Takes an array of files
//It parellelizes compression
function compressFiles(files) {
    
    //Note - may want to use os.freemem() to get memory that is available
    //That could allow us to carefully select files for maximum speed without running out of RAM
    //May also want to consider increasting the number of paralell compressions to above the number
    //of cores to prevent slowdowns on disk writes - expecially transparent file compression.
    //That should only be done if there is adequet memory
    
    //Number of compression operations to run at once
    let paralell = navigator.hardwareConcurrency
    
    let results = []
    let fileNum = 0 //Counter
    let completed = 0
    
    //Wait for all the files to finish
    await new Promise((resolve, reject) => {
        async function nextFile() {
            let src = files[fileNum]
            if (fileNum < files.length) {
                fileNum++
                let result = await compressFile(files)
                results.push({
                    src,
                    result
                })
                completed++
                if (completed === files.length) {
                    resolve()
                }
                nextFile() //Tail call optimization MAY prevent potential recursion depth issues
            }
        }


        //Start the initial builds
        for (let i=0;i<paralell;i++) { 
            nextFile()  
        }        
    })

    return results
}
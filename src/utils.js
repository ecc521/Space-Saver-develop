const fs = require("fs")
const path = require("path")


//This has potential to cause serious problems, but is the only way I currently
//see to work around a issue in electron (not yet opened on repository)

//In order to get the outside view of the filesystem, we need to set process.noAsar to true
//Otherwise, electron will pretend that asar files are directorys and error on a directory named a.asar
const process = require("process")
//Currently, there shouldn't be many issues, if any, due to mostly synchronus behavior.
//But there is serious potential for race conditions.

//If race conditions become an issue, the following code can be used instead:
/*
require("child_process").execSync(`if [ -d "/" ] 
then
    exit 0 
else
    exit 1
fi`)
*/

//If the command completes with an exit code of 0, then the file is a directory (so not an asar). If the command throws with
//an exit code of 1, the file is not a directory, so if node treats it as a directory, we know it is an asar.

//However this will not get around the fact that a directory names directory.asar will cause the fs module to error - 
//though directories ending in .asar are extremely unlikely.

//Because of this, treating anything.asar as an asar archive could also be used, though it would be slightly more 
//susceptible to not compressing file that it should


//Need to be careful here. This returns upwards of 2,000,000 files on my system

function getFilesInDirectory (dir, files_){
    
    files_ = files_ || [];

    process.noAsar = true
    
    //Return if we were passed a file or symbolic link
    let dirStats = fs.lstatSync(dir)
    if (dirStats.isSymbolicLink()) {
        return [];
    }
    if (!dirStats.isDirectory()) {
        return [dir]
    }

    let files;

    try {
        files = fs.readdirSync(dir);
    }
    catch (e) {
        //Likely a permission denied error
        //Return an empty array
        console.warn(e);
        return []
    }

    for (var i in files){
        let name = path.join(dir, files[i])
        //Currently ignores symbolic links
        //Change lstatSync to statSync to stat the target of the symbolic link, not the link itself
        
        let stats = fs.lstatSync(name) 

        if (stats.isSymbolicLink()) {
            continue; 
        }

        if (stats.isDirectory()){
            getFilesInDirectory(name, files_);
            process.noAsar = true
        } 
        else {
            files_.push(name);
        }
    }
    process.noAsar = false
    return files_;
}



//Deletes symbolic links, not their target contents
function deleteDirectory (dir){

    process.noAsar = true
    
    let dirStats = fs.lstatSync(dir)

    if (!dirStats.isDirectory()) {
        fs.unlinkSync(dir)
        return;
    }

    let files = fs.readdirSync(dir);


    for (var i in files){
        let name = path.join(dir, files[i])

        let stats = fs.lstatSync(name) 

        if (stats.isDirectory()){
            deleteDirectory(name);
        } 
        else {
            fs.unlinkSync(name);
        }
    }
    fs.rmdirSync(dir) 
    
    process.noAsar = false
}






module.exports = {
    getFilesInDirectory,
    deleteDirectory,

}
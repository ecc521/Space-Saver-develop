const fs = require("fs")
const path = require("path")

//Need to be careful here. This returns upwards of 2,000,000 files on my system

function getFilesInDirectory (dir, files_){
    files_ = files_ || [];

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
        } 
        else {
            files_.push(name);
        }
    }
    return files_;
}



//Deletes symbolic links, not their target contents
function deleteDirectory (dir){

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
}













module.exports = {
    getFilesInDirectory,
    deleteDirectory,

}
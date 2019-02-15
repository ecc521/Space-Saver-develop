const path = require("path")

function getFilesInDirectory (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
		let name = path.join(dir, files[i])
        if (fs.statSync(name).isDirectory()){
            getFilesInDirectory(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}













module.exports = {
	getFilesInDirectory,

}
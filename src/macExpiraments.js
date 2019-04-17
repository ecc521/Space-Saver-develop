
//This and getLauguagePacks are macOS only
function getApplications (dir, dirs_){

    dirs_ = dirs_ || [];

    //Return if we were passed a file or symbolic link
    let dirStats = fs.lstatSync(dir)

    if (dirStats.isSymbolicLink() || !dirStats.isDirectory()) {
        return [];
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
        let stats = fs.lstatSync(name)
        if (stats.isDirectory()){
            if (files[i].endsWith(".app")) {
                dirs_.push(name)
            }
            else {
                getApplications(name, dirs_)
            }
        }
    }
    return dirs_;
}





function getLanguagePacks(apps) {
    let packs = []
    for (let i=0;i<apps.length;i++) {
        let dir = path.join(apps[i], "Contents", "Resources")

        let contents = fs.readdirSync(dir)

        for (let c=0;c<contents.length;c++) {
            let src = path.join(dir, contents[c])
            let stats = fs.statSync(src)
            if (stats.isDirectory() && contents[c].endsWith(".lproj")) {
                packs.push(src)
            }
        }

    }
    return packs
}


getLanguagePacks(getApplications("/Applications"))
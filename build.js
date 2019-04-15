const {exec} = require("child_process")
const fs = require("fs")
const path = require("path")


let args = process.argv.slice(2)

let extraFlags;

//Linux and Windows don't need fs-xattr. With electron-forge Linux failed if this is installed.





if (args[0] === "publish") {
    
    extraFlags = "--publish always"
    
    let version = JSON.parse(fs.readFileSync("package.json")).version
    
    let dir = path.join("../", "Space-Saver")

    fs.writeFileSync(path.join(dir, "versions.json"), JSON.stringify({
        version
    }))
     
}



let script = `
yarn remove fs-xattr
npx build --linux --x64 --arm64  ${extraFlags} &
npx build --win  ${extraFlags}
yarn add fs-xattr
npx build --mac  ${extraFlags}

cd ../
cd Space-Saver
git commit versions.json -m "Update Version"
git push
cd ../
cd Space-Saver-develop


`


console.log("build.sh created")
fs.writeFileSync("build.sh", script)
fs.chmodSync("build.sh", 0o755)
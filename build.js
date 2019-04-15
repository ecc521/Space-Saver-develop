const {exec} = require("child_process")
const fs = require("fs")
const path = require("path")


let extraFlags = ""
let args = process.argv.slice(2)

//Linux and Windows don't need this. With electron-forge Linux failed if this is installed.

let script = `
yarn remove fs-xattr
npx build --linux --x64 --arm64 ${extraFlags} &
npx build --win ${extraFlags}
yarn add fs-xattr
npx build --mac ${extraFlags}
`



if (args[0] === "publish") {
    
    let dir = path.join("../", "Space-Saver")
    let version = JSON.parse(fs.readFileSync("package.json")).version
    
    fs.writeFileSync(path.join(dir, "versions.json"), JSON.stringify({
        version
    }))
    
    
    fs.writeFileSync(path.join(dir, "index.html"), `

<h1 style="text-align:center">Space Saver Downloads</h1>

<a href="Space Saver Setup ${version}.exe">Windows Download</a>
<a href="Space Saver-${version}.dmg">Mac Download</a>
<a href="space-saver_${version}_amd64.deb">Debian Linux x64 Download</a>
<a href="space-saver_${version}_arm64.deb">Debian Linux arm64 Download</a>

This software is based in part on the work of the Independent JPEG Group.


Copyright (c) Tucker Willenborg 2019
`)

    
    script += 
`
git add -A && git commit -m "Update Version"
git push
`    
}






console.log("build.sh created")
fs.writeFileSync("build.sh", script)
fs.chmodSync("build.sh", 0o755)
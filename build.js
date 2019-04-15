const {exec} = require("child_process")
const fs = require("fs")

if (process.argv[2] === "publish") {
    extraFlags = "--publish always"
    console.log("Running in publish mode")
}
else {
    extraFlags = ""
}

//Linux and Windows don't need this. With electron-forge Linux failed if this is installed.

let script = `
yarn remove fs-xattr
npx build --linux --x64 --arm64 ${extraFlags} &
npx build --win ${extraFlags}
yarn add fs-xattr
npx build --mac ${extraFlags}
`

console.log("build.sh created")
fs.writeFileSync("build.sh", script)
fs.chmodSync("build.sh", 0o755)
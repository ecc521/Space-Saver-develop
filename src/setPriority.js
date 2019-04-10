const {spawnSync} = require("child_process")

function windowsSetPriority() {

}

//renice -n nicenessvalue -p processid
function setPriority(pid, priority) {
  priority = priority||20 //Use minimum priority if not set
  spawnSync("renice", ["-n", priority, "-p", pid])
}

module.exports = {

}

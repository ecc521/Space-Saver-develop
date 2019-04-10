const {spawnSync} = require("child_process")


function windowsSetPriority() {

}

//renice -n nicenessvalue -p processid
function setPriority(pid, priority) {
  priority = priority||19 //Use lowest priority if not set
  let output = spawnSync("renice", ["-n", priority, "-p", pid])
  return output.status
}

module.exports = {
  setPriority,
}

const {spawnSync} = require("child_process")

/*
wmic process where name="calc.exe" CALL setpriority "idle"

Either the word in quotes or the number can be used

Idle:		64
Below Normal:	16384 
Normal:		32 
Above Normal:	32768
High Priority:	128
Real Time:	256
*/
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


//Files that will not benefit from compression
//Note: If there is an algorithm for recompressing the file effectively, this list will be ignored

//These should be ordered alphabetically

let uncompressable = [
	".mp4",
	".xz",
	".txz",
	".lzma",
	".bz",
	".bz2",
	".tbz",
	".gz",
	".tgz",
	".lz",
]



module.exports = {
	uncompressable,
}
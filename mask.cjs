const sharp = require("sharp");
const svgMask = `<svg width="1024" height="1024">
  <rect x="0" y="0" width="1024" height="1024" rx="232" ry="232" fill="white"/>
</svg>`;
sharp("assets/icon_v2_vibrant.png")
  .resize(1024, 1024)
  .composite([
    {
      input: Buffer.from(svgMask),
      blend: "dest-in",
    },
  ])
  .toFile("assets/icon_v2_squircle.png")
  .then(() => console.log("Mask applied!"))
  .catch((err) => console.error(err));

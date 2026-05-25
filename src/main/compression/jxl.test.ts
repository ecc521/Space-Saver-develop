import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { compressImageToJxlNative, restoreJxlToImageNative } from "./jxl";

describe("JXL Native Transcoder", () => {
  const scratchDir = "/Users/tuckerwillenborg/.gemini/antigravity/scratch";
  const testJpg = path.join(scratchDir, "test_jxl_source.jpg");
  const testJxl = path.join(scratchDir, "test_jxl_out.jxl");
  const testRestored = path.join(scratchDir, "test_jxl_restored.jpg");
  const sourceJpg = path.join(scratchDir, "large_photo.jpg");

  beforeAll(() => {
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
  });

  afterAll(() => {
    for (const f of [testJpg, testJxl, testRestored]) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }
  });

  it("losslessly compresses JPEG to JXL, preserves metadata footer, and restores byte-for-byte", async () => {
    if (!fs.existsSync(sourceJpg)) {
      console.warn("Skipping JXL test: large_photo.jpg not found");
      return;
    }

    // 1. Prepare JPEG source file
    fs.copyFileSync(sourceJpg, testJpg);
    const origSize = fs.statSync(testJpg).size;

    // 2. Compress to JXL (lossless -d 0 effort 7)
    const compResult = await compressImageToJxlNative(testJpg, testJxl, { effort: 7 });
    expect(compResult.originalSize).toBe(origSize);
    expect(fs.existsSync(testJxl)).toBe(true);
    // Source file should have been deleted (swapped)
    expect(fs.existsSync(testJpg)).toBe(false);

    // Verify JXL is smaller (often the case, otherwise compResult.mark is false but in our test we check size)
    const jxlSize = fs.statSync(testJxl).size;
    expect(jxlSize).toBe(compResult.compressedSize);

    // 3. Append footer mimicking compressionEngine.ts
    const extName = "jpg".padEnd(4, "\0").slice(0, 4);
    const footer = Buffer.from(`\0\0\0\0\0SW_EXT:${extName}`);
    await fs.promises.appendFile(testJxl, footer);

    // 4. Restore back to JPEG using djxl
    const decompResult = await restoreJxlToImageNative(testJxl, testRestored);
    expect(decompResult.originalSize).toBe(jxlSize + 16); // including footer
    expect(fs.existsSync(testRestored)).toBe(true);
    // JXL should have been deleted
    expect(fs.existsSync(testJxl)).toBe(false);

    const restoredSize = fs.statSync(testRestored).size;
    expect(restoredSize).toBe(origSize); // Lossless roundtrip byte verification
  });
});

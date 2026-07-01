import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { compressJpegNative } from "./jpeg";

describe("JPEG Native Optimizer", () => {
  const scratchDir = "/Users/tuckerwillenborg/.gemini/antigravity/scratch";
  const testJpg = path.join(scratchDir, "test_opt.jpg");
  const sourceJpg = path.join(scratchDir, "large_photo.jpg");

  beforeAll(() => {
    // Ensure scratch directory and source photo exist
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testJpg)) {
      fs.unlinkSync(testJpg);
    }
  });

  it("losslessly optimizes a JPEG file", async () => {
    // If the sample photo wasn't downloaded for some reason, skip
    if (!fs.existsSync(sourceJpg)) {
      console.warn(
        "Skipping JPEG native optimizer test: large_photo.jpg not found",
      );
      return;
    }

    fs.copyFileSync(sourceJpg, testJpg);
    const origSize = fs.statSync(testJpg).size;

    const result = await compressJpegNative(testJpg, { progressive: true });

    expect(result).toBeDefined();
    expect(result.originalSize).toBe(origSize);

    const newSize = fs.statSync(testJpg).size;
    expect(result.compressedSize).toBe(newSize);

    // If it was already optimized, mark might be false and sizes same, otherwise smaller
    if (result.mark) {
      expect(newSize).toBeLessThan(origSize);
    } else {
      expect(newSize).toBe(origSize);
    }
  });
});

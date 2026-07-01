import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";

export function AdvancedSettingsModal({
  showAdvancedSettings,
  setShowAdvancedSettings,
  fileCompressionEnabled,
  nativeAlgo,
  setNativeAlgo,
  platform,
  imageCompressionEnabled,
  outputFormat,
  setOutputFormat,
  jxlEffort,
  setJxlEffort,
}: {
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean) => void;
  fileCompressionEnabled: boolean;
  nativeAlgo: string;
  setNativeAlgo: (algo: string) => void;
  platform: string;
  imageCompressionEnabled: boolean;
  outputFormat: string;
  setOutputFormat: (format: "jxl" | "jpeg" | "original") => void;
  jxlEffort: number;
  setJxlEffort: (effort: number) => void;
}) {
  const getAlgoDescription = () => {
    switch (nativeAlgo) {
      case "automatic":
        return "We let your OS pick the optimal algorithm.";
      case "LZX":
        return "Highest compression, significantly reduced speed. Best for archival.";
      case "XPRESS16K":
        return "High compression, reduced speed.";
      case "XPRESS8K":
        return "Balanced compression and speed.";
      case "XPRESS4K":
        return "Light compression, maximum speed.";
      case "lzfse":
        return "Balanced compression and speed (Apple default).";
      case "zlib":
        return "Highest compression, reduced speed. Used for maximum space savings.";
      case "lzvn":
        return "Light compression, maximum speed.";
      case "off":
        return "Disables transparent compression entirely.";
      default:
        return "Higher compression saves more space but is slower to process.";
    }
  };

  return (
    <AnimatePresence>
      {showAdvancedSettings && (
        <motion.div
          className="eula-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="eula-modal"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            style={{
              maxWidth: "480px",
              borderLeft: "4px solid var(--text-secondary)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                className="eula-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: 0,
                }}
              >
                <Settings className="text-secondary" /> Advanced Controls
              </h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="eula-content"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {fileCompressionEnabled && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    OS Transparent Algorithm
                  </div>
                  <select
                    value={nativeAlgo}
                    onChange={(e) => setNativeAlgo(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="automatic">Automatic (OS Default)</option>
                    {platform === "win32" && (
                      <>
                        <option value="LZX">LZX (Strongest)</option>
                        <option value="XPRESS16K">XPRESS 16K (Stronger)</option>
                        <option value="XPRESS8K">XPRESS 8K (Balanced)</option>
                        <option value="XPRESS4K">XPRESS 4K (Fastest)</option>
                      </>
                    )}
                  </select>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    {getAlgoDescription()}
                  </div>
                </div>
              )}

              {imageCompressionEnabled && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    Image Format
                  </div>
                  <select
                    value={outputFormat}
                    onChange={(e) =>
                      setOutputFormat(
                        e.target.value as "jxl" | "jpeg" | "original",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="jpeg">Standard JPEG</option>
                    <option value="jxl">Archival JPEG XL (Default)</option>
                  </select>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    {outputFormat === "jxl"
                      ? "25-30% smaller. Perfect for long-term storage."
                      : "Optimizes size while retaining legacy compatibility."}
                  </div>
                </div>
              )}

              {imageCompressionEnabled && outputFormat === "jxl" && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    JXL Effort Level
                  </div>
                  <select
                    value={jxlEffort}
                    onChange={(e) => setJxlEffort(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <option value={1}>1 (Fastest)</option>
                    <option value={3}>3 (Fast)</option>
                    <option value={5}>5 (Balanced)</option>
                    <option value={7}>7 (Strong - Default)</option>
                    <option value={9}>9 (Strongest)</option>
                  </select>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    Higher effort takes significantly longer.
                  </div>
                </div>
              )}
            </div>

            <div
              className="eula-footer"
              style={{
                marginTop: "32px",
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setShowAdvancedSettings(false)}
                style={{ width: "100%", padding: "12px" }}
              >
                Close Settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

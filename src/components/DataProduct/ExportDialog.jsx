import { FiX, FiDownload, FiCopy } from "react-icons/fi";

const ExportDialog = ({
  show,
  onClose,
  exportJson
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(exportJson).then(() => {
      alert("Copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-product-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!show) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          zIndex: 1000,
          width: "700px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
            Export Data Product
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "0",
              lineHeight: "1",
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        <div style={{ marginBottom: "16px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
            JSON Data
          </label>
          <textarea
            value={exportJson}
            readOnly
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              resize: "none",
              background: "#f9fafb",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 16px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 200ms ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
          >
            <FiCopy size={14} />
            Copy
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: "10px 16px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 200ms ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
          >
            <FiDownload size={14} />
            Download
          </button>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;


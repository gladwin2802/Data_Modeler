import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const ConnectionTypeDialog = ({
  show,
  onClose,
  selectedEdgeDetails,
  onChangeConnectionType
}) => {
  const [connectionType, setConnectionType] = useState("ref");

  useEffect(() => {
    if (selectedEdgeDetails?.data?.connectionType) {
      setConnectionType(selectedEdgeDetails.data.connectionType);
    }
  }, [selectedEdgeDetails]);

  const handleSave = () => {
    onChangeConnectionType(connectionType);
  };

  if (!show || !selectedEdgeDetails) return null;

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
          minWidth: "500px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
            Edit Connection Type
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

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
            Connection Type
          </label>
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            <option value="ref">Reference (Red)</option>
            <option value="calculation">Calculation (Blue)</option>
          </select>
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
            <strong>Reference:</strong> Direct field reference<br />
            <strong>Calculation:</strong> Derived/calculated field
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
              transition: "all 200ms ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 16px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default ConnectionTypeDialog;


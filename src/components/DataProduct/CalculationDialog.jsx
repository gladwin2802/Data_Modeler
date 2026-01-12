import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const CalculationDialog = ({
  show,
  onClose,
  onSave,
  initialExpression = "",
  fieldName = "",
  nodeId = null,
  nodes = [],
  edges = []
}) => {
  const [expression, setExpression] = useState(initialExpression);
  const [availableFields, setAvailableFields] = useState([]);

  useEffect(() => {
    setExpression(initialExpression);
  }, [initialExpression]);

  useEffect(() => {
    if (!show || !nodeId || !nodes.length) {
      setAvailableFields([]);
      return;
    }

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;

    const incomingEdges = edges.filter(e => e.target === nodeId);
    const sourceNodeIds = incomingEdges.map(e => e.source);
    const sourceNodes = nodes.filter(n => sourceNodeIds.includes(n.id));

    const fields = sourceNodes.flatMap(node => 
      node.data.fields.map(field => ({
        tableName: node.data.tableName,
        fieldName: field.name,
        type: field.type,
        display: `${node.data.tableName}.${field.name}`
      }))
    );

    setAvailableFields(fields);
  }, [show, nodeId, nodes, edges]);

  const handleSave = () => {
    onSave(expression);
  };

  const insertField = (fieldDisplay) => {
    setExpression(prev => prev + fieldDisplay);
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
          minWidth: "600px",
          maxWidth: "800px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
            Edit Calculation {fieldName ? `- ${fieldName}` : ""}
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

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
            Calculation Expression
          </label>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter calculation expression (e.g., TABLE1.field1 + TABLE2.field2)"
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "monospace",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {availableFields.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              Available Fields (from connected tables)
            </label>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "6px",
              maxHeight: "200px",
              overflow: "auto"
            }}>
              {availableFields.map((field, idx) => (
                <button
                  key={idx}
                  onClick={() => insertField(field.display)}
                  style={{
                    padding: "6px 12px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    color: "#1e40af",
                    transition: "all 200ms ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dbeafe";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#eff6ff";
                    e.currentTarget.style.borderColor = "#bfdbfe";
                  }}
                  title={`Click to insert ${field.display}`}
                >
                  {field.display}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
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

export default CalculationDialog;


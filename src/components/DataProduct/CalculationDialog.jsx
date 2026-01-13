import { useState, useEffect, useRef } from "react";

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
  const [availableFields, setAvailableFields] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = initialExpression;
    }
  }, [initialExpression]);

  useEffect(() => {
    if (!show || !nodeId || !nodes.length || !fieldName) {
      setAvailableFields([]);
      return;
    }

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;

    // Find incoming edges specifically for this field
    // targetHandle format: "FieldName-target"
    const fieldTargetHandle = `${fieldName}-target`;
    const incomingEdgesForField = edges.filter(
      e => e.target === nodeId && e.targetHandle === fieldTargetHandle
    );

    if (incomingEdgesForField.length === 0) {
      setAvailableFields([]);
      return;
    }

    // Extract source field names from incoming edges
    // sourceHandle format: "FieldName-source"
    const sourceFieldNames = incomingEdgesForField.map(e => {
      const handleParts = e.sourceHandle.split('-source');
      return handleParts[0];
    });

    // Get source nodes from these incoming edges
    const sourceNodeIds = incomingEdgesForField.map(e => e.source);
    const sourceNodes = nodes.filter(n => sourceNodeIds.includes(n.id));

    // Build available fields - only include fields that are actually connected
    const fields = sourceNodes.flatMap(node => 
      node.data.fields
        .filter(field => sourceFieldNames.includes(field.name))
        .map(field => ({
          tableName: node.data.tableName,
          fieldName: field.name,
          type: field.type,
          display: `${node.data.tableName}.${field.name}`
        }))
    );

    setAvailableFields(fields);
  }, [show, nodeId, nodes, edges, fieldName]);

  const handleSave = () => {
    const currentValue = textareaRef.current?.value || "";
    onSave(currentValue);
  };

  const insertField = (fieldDisplay) => {
    if (textareaRef.current) {
      textareaRef.current.value += fieldDisplay;
    }
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
          padding: "32px",
          zIndex: 1000,
          minWidth: "500px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: "8px",
          }}
        >
          Define Calculation
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "20px",
          }}
        >
          Enter the calculation expression or formula for this relationship
        </p>
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Calculation Expression
          </label>
          <textarea
            ref={textareaRef}
            defaultValue={initialExpression}
            placeholder="e.g., SUM(order_amount) / COUNT(order_id)"
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "monospace",
              outline: "none",
              resize: "vertical",
            }}
            autoFocus
          />
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginTop: "6px",
            }}
          >
            Define how this attribute is calculated from the source attribute
          </div>
        </div>

        {availableFields.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              Available Fields ({availableFields.length > 0 ? (availableFields[0]?.connectionType === "calculation" ? "Calculation" : "Reference") : ""} type)
            </label>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              maxHeight: "150px",
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
                    transition: "all 200ms ease",
                    whiteSpace: "nowrap"
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

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              background: "#8b5cf6",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#7c3aed";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#8b5cf6";
            }}
          >
            Save Calculation
          </button>
        </div>
      </div>
    </>
  );
};

export default CalculationDialog;


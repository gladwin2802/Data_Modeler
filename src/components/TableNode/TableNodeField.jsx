import { Handle, Position } from "reactflow";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import TableNodeFieldEditor from "./TableNodeFieldEditor";
import TableNodeCalculationEditor from "./TableNodeCalculationEditor";

/**
 * Individual field component within TableNode
 */
const TableNodeField = ({
    field,
    data,
    isSelected,
    editingField,
    setEditingField,
    onFieldClick,
    onUpdateFieldName,
    onDeleteField,
    onUpdateFieldCalculation,
    onDeleteFieldRef,
}) => {
    const isEditing = editingField === field.name;
    // Use nodeId (which contains the full prefixed entity name) when
    // constructing handle ids so they match imported edges.
    const nodeId = data.nodeId || data.label;
    const handleId = `${nodeId}-${field.name}`;
    
    // Keep handles in their original positions (left=target, right=source) for consistency
    // The layout direction will determine node positioning, not handle positions
    const leftHandleType = "target";  // Always target (input) on the left
    const rightHandleType = "source";  // Always source (output) on the right
    const leftHandleColor = "#3b82f6"; 
    const rightHandleColor = "#3b82f6";

    return (
        <div
            style={{
                fontSize: 13,
                marginBottom: 4,
                position: "relative",
                padding: "8px 20px 8px 20px", // Increased padding to accommodate handles (left/right: 20px)
                background: isSelected 
                    ? "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                    : data.isEditing 
                    ? "rgba(243, 244, 246, 0.5)"
                    : "transparent",
                borderRadius: 6,
                border: data.isEditing 
                    ? "1px solid #e5e7eb" 
                    : isSelected 
                    ? "1px solid #3b82f6"
                    : "none",
                transition: "all 150ms ease",
                cursor: data.isEditing || isEditing ? "default" : "pointer",
            }}
            onMouseEnter={(e) => {
                if (!data.isEditing && !isEditing && !isSelected) {
                    e.currentTarget.style.background = "rgba(243, 244, 246, 0.6)";
                }
            }}
            onMouseLeave={(e) => {
                if (!data.isEditing && !isEditing && !isSelected) {
                    e.currentTarget.style.background = "transparent";
                }
            }}
        >
            {/* Left Handle */}
            <Handle
                type={leftHandleType}
                position={Position.Left}
                id={handleId}
                style={{
                    background: leftHandleColor,
                    width: 12,
                    height: 12,
                    position: "absolute",
                    left: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "2.5px solid #fff",
                    borderRadius: "50%",
                    boxShadow: "0 2px 6px rgba(59, 130, 246, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)",
                    transition: "all 200ms ease",
                    cursor: "crosshair",
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = "#2563eb";
                    e.target.style.width = "14px";
                    e.target.style.height = "14px";
                    e.target.style.left = "-7px";
                    e.target.style.boxShadow = "0 3px 8px rgba(59, 130, 246, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = leftHandleColor;
                    e.target.style.width = "12px";
                    e.target.style.height = "12px";
                    e.target.style.left = "-6px";
                    e.target.style.boxShadow = "0 2px 6px rgba(59, 130, 246, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)";
                }}
            />

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "4px",
                }}
                onClick={(e) => {
                    if (!data.isEditing && !isEditing) {
                        onFieldClick?.(field.name, field);
                    }
                }}
            >
                {isEditing ? (
                    <TableNodeFieldEditor
                        field={field}
                        onSave={(newName) => {
                            onUpdateFieldName?.(field.name, newName);
                            setEditingField(null);
                        }}
                        onCancel={() => setEditingField(null)}
                    />
                ) : (
                    <span
                        style={{
                            color: field.calculation ? "#333" : "inherit",
                            fontWeight: isSelected
                                ? "bold"
                                : field.calculation
                                ? "500"
                                : "normal",
                            flex: 1,
                            cursor: data.isEditing ? "default" : "pointer",
                        }}
                    >
                        {field.name}
                    </span>
                )}

                {data.isEditing && !isEditing && (
                    <div style={{ display: "flex", gap: "4px" }}>
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingField(field.name);
                                }}
                                style={{
                                    padding: "4px",
                                    background: "#3b82f6",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    transition: "all 150ms ease",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#2563eb";
                                    e.target.style.transform = "scale(1.05)";
                                    const tooltip = e.target.parentElement?.querySelector('.tooltip');
                                    if (tooltip) tooltip.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#3b82f6";
                                    e.target.style.transform = "scale(1)";
                                    const tooltip = e.target.parentElement?.querySelector('.tooltip');
                                    if (tooltip) tooltip.style.opacity = "0";
                                }}
                            >
                                <FiEdit3 size={14} />
                            </button>
                            <div
                                className="tooltip"
                                style={{
                                    position: "absolute",
                                    bottom: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    marginBottom: "4px",
                                    background: "rgba(0, 0, 0, 0.8)",
                                    color: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    opacity: 0,
                                    transition: "opacity 150ms ease",
                                    zIndex: 1000,
                                }}
                            >
                                Edit field name
                            </div>
                        </div>
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                        window.confirm(
                                            `Delete field "${field.name}"?`
                                        )
                                    ) {
                                        onDeleteField?.(field.name);
                                    }
                                }}
                                style={{
                                    padding: "4px",
                                    background: "#ef4444",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    transition: "all 150ms ease",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#dc2626";
                                    e.target.style.transform = "scale(1.05)";
                                    const tooltip = e.target.parentElement?.querySelector('.tooltip');
                                    if (tooltip) tooltip.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#ef4444";
                                    e.target.style.transform = "scale(1)";
                                    const tooltip = e.target.parentElement?.querySelector('.tooltip');
                                    if (tooltip) tooltip.style.opacity = "0";
                                }}
                            >
                                <FiTrash2 size={14} />
                            </button>
                            <div
                                className="tooltip"
                                style={{
                                    position: "absolute",
                                    bottom: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    marginBottom: "4px",
                                    background: "rgba(0, 0, 0, 0.8)",
                                    color: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    opacity: 0,
                                    transition: "opacity 150ms ease",
                                    zIndex: 1000,
                                }}
                            >
                                Delete field
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Calculation (shown when editing) */}
            {data.isEditing && !isEditing && field.calculation && (
                <div
                    style={{
                        marginTop: "6px",
                        padding: "8px",
                        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                        borderRadius: 6,
                        fontSize: 11,
                        border: "1px solid #fbbf24",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <strong>Calculation:</strong>
                        <TableNodeCalculationEditor
                            field={field}
                            onSave={(expression) => {
                                onUpdateFieldCalculation?.(field.name, expression);
                            }}
                            onCancel={() => {}}
                            onDelete={(fieldName, ref) => {
                                onDeleteFieldRef?.(fieldName, ref, true);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Right Handle */}
            <Handle
                type={rightHandleType}
                position={Position.Right}
                id={handleId}
                style={{
                    background: rightHandleColor,
                    width: 12,
                    height: 12,
                    position: "absolute",
                    right: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "2.5px solid #fff",
                    borderRadius: "50%",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)",
                    transition: "all 200ms ease",
                    cursor: "crosshair",
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = "#059669";
                    e.target.style.width = "14px";
                    e.target.style.height = "14px";
                    e.target.style.right = "-7px";
                    e.target.style.boxShadow = "0 3px 8px rgba(16, 185, 129, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = rightHandleColor;
                    e.target.style.width = "12px";
                    e.target.style.height = "12px";
                    e.target.style.right = "-6px";
                    e.target.style.boxShadow = "0 2px 6px rgba(16, 185, 129, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)";
                }}
            />
        </div>
    );
};

export default TableNodeField;


import { memo, useState } from "react";
import TableNodeHeader from "./TableNodeHeader";
import TableNodeField from "./TableNodeField";
import TableNodeAddField from "./TableNodeAddField";

/**
 * Main TableNode component
 */
const TableNode = ({ data }) => {
    // Get table type to apply different themes
    const tableType = data.tableType || "BASE";

    // Color scheme based on table type
    let bg, border;
    switch (tableType) {
        case "VIEW":
            bg = "#ecfdf5";
            border = "2px solid #10b981";
            break;
        case "CTE":
            bg = "#f0e6ff";
            border = "2px solid #a855f7";
            break;
        case "BASE":
        default:
            bg = "#fff";
            border = "1px solid #fff";
            break;
    }

    const [editingField, setEditingField] = useState(null);

    // Get edges for a specific field
    const getFieldEdges = (fieldName) => {
        const handleId = `${data.label}-${fieldName}`;
        return (
            data.edges?.filter(
                (e) =>
                    e.sourceHandle === handleId || e.targetHandle === handleId
            ) || []
        );
    };

    return (
        <div
            style={{
                background: bg,
                border,
                borderRadius: 12,
                minWidth: 300,
                width: 380,
                fontFamily: "inherit",
                boxShadow:
                    "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
                transition: "all 200ms ease",
                // overflow: "hidden",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {/* Header */}
            <TableNodeHeader 
                data={data} 
                onEditClick={data.onEditClick}
                onDeleteClick={data.onDeleteTable}
            />

            {/* Field List */}
            <div style={{ padding: "8px 12px" }}>
                {data.fields.map((field, idx) => {
                    const isSelected =
                        data.selectedField?.nodeId === data.label &&
                        data.selectedField?.fieldName === field.name;

                    return (
                        <TableNodeField
                            key={idx}
                            field={field}
                            data={data}
                            isSelected={isSelected}
                            editingField={editingField}
                            setEditingField={setEditingField}
                            onFieldClick={data.onFieldClick}
                            onUpdateFieldName={data.onUpdateFieldName}
                            onDeleteField={data.onDeleteField}
                            onUpdateFieldCalculation={
                                data.onUpdateFieldCalculation
                            }
                            onDeleteFieldRef={data.onDeleteFieldRef}
                        />
                    );
                })}

                {/* Add New Field Section (shown only when editing) */}
                {data.isEditing && (
                    <TableNodeAddField onAddField={data.onAddField} />
                )}
            </div>
        </div>
    );
};

export default memo(TableNode);

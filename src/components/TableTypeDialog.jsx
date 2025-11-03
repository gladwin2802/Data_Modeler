import { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

/**
 * Dialog component for selecting table type when creating a new table
 */
const TableTypeDialog = ({ onConfirm, onCancel }) => {
    const [selectedType, setSelectedType] = useState("BASE");

    const tableTypes = [
        {
            value: "BASE",
            label: "Base Table",
            description: "Source or base data table",
            color: "rgba(107, 114, 128, 0.1)",
            borderColor: "#6b7280",
            hoverColor: "rgba(107, 114, 128, 0.2)",
        },
        {
            value: "CTE",
            label: "CTE (Common Table Expression)",
            description: "Calculated or intermediate table",
            color: "rgba(139, 92, 246, 0.1)",
            borderColor: "#a855f7",
            hoverColor: "rgba(139, 92, 246, 0.2)",
        },
        {
            value: "VIEW",
            label: "View",
            description: "Final output or aggregated view",
            color: "rgba(16, 185, 129, 0.1)",
            borderColor: "#10b981",
            hoverColor: "rgba(16, 185, 129, 0.2)",
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onConfirm(selectedType);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                borderRadius: 16,
                padding: "28px",
                minWidth: "500px",
                maxWidth: "600px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(229, 231, 235, 0.5)",
            }}
        >
            <h2
                style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1f2937",
                }}
            >
                Select Table Type
            </h2>
            <p
                style={{
                    margin: 0,
                    marginBottom: 20,
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.5,
                }}
            >
                Choose the type of table you want to create.
            </p>

            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    {tableTypes.map((type) => (
                        <label
                            key={type.value}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                padding: 14,
                                borderRadius: 10,
                                border: `1.5px solid ${type.borderColor}`,
                                background: type.color,
                                cursor: "pointer",
                                transition: "all 200ms ease",
                                ...(selectedType === type.value && {
                                    background: type.hoverColor,
                                    border: `1.5px solid ${type.borderColor}`,
                                    boxShadow: `0 4px 12px ${type.borderColor}22`,
                                }),
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = type.hoverColor;
                                e.target.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                if (selectedType !== type.value) {
                                    e.target.style.background = type.color;
                                    e.target.style.transform = "translateY(0)";
                                }
                            }}
                        >
                            <input
                                type="radio"
                                name="tableType"
                                value={type.value}
                                checked={selectedType === type.value}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{
                                    marginTop: 2,
                                    cursor: "pointer",
                                }}
                            />
                            <div
                                style={{
                                    flex: 1,
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: "#1f2937",
                                        marginBottom: 4,
                                    }}
                                >
                                    {type.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#6b7280",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {type.description}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                            padding: "10px 18px",
                            background: "rgba(229, 231, 235, 0.5)",
                            color: "#6b7280",
                            border: "1px solid rgba(209, 213, 219, 0.5)",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                            transition: "all 200ms ease",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "rgba(229, 231, 235, 0.7)";
                            e.target.style.borderColor = "rgba(209, 213, 219, 0.7)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "rgba(229, 231, 235, 0.5)";
                            e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
                        }}
                    >
                        <FiX size={16} />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: "10px 18px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "#fff",
                            border: "1px solid rgba(59, 130, 246, 0.5)",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                            transition: "all 200ms ease",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
                            e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                            e.target.style.transform = "translateY(0)";
                        }}
                    >
                        <FiCheck size={16} />
                        Create Table
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TableTypeDialog;

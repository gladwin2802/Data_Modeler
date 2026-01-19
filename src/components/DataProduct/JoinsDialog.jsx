import { FiX } from "react-icons/fi";

const JoinsDialog = ({ 
    joins, 
    tableName,
    onClose
}) => {
    const getJoinTypeColor = (joinType) => {
        switch (joinType?.toUpperCase()) {
            case 'INNER':
                return { bg: '#dbeafe', text: '#0369a1', label: 'INNER' };
            case 'LEFT':
                return { bg: '#dcfce7', text: '#15803d', label: 'LEFT' };
            case 'RIGHT':
                return { bg: '#fef3c7', text: '#b45309', label: 'RIGHT' };
            case 'FULL':
                return { bg: '#f3e8ff', text: '#7e22ce', label: 'FULL' };
            default:
                return { bg: '#f3f4f6', text: '#6b7280', label: joinType };
        }
    };

    const getTableName = (tableId) => {
        if (!tableId) return '';
        const parts = tableId.split('_');
        return parts.slice(1).join('_');
    };

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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
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
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                    maxWidth: "600px",
                    width: "90%",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 1001,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1f2937",
                        }}>
                            Joins for {tableName}
                        </h2>
                        <p style={{
                            margin: "4px 0 0 0",
                            fontSize: "12px",
                            color: "#6b7280",
                        }}>
                            {joins.length} join{joins.length !== 1 ? 's' : ''} configured
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6b7280",
                            fontSize: "20px",
                        }}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "20px",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {joins.map((join, idx) => {
                            const joinTypeColor = getJoinTypeColor(join.type);
                            
                            // Parse FROM field
                            const fromFullRef = join.from?.field || '';
                            const fromParts = fromFullRef.split('.');
                            const fromEntity = fromParts[0];
                            const fromField = fromParts.slice(1).join('.');
                            
                            // Parse TO field
                            const toFullRef = join.to?.field || '';
                            const toParts = toFullRef.split('.');
                            const toEntity = toParts[0];
                            const toField = toParts.slice(1).join('.');

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        background: "#f9fafb",
                                    }}
                                >
                                    {/* Join Type Badge */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "12px",
                                    }}>
                                        <span
                                            style={{
                                                background: joinTypeColor.bg,
                                                color: joinTypeColor.text,
                                                padding: "4px 12px",
                                                borderRadius: "6px",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {joinTypeColor.label} JOIN
                                        </span>
                                        <span style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                        }}>
                                            Join condition {idx + 1}
                                        </span>
                                    </div>

                                    {/* FROM Section */}
                                    <div style={{
                                        marginBottom: "12px",
                                    }}>
                                        <label style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            display: "block",
                                            marginBottom: "6px",
                                        }}>
                                            FROM
                                        </label>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}>
                                            <div style={{
                                                flex: 1,
                                                background: "white",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                padding: "10px",
                                                fontSize: "12px",
                                                color: "#374151",
                                                fontWeight: 600,
                                            }}>
                                                {fromEntity}
                                            </div>
                                            <div style={{
                                                fontSize: "30px",
                                                color: "#0c0c0c",
                                                fontWeight: 300,
                                            }}>
                                                .
                                            </div>
                                            <div style={{
                                                flex: 1,
                                                background: "white",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                padding: "10px",
                                                fontSize: "12px",
                                                color: "#3b82f6",
                                                fontWeight: 500,
                                            }}>
                                                {fromField}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div style={{
                                        textAlign: "center",
                                        marginBottom: "12px",
                                        fontSize: "16px",
                                        color: "#d1d5db",
                                    }}>
                                        ↓
                                    </div>

                                    {/* TO Section */}
                                    <div>
                                        <label style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            display: "block",
                                            marginBottom: "6px",
                                        }}>
                                            TO
                                        </label>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}>
                                            <div style={{
                                                flex: 1,
                                                background: "white",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                padding: "10px",
                                                fontSize: "12px",
                                                color: "#374151",
                                                fontWeight: 600,
                                            }}>
                                                {toEntity}
                                            </div>
                                            <div style={{
                                                fontSize: "16px",
                                                color: "#d1d5db",
                                                fontWeight: 300,
                                            }}>
                                                .
                                            </div>
                                            <div style={{
                                                flex: 1,
                                                background: "white",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                padding: "10px",
                                                fontSize: "12px",
                                                color: "#10b981",
                                                fontWeight: 500,
                                            }}>
                                                {toField}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderTop: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            background: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#374151",
                            cursor: "pointer",
                            transition: "all 200ms ease",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#f3f4f6";
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
};

export default JoinsDialog;

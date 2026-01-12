import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const ReverseDepsDialog = ({ 
    reverseDeps, 
    selectedEntity,
    onAddEntity, 
    onClose
}) => {
    const [expandedEntities, setExpandedEntities] = useState(new Set());

    const toggleExpanded = (entityName, e) => {
        e.stopPropagation();
        setExpandedEntities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entityName)) {
                newSet.delete(entityName);
            } else {
                newSet.add(entityName);
            }
            return newSet;
        });
    };

    const isExpanded = (entityName) => expandedEntities.has(entityName);

    const renderEntityCard = (entity) => {
        const expanded = isExpanded(entity.entityName);

        return (
            <div
                key={entity.entityName}
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#f9fafb",
                    transition: "all 200ms ease",
                }}
            >
                <div 
                    onClick={() => onAddEntity(entity)}
                    style={{
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.parentElement.style.background = "#f3f4f6";
                        e.currentTarget.parentElement.style.borderColor = "#d1d5db";
                        e.currentTarget.parentElement.style.transform = "translateY(-2px)";
                        e.currentTarget.parentElement.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.parentElement.style.background = "#f9fafb";
                        e.currentTarget.parentElement.style.borderColor = "#e5e7eb";
                        e.currentTarget.parentElement.style.transform = "translateY(0)";
                        e.currentTarget.parentElement.style.boxShadow = "none";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                                    {entity.alias || entity.entityName}
                                </span>
                                <span style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    background: entity.entityType === 'CTE' ? "#f3e8ff" : "#d1fae5",
                                    color: entity.entityType === 'CTE' ? "#6b21a8" : "#065f46",
                                    fontWeight: 600
                                }}>
                                    {entity.entityType}
                                </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                                {entity.entityName}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}>
                        <strong>Source:</strong> {entity.sourceFile}
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}>
                        <strong>Required by:</strong>{" "}
                        <span style={{
                            background: selectedEntity.tableType === 'CTE' ? "#f3e8ff" : "#d1fae5",
                            color: selectedEntity.tableType === 'CTE' ? "#6b21a8" : "#065f46",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 500,
                        }}>
                            {selectedEntity.tableName}
                        </span>
                    </div>
                    
                    {entity.connectionCount > 0 && (
                        <div style={{ fontSize: "13px", color: "#1e40af", marginBottom: "8px" }}>
                            <strong>Will create {entity.connectionCount} connection{entity.connectionCount !== 1 ? 's' : ''}</strong>
                        </div>
                    )}
                </div>
                
                {entity.connectionCount > 0 && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                        <button
                            onClick={(e) => toggleExpanded(entity.entityName, e)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                width: "100%",
                                padding: "8px 12px",
                                background: expanded ? "#eff6ff" : "white",
                                border: "1px solid #bfdbfe",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1e40af",
                                transition: "all 200ms ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#dbeafe";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = expanded ? "#eff6ff" : "white";
                            }}
                        >
                            {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            <span>{expanded ? 'Hide' : 'Show'} Connection Details</span>
                        </button>
                        
                        {expanded && entity.dependencyMap && (
                            <div style={{ 
                                fontSize: "12px", 
                                marginTop: "12px", 
                                padding: "12px", 
                                background: "#eff6ff", 
                                border: "1px solid #bfdbfe", 
                                borderRadius: "6px" 
                            }}>
                                <div style={{ fontWeight: 600, color: "#1e40af", marginBottom: "8px" }}>
                                    {entity.connectionCount} Connection{entity.connectionCount !== 1 ? 's' : ''}:
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {Object.entries(entity.dependencyMap).map(([entityKey, connections]) => {
                                        const entityName = entityKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                                        return connections.map((conn, i) => (
                                            <div key={`${entityKey}-${i}`} style={{
                                                fontSize: "11px",
                                                color: "#374151",
                                                padding: "6px 8px",
                                                background: conn.connectionType === 'calculation' ? '#f3e8ff' : '#e0f2fe',
                                                borderRadius: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}>
                                                <span style={{ fontWeight: 600 }}>{entityName}.{conn.sourceField}</span>
                                                <span style={{ color: conn.connectionType === 'calculation' ? '#8b5cf6' : '#3b82f6', fontSize: "14px" }}>→</span>
                                                <span style={{ fontWeight: 600 }}>{conn.targetField}</span>
                                                {conn.connectionType === 'calculation' && (
                                                    <span style={{
                                                        marginLeft: 'auto',
                                                        fontSize: "9px",
                                                        background: "#8b5cf6",
                                                        color: "white",
                                                        padding: "2px 6px",
                                                        borderRadius: "3px",
                                                        fontWeight: 700
                                                    }}>
                                                        CALC
                                                    </span>
                                                )}
                                            </div>
                                        ));
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
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
                    minWidth: "700px",
                    maxWidth: "900px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
                        Downstream Dependencies
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
                        ×
                    </button>
                </div>
                
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                    Found {reverseDeps.length} entit{reverseDeps.length !== 1 ? 'ies' : 'y'} that{" "}
                    <strong style={{ 
                        color: selectedEntity.tableType === 'CTE' ? "#6b21a8" : "#065f46" 
                    }}>
                        {selectedEntity.tableName}
                    </strong>{" "}depends on.
                    Click any entity to add it to your canvas with all connections!
                </p>
                
                {reverseDeps.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                        No downstream dependencies found for {selectedEntity.tableName}.
                        <br />
                        This entity does not depend on any other entities (BASE/CTE/VIEW) in the loaded data models.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {reverseDeps.map((entity) => renderEntityCard(entity))}
                    </div>
                )}
            </div>
        </>
    );
};

export default ReverseDepsDialog;


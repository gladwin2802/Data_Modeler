import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const SuggestionDialog = ({ 
    suggestions, 
    onAddSuggestion, 
    onClose,
    nodesCount 
}) => {
    const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());

    const toggleExpanded = (entityName, e) => {
        e.stopPropagation(); // Prevent card click when toggling expand
        setExpandedSuggestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entityName)) {
                newSet.delete(entityName);
            } else {
                newSet.add(entityName);
            }
            return newSet;
        });
    };

    const isExpanded = (entityName) => expandedSuggestions.has(entityName);

    const allSuggestions = suggestions.sort((a, b) => b.coveragePercent - a.coveragePercent);

    const renderSuggestionCard = (suggestion) => {
        const expanded = isExpanded(suggestion.entityName);
        const connectionCount = suggestion.dependencyMap ? 
            Object.values(suggestion.dependencyMap).reduce((sum, conns) => sum + conns.length, 0) : 0;

        return (
            <div
                key={suggestion.entityName}
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#f9fafb",
                    transition: "all 200ms ease",
                }}
            >
                <div 
                    onClick={() => onAddSuggestion(suggestion)}
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
                                    {suggestion.alias || suggestion.entityName}
                                </span>
                                <span style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    background: suggestion.entityType === 'CTE' ? "#f3e8ff" : "#d1fae5",
                                    color: suggestion.entityType === 'CTE' ? "#6b21a8" : "#065f46",
                                    fontWeight: 600
                                }}>
                                    {suggestion.entityType}
                                </span>
                                {suggestion.level === 2 && (
                                    <span style={{
                                        fontSize: "11px",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        background: "#fef3c7",
                                        color: "#92400e",
                                        fontWeight: 600
                                    }}>
                                        Level 2
                                    </span>
                                )}
                                <span style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    background: suggestion.coveragePercent === 100 ? "#d1fae5" : "#fef3c7",
                                    color: suggestion.coveragePercent === 100 ? "#065f46" : "#92400e",
                                    fontWeight: 600
                                }}>
                                    {suggestion.coveragePercent}% ready
                                </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                                {suggestion.entityName}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}>
                        <strong>Source:</strong> {suggestion.sourceFile}
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}>
                        <strong>Depends on {suggestion.referencedEntitiesCount} table{suggestion.referencedEntitiesCount !== 1 ? 's' : ''}:</strong>{" "}
                        {suggestion.matchingTables.map((table, i) => (
                            <span key={i}>
                                <span style={{
                                    background: "#dbeafe",
                                    color: "#1e40af",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    marginRight: "4px"
                                }}>
                                    {table}
                                </span>
                            </span>
                        ))}
                    </div>
                    
                    {connectionCount > 0 && (
                        <div style={{ fontSize: "13px", color: "#1e40af", marginBottom: "8px" }}>
                            <strong>Will create {connectionCount} connection{connectionCount !== 1 ? 's' : ''}</strong>
                        </div>
                    )}
                    
                    {suggestion.missingEntities && suggestion.missingEntities.length > 0 && (
                        <div style={{ fontSize: "12px", marginTop: "8px", padding: "10px", background: "#fef9e7", border: "1px solid #fde68a", borderRadius: "6px" }}>
                            <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>
                                Additional entities required:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {suggestion.missingEntities.map((entity, i) => {
                                    const bgColor = entity.type === 'BASE' ? '#dbeafe' : entity.type === 'CTE' ? '#f3e8ff' : '#d1fae5';
                                    const textColor = entity.type === 'BASE' ? '#1e40af' : entity.type === 'CTE' ? '#6b21a8' : '#065f46';
                                    return (
                                        <span key={i} style={{
                                            background: bgColor,
                                            color: textColor,
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}>
                                            <span style={{ opacity: 0.7 }}>{entity.type}</span>
                                            <span>{entity.name}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Expand button and connection details */}
                {connectionCount > 0 && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                        <button
                            onClick={(e) => toggleExpanded(suggestion.entityName, e)}
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
                        
                        {expanded && suggestion.dependencyMap && (
                            <div style={{ 
                                fontSize: "12px", 
                                marginTop: "12px", 
                                padding: "12px", 
                                background: "#eff6ff", 
                                border: "1px solid #bfdbfe", 
                                borderRadius: "6px" 
                            }}>
                                <div style={{ fontWeight: 600, color: "#1e40af", marginBottom: "8px" }}>
                                    {connectionCount} Connection{connectionCount !== 1 ? 's' : ''}:
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {Object.entries(suggestion.dependencyMap).map(([entityKey, connections]) => {
                                        const entityName = entityKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                                        return connections.map((conn, i) => (
                                            <div
                                              key={`${entityKey}-${i}`}
                                              style={{
                                                fontSize: "11px",
                                                color: "#374151",
                                                padding: "6px 8px",
                                                background: conn.connectionType === 'calculation' ? '#f3e8ff' : '#e0f2fe',
                                                borderRadius: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                position: "relative",
                                                minWidth: 0, // allow flex children to shrink
                                              }}
                                            >
                                              <span
                                                style={{
                                                  fontWeight: 600,
                                                  maxWidth: "40%",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                  minWidth: 0,
                                                  display: "inline-block",
                                                }}
                                                title={`${entityName}.${conn.sourceField}`}
                                              >
                                                {entityName}.{conn.sourceField}
                                              </span>
                                              <span style={{ color: conn.connectionType === 'calculation' ? '#8b5cf6' : '#3b82f6', fontSize: "14px" }}>→</span>
                                              <span
                                                style={{
                                                  fontWeight: 600,
                                                  maxWidth: "40%",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                  minWidth: 0,
                                                  display: "inline-block",
                                                }}
                                                title={conn.targetField}
                                              >
                                                {conn.targetField}
                                              </span>
                                              {conn.connectionType === 'calculation' && (
                                                <span
                                                  style={{
                                                    marginLeft: "auto",
                                                    fontSize: "9px",
                                                    background: "#8b5cf6",
                                                    color: "white",
                                                    padding: "2px 6px",
                                                    borderRadius: "3px",
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "50px",
                                                    textAlign: "center",
                                                  }}
                                                  title="Calculated Connection"
                                                >
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
                        Entity Suggestions
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
                    Based on your canvas tables ({nodesCount} table{nodesCount !== 1 ? 's' : ''}), 
                    here are {allSuggestions.length} derived entit{allSuggestions.length !== 1 ? 'ies' : 'y'} (CTEs/VIEWs) that can be created.
                    Click any suggestion to add it to your canvas with all connections!
                </p>
                
                {allSuggestions.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                        No entities found that can be formed from your current canvas tables.
                        <br />
                        Try adding more BASE tables from the sidebar to enable entity suggestions.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {allSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SuggestionDialog;


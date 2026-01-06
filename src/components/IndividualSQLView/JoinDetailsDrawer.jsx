import { useState, useRef, useEffect, useMemo } from "react";
import { FiX, FiLink2 } from "react-icons/fi";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import TableNode from "./TableNode/TableNode";

/**
 * Drawer component for displaying join details with visual representation
 */
const JoinDetailsDrawer = ({ selectedTable, joins, onClose, allNodes = [] }) => {
    const [drawerWidth, setDrawerWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const [selectedJoinIndex, setSelectedJoinIndex] = useState(0);
    const drawerRef = useRef(null);

    const nodeTypes = useMemo(() => ({ tableNode: TableNode }), []);

    const handleResizeStart = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleResizeMove = (e) => {
        if (!isResizing || !drawerRef.current) return;

        const drawerRect = drawerRef.current.getBoundingClientRect();
        const newWidth = drawerRect.right - e.clientX;
        if (newWidth > 400 && newWidth < 1000) {
            setDrawerWidth(newWidth);
        }
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
    };

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [isResizing]);

    // Extract table names from the join condition
    const extractTableAndField = (fieldStr) => {
        if (!fieldStr) return { table: "", field: "" };
        if (fieldStr.includes(".")) {
            const parts = fieldStr.split(".");
            return { table: parts[0], field: parts.slice(1).join(".") };
        }
        return { table: "", field: fieldStr };
    };

    // Memoize all calculations so they're always called
    const currentJoin = useMemo(() => joins?.[selectedJoinIndex] || null, [joins, selectedJoinIndex]);
    
    // Group joins by source and target tables
    const joinGroups = useMemo(() => {
        if (!joins || joins.length === 0) return [];
        
        const groups = {};
        joins.forEach((join, idx) => {
            const fromTableStr = join.from?.field || join.from?.calculation || "";
            const toTableStr = join.to?.field || join.to?.calculation || "";
            
            const fromTable = fromTableStr.includes(".") 
                ? fromTableStr.split(".")[0]
                : "";
            const toTable = toTableStr.includes(".") 
                ? toTableStr.split(".")[0]
                : "";
            
            const groupKey = `${fromTable}->${toTable}`;
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    fromTable,
                    toTable,
                    joinType: join.type,
                    joins: [],
                };
            }
            
            groups[groupKey].joins.push({ ...join, originalIndex: idx });
        });
        
        return Object.values(groups);
    }, [joins]);

    const currentGroup = useMemo(() => joinGroups?.[selectedJoinIndex] || null, [joinGroups, selectedJoinIndex]);
    
    const joinInfo = useMemo(() => {
        if (!currentGroup) return { fromInfo: {}, toInfo: {} };
        return {
            fromInfo: { table: currentGroup.fromTable },
            toInfo: { table: currentGroup.toTable },
        };
    }, [currentGroup]);

    // Find corresponding node data from allNodes
    const findNodeData = (tableName) => {
        if (!tableName || !allNodes) return null;
        
        // Try exact match first
        let match = allNodes.find((n) => n.id === tableName || n.data?.label === tableName);
        if (match) return match;
        
        // Try partial match
        match = allNodes.find((n) => n.id.includes(tableName));
        if (match) return match;
        
        // Try case-insensitive match
        const lowerName = tableName.toLowerCase();
        match = allNodes.find((n) => 
            n.id.toLowerCase().includes(lowerName) || 
            n.data?.label?.toLowerCase().includes(lowerName)
        );
        if (match) return match;
        
        return null;
    };

    const nodeDataInfo = useMemo(() => {
        const fromNodeData = findNodeData(joinInfo.fromInfo.table || selectedTable);
        const toNodeData = findNodeData(joinInfo.toInfo.table || selectedTable);
        return { fromNodeData, toNodeData };
    }, [joinInfo, selectedTable, allNodes]);

    // Create flow nodes for visualization
    const flowNodes = useMemo(() => {
        const nodes = [];
        const { fromNodeData, toNodeData } = nodeDataInfo;
        
        // Extract field names in the order they appear in join conditions
        const fromFieldOrder = [];
        const toFieldOrder = [];
        const fromFieldNamesSet = new Set();
        const toFieldNamesSet = new Set();
        
        if (currentGroup && currentGroup.joins) {
            currentGroup.joins.forEach((join) => {
                const fromFieldStr = join.from?.field || join.from?.calculation || "";
                const toFieldStr = join.to?.field || join.to?.calculation || "";
                
                // Extract just the field name (after the table name)
                if (fromFieldStr.includes(".")) {
                    const fieldName = fromFieldStr.split(".").slice(1).join(".");
                    if (!fromFieldNamesSet.has(fieldName)) {
                        fromFieldOrder.push(fieldName);
                        fromFieldNamesSet.add(fieldName);
                    }
                }
                if (toFieldStr.includes(".")) {
                    const fieldName = toFieldStr.split(".").slice(1).join(".");
                    if (!toFieldNamesSet.has(fieldName)) {
                        toFieldOrder.push(fieldName);
                        toFieldNamesSet.add(fieldName);
                    }
                }
            });
        }
        
        if (fromNodeData) {
            // Filter and sort fields to match join order
            const filteredFields = (fromNodeData.data?.fields || []).filter((field) => 
                fromFieldNamesSet.has(field.name) || fromFieldNamesSet.has(field.label)
            );
            
            // Sort fields by their order in the join conditions
            const sortedFields = filteredFields.sort((a, b) => {
                const aIdx = fromFieldOrder.indexOf(a.name || a.label);
                const bIdx = fromFieldOrder.indexOf(b.name || b.label);
                return aIdx - bIdx;
            });
            
            nodes.push({
                id: `join-from-${selectedJoinIndex}`,
                data: {
                    ...fromNodeData.data,
                    label: fromNodeData.data?.label || joinInfo.fromInfo.table || selectedTable,
                    nodeId: `join-from-${selectedJoinIndex}`,
                    tableType: fromNodeData.data?.tableType || "BASE",
                    isEditing: false,
                    selectedField: null,
                    fields: sortedFields.length > 0 ? sortedFields : fromNodeData.data?.fields || [],
                },
                position: { x: 0, y: 0 },
                type: "tableNode",
            });
        }

        if (toNodeData) {
            // Only skip if it's actually the same node
            const isSameNode = fromNodeData && 
                (toNodeData.id === fromNodeData.id || 
                 toNodeData.data?.label === fromNodeData.data?.label);
            
            if (!isSameNode) {
                // Filter and sort fields to match join order
                const filteredFields = (toNodeData.data?.fields || []).filter((field) => 
                    toFieldNamesSet.has(field.name) || toFieldNamesSet.has(field.label)
                );
                
                // Sort fields by their order in the join conditions
                const sortedFields = filteredFields.sort((a, b) => {
                    const aIdx = toFieldOrder.indexOf(a.name || a.label);
                    const bIdx = toFieldOrder.indexOf(b.name || b.label);
                    return aIdx - bIdx;
                });
                
                nodes.push({
                    id: `join-to-${selectedJoinIndex}`,
                    data: {
                        ...toNodeData.data,
                        label: toNodeData.data?.label || joinInfo.toInfo.table,
                        nodeId: `join-to-${selectedJoinIndex}`,
                        tableType: toNodeData.data?.tableType || "BASE",
                        isEditing: false,
                        selectedField: null,
                        fields: sortedFields.length > 0 ? sortedFields : toNodeData.data?.fields || [],
                    },
                    position: { x: 400, y: 0 },
                    type: "tableNode",
                });
            }
        }

        return nodes;
    }, [selectedJoinIndex, nodeDataInfo, joinInfo, selectedTable, currentGroup]);

    // Create flow edges
    const flowEdges = useMemo(() => {
        if (flowNodes.length < 2 || !currentGroup) return [];

        const edges = [];
        const joinType = (currentGroup.joinType || "INNER").toUpperCase();
        let edgeColor = "#4b5563";

        switch (joinType) {
            case "INNER":
                edgeColor = "#16a34a";
                break;
            case "LEFT":
                edgeColor = "#0284c7";
                break;
            case "RIGHT":
                edgeColor = "#db2777";
                break;
            case "FULL":
                edgeColor = "#9333ea";
                break;
            default:
                edgeColor = "#6b7280";
        }

        // Create edges for ALL joins in the group to show all field connections
        if (currentGroup.joins && currentGroup.joins.length > 0) {
            currentGroup.joins.forEach((join, joinIdx) => {
                const fromTableId = `join-from-${selectedJoinIndex}`;
                const toTableId = `join-to-${selectedJoinIndex}`;

                // Extract field names from join conditions
                const fromFieldStr = join.from?.field || join.from?.calculation || "";
                const toFieldStr = join.to?.field || join.to?.calculation || "";

                // Get just the field name (after the dot)
                const fromFieldName = fromFieldStr.includes(".") 
                    ? fromFieldStr.split(".").slice(1).join(".")
                    : fromFieldStr;
                const toFieldName = toFieldStr.includes(".") 
                    ? toFieldStr.split(".").slice(1).join(".")
                    : toFieldStr;

                if (fromFieldName && toFieldName) {
                    // Calculate offset for multiple edges to avoid overlap
                    const totalConditions = currentGroup.joins.length;
                    const offset = totalConditions > 1 ? (joinIdx - (totalConditions - 1) / 2) * 30 : 0;
                    
                    edges.push({
                        id: `join-field-edge-${selectedJoinIndex}-${joinIdx}`,
                        source: fromTableId,
                        sourceHandle: `${fromTableId}-${fromFieldName}`,
                        target: toTableId,
                        targetHandle: `${toTableId}-${toFieldName}`,
                        animated: true,
                        style: {
                            strokeWidth: 2,
                            stroke: edgeColor,
                        },
                        // Removed label and labelStyle to hide condition labels
                        data: {
                            offset: offset,
                        },
                        markerEnd: {
                            type: "arrowclosed",
                            color: edgeColor,
                        },
                    });
                }
            });
        }

        return edges;
    }, [flowNodes, selectedJoinIndex, currentGroup]);

    const getJoinTypeColor = (type) => {
        switch (type?.toUpperCase()) {
            case "INNER":
                return { bg: "#dcfce7", border: "#16a34a", text: "#166534" };
            case "LEFT":
                return { bg: "#dbeafe", border: "#0284c7", text: "#0c4a6e" };
            case "RIGHT":
                return { bg: "#fce7f3", border: "#db2777", text: "#831843" };
            case "FULL":
                return { bg: "#f3e8ff", border: "#9333ea", text: "#581c87" };
            default:
                return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
        }
    };

    const renderJoinCondition = (join) => {
        const fromField = join.from?.field || join.from?.calculation || "N/A";
        const toField = join.to?.field || join.to?.calculation || "N/A";
        return { fromField, toField };
    };

    // Early return if no data
    if (!selectedTable || !joins || joins.length === 0 || !currentGroup) {
        return null;
    }

    const colors = getJoinTypeColor(currentGroup.joinType);
    
    // Get all join conditions in the current group
    const groupJoinConditions = currentGroup.joins.map((join) => {
        const fromField = join.from?.field || join.from?.calculation || "N/A";
        const toField = join.to?.field || join.to?.calculation || "N/A";
        return { fromField, toField };
    });

    return (
        <div
            ref={drawerRef}
            style={{
                width: `${drawerWidth}px`,
                background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                borderLeft: "2px solid #e5e7eb",
                boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
                padding: "24px",
                overflowY: "auto",
                transition: isResizing ? "none" : "transform 300ms ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                maxHeight: "100vh",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    paddingBottom: "18px",
                    borderBottom: "2px solid #e5e7eb",
                }}
            >
                <h3 style={{ 
                    margin: 0, 
                    color: "#111827",
                    fontSize: "20px",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}>
                    <FiLink2 size={20} />
                    Join Details
                </h3>
                <div style={{ position: "relative" }}>
                    <button
                        onClick={onClose}
                        style={{ 
                            cursor: "pointer",
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            fontSize: "16px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 150ms ease",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#dc2626";
                            e.target.style.transform = "scale(1.1) rotate(90deg)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#ef4444";
                            e.target.style.transform = "scale(1) rotate(0deg)";
                        }}
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            {/* Join Navigation */}
            {joinGroups.length > 1 && (
                <div style={{
                    marginBottom: "16px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                }}>
                    <button
                        onClick={() => setSelectedJoinIndex(Math.max(0, selectedJoinIndex - 1))}
                        disabled={selectedJoinIndex === 0}
                        style={{
                            padding: "6px 12px",
                            background: selectedJoinIndex === 0 ? "#e5e7eb" : "#3b82f6",
                            color: selectedJoinIndex === 0 ? "#9ca3af" : "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: selectedJoinIndex === 0 ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "12px",
                        }}
                    >
                        ← Previous
                    </button>
                    <div style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#6b7280",
                    }}>
                        Group {selectedJoinIndex + 1} of {joinGroups.length}
                    </div>
                    <button
                        onClick={() => setSelectedJoinIndex(Math.min(joinGroups.length - 1, selectedJoinIndex + 1))}
                        disabled={selectedJoinIndex === joinGroups.length - 1}
                        style={{
                            padding: "6px 12px",
                            background: selectedJoinIndex === joinGroups.length - 1 ? "#e5e7eb" : "#3b82f6",
                            color: selectedJoinIndex === joinGroups.length - 1 ? "#9ca3af" : "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: selectedJoinIndex === joinGroups.length - 1 ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "12px",
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* ReactFlow Canvas */}
            {flowNodes.length > 0 && (
                <div style={{
                    flex: 1,
                    marginBottom: "16px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                    minHeight: "350px",
                    background: "#fff",
                }}>
                    <ReactFlow
                        nodes={flowNodes}
                        edges={flowEdges}
                        nodeTypes={nodeTypes}
                        minZoom={0.3}
                        maxZoom={1.5}
                        defaultEdgeOptions={{
                            animated: true,
                        }}
                        fitView
                    >
                        <Background gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>
            )}

            {/* Summary */}
            {flowNodes.length > 0 && (
                <div style={{
                    padding: "12px 16px",
                    background: "#f3f4f6",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    marginBottom: "16px",
                }}>
                    <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                    }}>
                        <span style={{ fontWeight: 600 }}>Connection Summary:</span> {currentGroup.joins.length} field{currentGroup.joins.length !== 1 ? 's' : ''} connected with <span style={{ color: colors.border, fontWeight: 600 }}>{currentGroup.joinType?.toUpperCase() || "INNER"}</span> join
                    </div>
                </div>
            )}

            {/* Join Condition Details */}
            <div style={{
                padding: "16px",
                background: colors.bg,
                borderRadius: 10,
                border: `2px solid ${colors.border}`,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            }}>
                {/* Join Type Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px" }}>
                    <span
                        style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            background: colors.border,
                            color: "#fff",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {currentGroup.joinType?.toUpperCase() || "INNER"}
                    </span>
                    <span style={{ fontSize: "12px", color: colors.text, fontWeight: 500 }}>
                        Join Conditions ({groupJoinConditions.length})
                    </span>
                </div>

                {/* Display all join conditions in the group */}
                {groupJoinConditions.map((condition, idx) => {
                    // Get the actual join object to access calculation
                    const actualJoin = currentGroup.joins?.[idx];
                    const fromCalculation = actualJoin?.from?.calculation;
                    const toCalculation = actualJoin?.to?.calculation;
                    
                    return (
                    <div key={idx} style={{ marginBottom: idx < groupJoinConditions.length - 1 ? "16px" : 0 }}>
                        {/* Condition number */}
                        <div style={{ fontSize: "11px", fontWeight: 700, color: colors.text, marginBottom: "8px" }}>
                            Condition {idx + 1}
                        </div>

                        {/* From Condition */}
                        <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 600, color: colors.text, marginBottom: "3px" }}>
                                FROM
                            </div>
                            <div
                                style={{
                                    padding: "6px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    border: `1px solid ${colors.border}`,
                                    fontSize: "11px",
                                    fontFamily: "'Fira Code', 'Courier New', monospace",
                                    color: "#374151",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                    cursor: fromCalculation ? "help" : "default",
                                    position: "relative",
                                }}
                                title={fromCalculation ? `Calculation: ${fromCalculation}` : condition.fromField}
                            >
                                {condition.fromField}
                                {fromCalculation && (
                                    <div style={{
                                        fontSize: "9px",
                                        color: "#6b7280",
                                        marginTop: "4px",
                                        paddingTop: "4px",
                                        borderTop: "1px solid #e5e7eb",
                                        fontStyle: "italic",
                                    }}>
                                        📝 Has calculation
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div style={{ textAlign: "center", margin: "4px 0", fontSize: "10px", color: colors.text, fontWeight: 600 }}>
                            ↓
                        </div>

                        {/* To Condition */}
                        <div>
                            <div style={{ fontSize: "10px", fontWeight: 600, color: colors.text, marginBottom: "3px" }}>
                                TO
                            </div>
                            <div
                                style={{
                                    padding: "6px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    border: `1px solid ${colors.border}`,
                                    fontSize: "11px",
                                    fontFamily: "'Fira Code', 'Courier New', monospace",
                                    color: "#374151",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                    cursor: toCalculation ? "help" : "default",
                                    position: "relative",
                                }}
                                title={toCalculation ? `Calculation: ${toCalculation}` : condition.toField}
                            >
                                {condition.toField}
                                {toCalculation && (
                                    <div style={{
                                        fontSize: "9px",
                                        color: "#6b7280",
                                        marginTop: "4px",
                                        paddingTop: "4px",
                                        borderTop: "1px solid #e5e7eb",
                                        fontStyle: "italic",
                                    }}>
                                        📝 Has calculation
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider between conditions */}
                        {idx < groupJoinConditions.length - 1 && (
                            <div style={{ margin: "12px 0", borderTop: "1px dashed #d1d5db" }} />
                        )}
                    </div>
                    );
                })}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeStart}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "4px",
                    height: "100%",
                    cursor: "col-resize",
                    backgroundColor: isResizing ? "#10b981" : "#d1d5db",
                    transition: "backgroundColor 150ms ease",
                    userSelect: "none",
                }}
                onMouseEnter={(e) => {
                    if (!isResizing) e.target.style.backgroundColor = "#10b981";
                }}
                onMouseLeave={(e) => {
                    if (!isResizing) e.target.style.backgroundColor = "#d1d5db";
                }}
            />
        </div>
    );
};

export default JoinDetailsDrawer;

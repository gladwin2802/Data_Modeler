import { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useReactFlow,
} from "reactflow";
import TableNode from "./components/TableNode/TableNode";
import EdgeConfigDialog from "./components/EdgeConfigDialog";
import TableTypeDialog from "./components/TableTypeDialog";
import FlowHeader from "./components/FlowHeader";
import EdgeContextMenu from "./components/EdgeContextMenu";
import FieldDrawer from "./components/FieldDrawer";
import { useFlowState } from "./hooks/useFlowState";
import { useNodeHandlers } from "./hooks/useNodeHandlers";
import { useEdgeHandlers } from "./hooks/useEdgeHandlers";
import { useEdgeFiltering } from "./hooks/useEdgeFiltering";
import { useFieldHighlighting } from "./hooks/useFieldHighlighting";
import { useNodeDecoration } from "./hooks/useNodeDecoration";
import { applyLayout } from "./utils/layout";
import { flowToModel } from "./utils/flowToModel";
import "reactflow/dist/style.css";
import "./index.css";

const nodeTypes = { tableNode: TableNode };

// Inner component to access ReactFlow instance for fitView
function FitViewHelper({ onFitView, onCenterNode }) {
    const { fitView, getNode, setCenter, getZoom } = useReactFlow();

    useEffect(() => {
        // Fit view when nodes are ready
        const timer = setTimeout(() => {
            fitView({ padding: 0.1, duration: 0 });
        }, 100);
        return () => clearTimeout(timer);
    }, [fitView]);

    // Expose fitView to parent
    useEffect(() => {
        if (onFitView) {
            onFitView(() => {
                fitView({ padding: 0.1, duration: 300 });
            });
        }
    }, [fitView]); // eslint-disable-line react-hooks/exhaustive-deps

    // Expose centerNode function to parent
    useEffect(() => {
        if (onCenterNode) {
            onCenterNode((nodeId, position) => {
                // Try to get the node from ReactFlow
                const node = getNode(nodeId);
                if (node) {
                    // Calculate center position accounting for zoom
                    const zoom = getZoom();
                    const nodeWidth = 380; // Width of the node
                    const nodeHeight = 200; // Approximate height of the node
                    const centerX = node.position.x + nodeWidth / 2;
                    const centerY = node.position.y + nodeHeight / 2;

                    // Set center to the node's center position
                    setCenter(centerX, centerY, { duration: 400, zoom });
                } else if (position) {
                    // Fallback to provided position if node not found yet
                    const nodeWidth = 380;
                    const nodeHeight = 200;
                    const centerX = position.x + nodeWidth / 2;
                    const centerY = position.y + nodeHeight / 2;
                    setCenter(centerX, centerY, { duration: 400 });
                }
            });
        }
    }, [getNode, setCenter, getZoom]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

export default function App() {
    // Flow state management
    const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange } =
        useFlowState();

    // UI state
    const [editingNode, setEditingNode] = useState(null);
    const [editingLabels, setEditingLabels] = useState({});
    const [editingAliases, setEditingAliases] = useState({});
    const [edgeConfigDialog, setEdgeConfigDialog] = useState(null);
    const [edgeContextMenu, setEdgeContextMenu] = useState(null);
    const [tableTypeDialog, setTableTypeDialog] = useState(false);

    // Layout always uses LR direction

    // Filter toggles
    const [showNormalRefs, setShowNormalRefs] = useState(true);
    const [showCalcRefs, setShowCalcRefs] = useState(true);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);

    // Link direction for highlighting
    const [linkDirection, setLinkDirection] = useState("upstream");

    // Field highlighting
    const {
        highlightedEdges,
        selectedField,
        handleFieldClick,
        setSelectedField,
        setHighlightedEdges,
        clearHighlighting,
    } = useFieldHighlighting(edges, linkDirection);

    // Clear highlighting when link direction changes
    useEffect(() => {
        clearHighlighting();
    }, [linkDirection, clearHighlighting]);

    // Node handlers
    const {
        handleAddField,
        handleUpdateNodeLabel,
        handleUpdateNodeAlias,
        handleUpdateFieldName,
        handleDeleteField,
        handleUpdateFieldCalculation,
        handleAddNewTable,
        handleDeleteTable,
    } = useNodeHandlers(
        nodes,
        edges,
        setNodes,
        setEdges,
        setEditingNode,
        setEditingLabels,
        setEditingAliases
    );

    // Edge handlers
    const { handleEdgeConfigConfirm, handleDeleteEdge, handleDeleteFieldRef } =
        useEdgeHandlers(nodes, edges, setNodes, setEdges);

    // Node decoration handlers
    const handleLabelChange = useCallback((nodeId, value) => {
        setEditingLabels((prev) => ({ ...prev, [nodeId]: value }));
    }, []);

    const handleAliasChange = useCallback((nodeId, value) => {
        setEditingAliases((prev) => ({ ...prev, [nodeId]: value }));
    }, []);

    const handleEditClick = useCallback((nodeId, nodeData) => {
        setEditingNode((prev) => {
            if (prev === nodeId) {
                // Exiting edit mode
                setEditingLabels((labels) => {
                    const updated = { ...labels };
                    delete updated[nodeId];
                    return updated;
                });
                setEditingAliases((aliases) => {
                    const updated = { ...aliases };
                    delete updated[nodeId];
                    return updated;
                });
                return null;
            }
            // Entering edit mode
            setEditingLabels((prev) => ({
                ...prev,
                [nodeId]: nodeData.label,
            }));
            setEditingAliases((prev) => ({
                ...prev,
                [nodeId]: nodeData.alias ?? "",
            }));
            return nodeId;
        });
    }, []);

    // Node decoration
    const decoratedNodes = useNodeDecoration(
        nodes,
        edges,
        selectedField,
        editingNode,
        editingLabels,
        editingAliases,
        handleFieldClick,
        handleAddField,
        handleUpdateNodeLabel,
        handleUpdateNodeAlias,
        handleUpdateFieldName,
        handleDeleteField,
        handleUpdateFieldCalculation,
        handleDeleteFieldRef,
        handleLabelChange,
        handleAliasChange,
        handleEditClick,
        handleDeleteTable
    );

    // Edge filtering
    const decoratedEdges = useEdgeFiltering(
        edges,
        highlightedEdges,
        showNormalRefs,
        showCalcRefs,
        showOnlyHighlighted
    );

    // Fit view ref
    const fitViewRef = useRef(null);
    const centerNodeRef = useRef(null);

    // Stable callback for fitView ref
    const setFitViewRef = useCallback((fn) => {
        fitViewRef.current = fn;
    }, []);

    // Stable callback for centerNode ref
    const setCenterNodeRef = useCallback((fn) => {
        centerNodeRef.current = fn;
    }, []);

    // Layout handler - always use dagre layout with LR direction
    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
            nodes,
            edges,
            "dagre",
            "LR"
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        // Fit view after layout
        setTimeout(() => {
            if (fitViewRef.current) {
                fitViewRef.current();
            }
        }, 100);
    }, [nodes, edges, setNodes, setEdges]);

    // Export handler - convert flow to JSON and download
    const onExport = useCallback(() => {
        const model = flowToModel(nodes, edges);
        const jsonString = JSON.stringify(model, null, 2);

        // Create a blob and download it
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "data_model.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [nodes, edges]);

    // Auto-arrange on mount
    useEffect(() => {
        onLayout();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Edge connection handler
    const onConnect = useCallback((params) => {
        setEdgeConfigDialog({
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
        });
    }, []);

    // Edge context menu handler
    const onEdgeContextMenu = useCallback((event, edge) => {
        event.preventDefault();
        setEdgeContextMenu({
            edge,
            x: event.clientX,
            y: event.clientY,
        });
    }, []);

    // Disable browser context menu on background/pane
    const onPaneContextMenu = useCallback((event) => {
        event.preventDefault();
    }, []);

    // Edge config confirm handler wrapper
    const handleEdgeConfigConfirmWrapper = useCallback(
        (edgeType, calcExpr) => {
            const result = handleEdgeConfigConfirm(
                edgeType,
                calcExpr,
                !!edgeConfigDialog?.existingEdgeId,
                edgeConfigDialog?.existingEdgeId,
                edgeConfigDialog,
                edgeContextMenu
            );
            if (result?.shouldCloseDialog) {
                setEdgeConfigDialog(null);
            }
            if (result?.shouldCloseMenu) {
                setEdgeContextMenu(null);
            }
        },
        [handleEdgeConfigConfirm, edgeConfigDialog, edgeContextMenu]
    );

    // Edit edge handler
    const handleEditEdge = useCallback(
        (edge) => {
            const targetFieldName = edge.targetHandle.replace(
                `${edge.target}-`,
                ""
            );
            const targetNode = nodes.find((n) => n.id === edge.target);
            const targetField = targetNode?.data.fields.find(
                (f) => f.name === targetFieldName
            );
            const calculationExpression =
                targetField?.calculation?.expression || "";

            setEdgeConfigDialog({
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                existingEdgeId: edge.id,
                existingEdgeType: edge.ref_type,
                existingCalculationExpression: calculationExpression,
            });
            setEdgeContextMenu(null);
        },
        [nodes]
    );

    // Delete edge handler wrapper
    const handleDeleteEdgeWrapper = useCallback(
        (edgeId) => {
            const result = handleDeleteEdge(edgeId);
            if (result?.shouldCloseMenu) {
                setEdgeContextMenu(null);
            }
        },
        [handleDeleteEdge]
    );

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "row",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                overflow: "hidden",
            }}
        >
            {/* Main Graph Section */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <FlowHeader
                    onLayout={onLayout}
                    onAddNewTable={() => setTableTypeDialog(true)}
                    onExport={onExport}
                    showNormalRefs={showNormalRefs}
                    showCalcRefs={showCalcRefs}
                    showOnlyHighlighted={showOnlyHighlighted}
                    onToggleNormalRefs={() => setShowNormalRefs((v) => !v)}
                    onToggleCalcRefs={() => setShowCalcRefs((v) => !v)}
                    onToggleOnlyHighlighted={() =>
                        setShowOnlyHighlighted((v) => !v)
                    }
                    linkDirection={linkDirection}
                    onLinkDirectionChange={setLinkDirection}
                />

                <ReactFlow
                    nodes={decoratedNodes}
                    edges={decoratedEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeContextMenu={onEdgeContextMenu}
                    onPaneContextMenu={onPaneContextMenu}
                    nodeTypes={nodeTypes}
                    minZoom={0.05}
                    maxZoom={4}
                    connectionLineType="step"
                    defaultEdgeOptions={{
                        type: "step", // Use step for better edge separation
                        animated: false,
                        style: {
                            strokeWidth: 3, // Thicker for visibility
                        },
                        pathOptions: {
                            offset: 10, // Better separation between parallel edges
                            borderRadius: 10,
                        },
                    }}
                    // Improve edge routing to avoid congestion
                    snapToGrid={false}
                    snapGrid={[20, 20]}
                    // Better edge rendering
                    edgeUpdaterRadius={10}
                    connectionRadius={20}
                >
                    <FitViewHelper
                        onFitView={setFitViewRef}
                        onCenterNode={setCenterNodeRef}
                    />
                    <MiniMap />
                    <Controls />
                    <Background gap={16} />
                </ReactFlow>
            </div>

            {/* Edge Configuration Dialog */}
            {edgeConfigDialog && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        animation: "fadeIn 200ms ease",
                    }}
                    onClick={() => setEdgeConfigDialog(null)}
                >
                    <EdgeConfigDialog
                        source={edgeConfigDialog.source}
                        target={edgeConfigDialog.target}
                        sourceHandle={edgeConfigDialog.sourceHandle}
                        targetHandle={edgeConfigDialog.targetHandle}
                        onConfirm={handleEdgeConfigConfirmWrapper}
                        onCancel={() => setEdgeConfigDialog(null)}
                        initialEdgeType={edgeConfigDialog.existingEdgeType}
                        initialCalculationExpression={
                            edgeConfigDialog.existingCalculationExpression
                        }
                    />
                </div>
            )}

            {/* Table Type Selection Dialog */}
            {tableTypeDialog && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        animation: "fadeIn 200ms ease",
                    }}
                    onClick={() => setTableTypeDialog(false)}
                >
                    <TableTypeDialog
                        onConfirm={(tableType) => {
                            const newTableInfo = handleAddNewTable(tableType);
                            if (newTableInfo && centerNodeRef.current) {
                                // Use setTimeout to ensure node is rendered before navigating
                                setTimeout(() => {
                                    centerNodeRef.current(
                                        newTableInfo.nodeId,
                                        newTableInfo.position
                                    );
                                }, 100);
                            }
                            setTableTypeDialog(false);
                        }}
                        onCancel={() => setTableTypeDialog(false)}
                    />
                </div>
            )}

            {/* Edge Context Menu */}
            {edgeContextMenu && (
                <EdgeContextMenu
                    edge={edgeContextMenu.edge}
                    position={{
                        x: edgeContextMenu.x,
                        y: edgeContextMenu.y,
                    }}
                    onEdit={() => handleEditEdge(edgeContextMenu.edge)}
                    onDelete={() =>
                        handleDeleteEdgeWrapper(edgeContextMenu.edge.id)
                    }
                    onClose={() => setEdgeContextMenu(null)}
                />
            )}

            {/* Field Drawer */}
            <FieldDrawer
                selectedField={selectedField}
                onClose={() => {
                    setSelectedField(null);
                    setHighlightedEdges(new Set());
                }}
            />
        </div>
    );
}

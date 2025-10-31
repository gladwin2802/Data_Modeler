import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import dagre from "dagre";
import TableNode from "./TableNode";
import { modelToFlow } from "./data";
import "reactflow/dist/style.css";
import "./index.css";

const nodeTypes = { tableNode: TableNode };

const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120,
    ranksep: 200,
  });

  nodes.forEach((n) => {
    const fieldRows = n.data.fields?.length ?? 0;
    const height = 60 + fieldRows * 22;
    dagreGraph.setNode(n.id, { width: 300, height });
  });
  edges.forEach((e) => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((n) => {
      const pos = dagreGraph.node(n.id);
      return {
        ...n,
        position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
      };
    }),
    edges,
  };
};

export default function App() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => modelToFlow(), []);
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [highlightedEdges, setHighlightedEdges] = useState(new Set());
  const [selectedField, setSelectedField] = useState(null);

  // filter toggles
  const [showNormalRefs, setShowNormalRefs] = useState(true);
  const [showCalcRefs, setShowCalcRefs] = useState(true);
  const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#555" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, "LR");
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  const [newTableName, setNewTableName] = useState("");
  const addTable = () => {
    if (!newTableName.trim()) return;
    const id = newTableName.trim();
    const newNode = {
      id,
      type: "tableNode",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: id,
        alias: "",
        fields: [{ name: "id", ref: [] }],
        isViewOrCTE: false,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setNewTableName("");
  };

  // --- Recursive upstream traversal (dependencies of a field) ---
  const findUpstreamEdges = useCallback(
    (startField) => {
      const visitedFields = new Set();
      const visitedEdges = new Set();
      const stack = [startField];

      while (stack.length > 0) {
        const current = stack.pop();
        if (visitedFields.has(current)) continue;
        visitedFields.add(current);

        // Traverse edges that *lead into* the current field
        edges.forEach((e) => {
          if (e.targetHandle === current) {
            visitedEdges.add(e.id);
            stack.push(e.sourceHandle);
          }
        });
      }

      return visitedEdges;
    },
    [edges]
  );

  // --- Recursive downstream traversal ---
  {/*const findDownstreamEdges = useCallback(
    (startField) => {
      const visitedFields = new Set();
      const visitedEdges = new Set();
      const stack = [startField];

      while (stack.length > 0) {
        const current = stack.pop();
        if (visitedFields.has(current)) continue;
        visitedFields.add(current);

        // traverse edges that start *from* current field
        edges.forEach((e) => {
          if (e.sourceHandle === current) {
            visitedEdges.add(e.id);
            stack.push(e.targetHandle);
          }
        });
      }

      return visitedEdges;
    },
    [edges]
  );*/}

  const handleFieldClick = useCallback(
    (nodeId, fieldName, fieldData) => {
      const fieldId = `${nodeId}-${fieldName}`;
      setHighlightedEdges((prev) => {
        if (prev.size > 0 && prev.has("__root__" + fieldId)) return new Set();
        const newEdges = findUpstreamEdges(fieldId);
        newEdges.add("__root__" + fieldId);
        return newEdges;
      });

      if (selectedField && selectedField.fieldName === fieldName && selectedField.nodeId === nodeId) {
        setSelectedField(null);
      } else if (fieldData?.calculation) {
        setSelectedField({
          nodeId,
          fieldName,
          calculation: fieldData.calculation.expression,
        });
      } else {
        setSelectedField(null);
      }
    },
    [findUpstreamEdges, selectedField]
  );

  const decoratedNodes = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onFieldClick: (fieldName) => {
        const fieldData = n.data.fields.find((f) => f.name === fieldName);
        handleFieldClick(n.id, fieldName, fieldData);
      },
      selectedField,
    },
  }));

  // --- Filter and highlight edges dynamically ---
  const decoratedEdges = edges
    .filter((e) => {
      const isHighlighted = highlightedEdges.has(e.id);
      const isCalcEdge = e.ref_type === "calculation";
      if (showOnlyHighlighted) return isHighlighted;
      if (!showNormalRefs && !isCalcEdge) return false;
      if (!showCalcRefs && isCalcEdge) return false;
      return true;
    })
    .map((e) => {
      const isHighlighted = highlightedEdges.has(e.id);
      const isInactive = highlightedEdges.size > 0 && !isHighlighted;
      const baseColor = e.style?.stroke || "#555";
      const baseAnimated = e.animated || false;

      return {
        ...e,
        style: {
          ...e.style,
          stroke: isInactive ? "#ccc" : baseColor,
          opacity: isInactive ? 0.4 : 1,
          strokeWidth: isInactive ? 1 : 1.8,
        },
        animated: highlightedEdges.size === 0 ? baseAnimated : isHighlighted,
      };
    });

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "row" }}>
      {/* --- Main Graph Section --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            padding: "8px",
            background: "#f5f5f5",
            borderBottom: "1px solid #ddd",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button onClick={onLayout} style={{ padding: "4px 12px" }}>
            Auto-Arrange
          </button>

          <input
            placeholder="New table name"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTable()}
            style={{ padding: "4px" }}
          />
          <button onClick={addTable}>Add Table</button>

          {/* --- Ref Filter Buttons --- */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowNormalRefs((v) => !v)}
              style={{
                padding: "4px 8px",
                background: showNormalRefs ? "#d1fae5" : "#fee2e2",
              }}
            >
              {showNormalRefs ? "Hide" : "Show"} Normal Refs
            </button>

            <button
              onClick={() => setShowCalcRefs((v) => !v)}
              style={{
                padding: "4px 8px",
                background: showCalcRefs ? "#dbeafe" : "#fee2e2",
              }}
            >
              {showCalcRefs ? "Hide" : "Show"} Calc Refs
            </button>

            <button
              onClick={() => setShowOnlyHighlighted((v) => !v)}
              style={{
                padding: "4px 8px",
                background: showOnlyHighlighted ? "#fef9c3" : "#f5f5f5",
              }}
            >
              {showOnlyHighlighted ? "Show All Refs" : "Only Highlighted"}
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={decoratedNodes}
          edges={decoratedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          connectionLineType="smoothstep"
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>

      {/* --- Drawer --- */}
      {selectedField && (
        <div
          style={{
            width: "320px",
            background: "#fff",
            borderLeft: "1px solid #ccc",
            boxShadow: "-4px 0 10px rgba(0,0,0,0.1)",
            padding: "16px",
            overflowY: "auto",
            transition: "transform 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "#333" }}>Field Calculation</h3>
            <button
              onClick={() => {
                setSelectedField(false);
                setHighlightedEdges(new Set());
              }}
              style={{ cursor: "pointer" }}
            >
              ✖
            </button>
          </div>

          <div style={{ marginTop: "12px", fontSize: 14 }}>
            <strong>Node:</strong> {selectedField.nodeId}
            <br />
            <strong>Field:</strong> {selectedField.fieldName}
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#f9f9f9",
              borderRadius: 8,
              border: "1px solid #ddd",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              color: "#007bff",
            }}
          >
            {selectedField.calculation}
          </div>
        </div>
      )}
    </div>
  );
}

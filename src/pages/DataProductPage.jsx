import { useState, useCallback, useEffect, memo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPackage,
  FiDatabase,
  FiPlus,
  FiSave,
  FiTrash2,
  FiSearch,
  FiEdit2,
  FiZap,
  FiChevronsLeft,
  FiChevronsRight,
  FiKey,
  FiDownload,
  FiX,
  FiSettings,
  FiLayout,
} from "react-icons/fi";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { getFile, saveDataProduct } from "../utils/ControlPage/fileStorage";
import { getLayoutedElements, applyLayout } from "../utils/DataProduct/layout";
import SuggestionDialog from "../components/DataProduct/SuggestionDialog";
import ReverseDepsDialog from "../components/DataProduct/ReverseDepsDialog";
import DataProductSidebar from "../components/DataProduct/DataProductSidebar";
import CalculationDialog from "../components/DataProduct/CalculationDialog";
import SettingsDialog from "../components/DataProduct/SettingsDialog";
import ConnectionTypeDialog from "../components/DataProduct/ConnectionTypeDialog";
import ExportDialog from "../components/DataProduct/ExportDialog";
import { useSuggestions } from "../hooks/useSuggestions";
import { v4 as uuidv4 } from "uuid";

const TableNode = memo(({ data, id }) => {
  const clickTimerRef = useRef(null);
  const lastClickRef = useRef(0);

  const getTypeColor = (type) => {
    switch (type) {
      case "BASE":
        return { from: "#3b82f6", to: "#2563eb", border: "#3b82f6" };
      case "CTE":
        return { from: "#8b5cf6", to: "#7c3aed", border: "#8b5cf6" };
      case "VIEW":
        return { from: "#10b981", to: "#059669", border: "#10b981" };
      default:
        return { from: "#3b82f6", to: "#2563eb", border: "#3b82f6" };
    }
  };

  const colors = getTypeColor(data.tableType);

  return (
    <div
      style={{
        background: "white",
        border: `2px solid ${colors.border}`,
        borderRadius: "8px",
        minWidth: "280px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        position: "relative",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "14px",
          padding: "12px 16px",
          background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
          color: "white",
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div>{data.tableName}</div>
          <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "2px" }}>
            {data.tableType}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {(data.tableType === "CTE" || data.tableType === "VIEW") &&
            !data.iscustom && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onShowReverseDeps(id, data.tableName, data.tableType);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "4px",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                  title="Show downstream dependency entities"
                >
                  ← Deps
                </button>
              </>
            )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onOpenSettings) {
                data.onOpenSettings(id);
              }
            }}
            style={{
              background: "rgba(99, 102, 241, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
            }}
            title="Entity settings"
          >
            <FiSettings size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAddField(id);
            }}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
            }}
            title="Add Field"
          >
            + Field
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteTable(id);
            }}
            style={{
              background: "rgba(239, 68, 68, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
            }}
            title="Delete Table"
          >
            ✕
          </button>
        </div>
      </div>
      <div style={{ padding: "8px 0", minHeight: "50px" }}>
        {data.fields.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "12px",
            }}
          >
            No fields yet. Click "+ Field" to add.
          </div>
        ) : (
          data.fields.map((field, idx) => (
            <div
              key={idx}
              style={{
                position: "relative",
                padding: "4px 8px",
                fontSize: "12px",
                color: "#1f2937",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0px",
                background: "white",
                borderLeft: field.isPK
                  ? "3px solid #f59e0b"
                  : "3px solid transparent",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!field.isPK) {
                  e.currentTarget.style.borderLeftColor = colors.border;
                }
              }}
              onMouseLeave={(e) => {
                if (!field.isPK) {
                  e.currentTarget.style.borderLeftColor = "transparent";
                }
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`${field.name}-target`}
                style={{
                  left: -8,
                  width: 12,
                  height: 12,
                  background: "#3b82f6",
                  border: "2px solid white",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flex: 1,
                  background:
                    field.calculation !== null ? "#a8caebff" : "white",
                  borderRadius: "10px",
                  padding: "8px",
                }}
              >
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "28px",
                    height: "16px",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                  title={(() => {
                    const toggleKey = `${id}_${field.name}`;
                    const isToggled =
                      data.attributeToggles?.[toggleKey] || false;
                    const effectiveMode = isToggled
                      ? data.globalAttributeMode === "runtime"
                        ? "loadtime"
                        : "runtime"
                      : data.globalAttributeMode;
                    return effectiveMode;
                  })()}
                >
                  <input
                    type="checkbox"
                    checked={(() => {
                      const toggleKey = `${id}_${field.name}`;
                      return data.attributeToggles?.[toggleKey] || false;
                    })()}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (data.onToggleFieldSelection) {
                        data.onToggleFieldSelection(id, field.name);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: (() => {
                        const toggleKey = `${id}_${field.name}`;
                        const isToggled =
                          data.attributeToggles?.[toggleKey] || false;
                        return isToggled ? "#6366f1" : "#cbd5e1";
                      })(),
                      transition: "0.3s",
                      borderRadius: "16px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: "",
                        height: "12px",
                        width: "12px",
                        left: (() => {
                          const toggleKey = `${id}_${field.name}`;
                          const isToggled =
                            data.attributeToggles?.[toggleKey] || false;
                          return isToggled ? "14px" : "2px";
                        })(),
                        bottom: "2px",
                        backgroundColor: "white",
                        transition: "0.3s",
                        borderRadius: "50%",
                      }}
                    ></span>
                  </span>
                </label>
                <span
                  style={{
                    fontWeight: field.isPK ? 600 : 500,
                    flex: 1,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const now = Date.now();
                    const isDoubleClick = now - lastClickRef.current < 300;

                    if (clickTimerRef.current) {
                      clearTimeout(clickTimerRef.current);
                    }

                    if (isDoubleClick) {
                      if (data.onTogglePK) {
                        data.onTogglePK(id, field.name);
                      }
                      lastClickRef.current = 0;
                    } else {
                      lastClickRef.current = now;
                      clickTimerRef.current = setTimeout(() => {
                        if (data.onFieldClick) {
                          data.onFieldClick(field.name, field, id);
                        }
                      }, 300);
                    }
                  }}
                  title="Click to edit calculation, double-click to set as primary key"
                >
                  {field.name}
                  {field.isPK && (
                    <FiKey
                      size={14}
                      style={{ color: "#f59e0b", flexShrink: 0 }}
                      title="Primary Key"
                    />
                  )}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onRemoveField(id, field.name);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "2px 6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                }}
                title="Remove Field"
              >
                ✕
              </button>
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.name}-source`}
                style={{
                  right: -8,
                  width: 12,
                  height: 12,
                  background: "#10b981",
                  border: "2px solid white",
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
});

TableNode.displayName = "TableNode";

const nodeTypes = {
  tableNode: TableNode,
};

const makeEdgeId = () => `edge-${Date.now()}-${uuidv4()}`;
const makeNodeId = () => `node-${Date.now()}-${uuidv4()}`;

const DataProductPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();
  const {
    selectedFileIds = [],
    dataProductData = null,
    dataProductId = null,
    dataProductName = null,
  } = location.state || {};

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tableMetadata, setTableMetadata] = useState({});
  const [fileBaseTables, setFileBaseTables] = useState([]);
  const [fileViewTables, setFileViewTables] = useState([]);
  const [fileCteTables, setFileCteTables] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [customTables, setCustomTables] = useState({
    BASE: [],
    CTE: [],
    VIEW: [],
  });
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [addFieldNodeId, setAddFieldNodeId] = useState(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("VARCHAR");
  const [showDeleteFieldConfirm, setShowDeleteFieldConfirm] = useState(false);
  const [deleteFieldInfo, setDeleteFieldInfo] = useState({
    nodeId: null,
    fieldName: null,
  });
  const [activeTableTab, setActiveTableTab] = useState("BASE");
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [showConnectionTypeDialog, setShowConnectionTypeDialog] =
    useState(false);
  const [selectedEdgeDetails, setSelectedEdgeDetails] = useState(null);
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);
  const [calculationExpression, setCalculationExpression] = useState("");
  const [calculationFieldNodeId, setCalculationFieldNodeId] = useState(null);
  const [calculationFieldName, setCalculationFieldName] = useState(null);
  const [currentDataProductId, setCurrentDataProductId] =
    useState(dataProductId);
  const [currentDataProductName, setCurrentDataProductName] =
    useState(dataProductName);
  const [showReverseDepsDialog, setShowReverseDepsDialog] = useState(false);
  const [reverseDeps, setReverseDeps] = useState([]);
  const [selectedEntityForReverseDeps, setSelectedEntityForReverseDeps] =
    useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportJson, setExportJson] = useState("");
  const [selectedFields, setSelectedFields] = useState({});
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsData, setSettingsData] = useState({
    nodeId: null,
    fields: [],
    allFields: [],
    sourceEntityName: "",
  });
  const [settingsActiveTab, setSettingsActiveTab] = useState("byMode");
  const [globalAttributeMode, setGlobalAttributeMode] = useState("runtime");
  const [entityAttributeModes, setEntityAttributeModes] = useState({});
  const entityAttributeModesRef = useRef({});
  const [tab1FilterMode, setTab1FilterMode] = useState("runtime");
  const [attributeToggles, setAttributeToggles] = useState({});
  const [attributeSelections, setAttributeSelections] = useState({});
  const [attributeSearchQuery, setAttributeSearchQuery] = useState("");
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState("CTE");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceDataProduct, setSourceDataProduct] = useState(
    dataProductData || null
  );

  const {
    showSuggestDialog,
    suggestions,
    generateSuggestions,
    setShowSuggestDialog,
  } = useSuggestions();

  // Define handleShowReverseDeps early so it can be used in node data
  const handleShowReverseDeps = async (nodeId, tableName, tableType) => {
    try {
      const entityKey = `${tableType}_${tableName}`;
      setSelectedEntityForReverseDeps({
        nodeId,
        tableName,
        tableType,
        entityKey,
      });

      const entities = tableMetadata || {};
      const selectedEntityData = entities[entityKey];

      if (!selectedEntityData || !selectedEntityData.fields) {
        setReverseDeps([]);
        setShowReverseDepsDialog(true);
        return;
      }

      const requiredEntities = new Map();
      const canvasEntityKeys = new Set(
        nodes.map((n) => `${n.data.tableType}_${n.data.tableName}`)
      );

      const fieldsArray = Array.isArray(selectedEntityData.fields)
        ? selectedEntityData.fields
        : Object.keys(selectedEntityData.fields || {}).map((fieldName) => ({
            name: fieldName,
            ...selectedEntityData.fields[fieldName],
          }));

      fieldsArray.forEach((fieldObj) => {
        const fieldName = fieldObj.name;
        const fieldData = fieldObj;

        const processRefs = (refs, isCalculation = false) => {
          if (refs && Array.isArray(refs)) {
            refs.forEach((refPath) => {
              const [refEntity, refField] = refPath.split(".");

              if (refEntity && refField && refEntity !== entityKey) {
                if (!entities[refEntity] || canvasEntityKeys.has(refEntity)) {
                  return;
                }

                if (!requiredEntities.has(refEntity)) {
                  requiredEntities.set(refEntity, {
                    connections: [],
                    entityType: refEntity.startsWith("BASE_")
                      ? "BASE"
                      : refEntity.startsWith("CTE_")
                      ? "CTE"
                      : "VIEW",
                  });
                }

                requiredEntities.get(refEntity).connections.push({
                  sourceField: refField,
                  targetField: fieldName,
                  isCalculation: isCalculation,
                  connectionType: isCalculation ? "calculation" : "ref",
                  calculation: isCalculation
                    ? fieldData.calculation?.expression || ""
                    : null,
                });
              }
            });
          }
        };

        processRefs(fieldData.ref, false);
        if (fieldData.calculation) {
          processRefs(fieldData.calculation.ref, true);
        }
      });

      const foundReverseDeps = [];

      for (const [requiredEntityKey, info] of requiredEntities.entries()) {
        const reqEntity = entities[requiredEntityKey];
        if (!reqEntity) continue;

        const entityFieldsData = Array.isArray(reqEntity.fields)
          ? reqEntity.fields.map((f) => ({
              name: f.name,
              type: f.type || "VARCHAR",
            }))
          : Object.keys(reqEntity.fields || {}).map((fieldName) => ({
              name: fieldName,
              type: reqEntity.fields[fieldName]?.type || "VARCHAR",
            }));

        const dependencyMap = {};
        dependencyMap[requiredEntityKey] = info.connections.map((conn) => ({
          sourceField: conn.sourceField,
          targetField: conn.targetField,
          connectionType: conn.connectionType,
          calculation: conn.calculation,
        }));

        const entityType =
          info.entityType ||
          requiredEntityKey.match(/^(BASE|CTE|VIEW)_/)?.[1] ||
          "BASE";
        const sourceName = "Data Product";

        const depObj = {
          entityName: requiredEntityKey,
          alias: reqEntity.alias || requiredEntityKey,
          entityType,
          sourceFile: sourceName,
          dependencyMap: dependencyMap,
          entityData: reqEntity,
          fields: entityFieldsData,
          connectionCount: info.connections.length,
        };
        foundReverseDeps.push(depObj);
      }

      setReverseDeps(foundReverseDeps);
      setShowReverseDepsDialog(true);
    } catch (error) {
      console.error("Error finding downstream dependencies:", error);
      alert("Error finding downstream dependencies: " + error.message);
    }
  };

  useEffect(() => {
    console.log("Nodes updated:", nodes);
  }, [nodes]);

  useEffect(() => {
    console.log("Edges updated:", edges);
  }, [edges]);

  useEffect(() => {
    console.log("table Metadata updated:", tableMetadata);
  }, [tableMetadata]);

  useEffect(() => {
    console.log("customTables updated:", customTables);
  }, [customTables]);

  useEffect(() => {
    entityAttributeModesRef.current = entityAttributeModes;
  }, [entityAttributeModes]);

  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const entityMode = entityAttributeModes[node.id] || "runtime";
        return {
          ...node,
          data: {
            ...node.data,
            attributeToggles,
            globalAttributeMode: entityMode,
          },
        };
      })
    );
  }, [attributeToggles, entityAttributeModes]);

  useEffect(() => {
    if (dataProductData) {
      loadDataProduct(dataProductData);
    }
  }, []);

  useEffect(() => {
    if (!dataProductData && selectedFileIds.length > 0) {
      loadTableMetadata();
    }
  }, [selectedFileIds]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
      nodes,
      edges,
      "dagre",
      "LR"
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length > 0 && edges.length >= 0) {
      const timer = setTimeout(() => {
        onLayout();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadTableMetadata = async () => {
    const metadata = {};
    const baseTables = new Set();
    const viewTables = new Set();
    const cteTables = new Set();
    const combinedEntities = {};

    for (const fileId of selectedFileIds) {
      try {
        const fileData = await getFile(fileId, "sql", "individual");
        if (fileData && fileData.data && fileData.data.entities) {
          Object.assign(combinedEntities, fileData.data.entities);

          for (const entityName in fileData.data.entities) {
            if (entityName.startsWith("BASE_")) {
              const baseName = entityName.replace("BASE_", "");
              baseTables.add(baseName);
              const entity = fileData.data.entities[entityName];
              const metadataKey = `BASE_${baseName}`;
              if (!metadata[metadataKey]) {
                metadata[metadataKey] = {
                  name: baseName,
                  type: "BASE",
                  fields: [],
                };
              }
              if (entity.fields) {
                for (const fieldName in entity.fields) {
                  const field = entity.fields[fieldName];
                  if (
                    !metadata[metadataKey].fields.some(
                      (f) => f.name === fieldName
                    )
                  ) {
                    metadata[metadataKey].fields.push({
                      name: fieldName,
                      type: field.type || "unknown",
                      ref: field.ref || null,
                      isPK: field.isPK || false,
                      calculation: field.calculation || null,
                    });
                  }
                }
              }
              metadata[metadataKey].iscustom = false;
            } else if (entityName.startsWith("VIEW_")) {
              const viewName = entityName.replace("VIEW_", "");
              viewTables.add(viewName);
              const entity = fileData.data.entities[entityName];
              const metadataKey = `VIEW_${viewName}`;
              if (!metadata[metadataKey]) {
                metadata[metadataKey] = {
                  name: viewName,
                  type: "VIEW",
                  fields: [],
                };
              }
              if (entity.fields) {
                for (const fieldName in entity.fields) {
                  const field = entity.fields[fieldName];
                  if (
                    !metadata[metadataKey].fields.some(
                      (f) => f.name === fieldName
                    )
                  ) {
                    metadata[metadataKey].fields.push({
                      name: fieldName,
                      type: field.type || "unknown",
                      ref: field.ref || null,
                      isPK: field.isPK || false,
                      calculation: field.calculation || null,
                    });
                  }
                }
              }
              metadata[metadataKey].iscustom = false;
            } else if (entityName.startsWith("CTE_")) {
              const cteName = entityName.replace("CTE_", "");
              cteTables.add(cteName);
              const entity = fileData.data.entities[entityName];
              const metadataKey = `CTE_${cteName}`;
              if (!metadata[metadataKey]) {
                metadata[metadataKey] = {
                  name: cteName,
                  type: "CTE",
                  fields: [],
                };
              }
              if (entity.fields) {
                for (const fieldName in entity.fields) {
                  const field = entity.fields[fieldName];
                  if (
                    !metadata[metadataKey].fields.some(
                      (f) => f.name === fieldName
                    )
                  ) {
                    metadata[metadataKey].fields.push({
                      name: fieldName,
                      type: field.type || "unknown",
                      ref: field.ref || null,
                      isPK: field.isPK || false,
                      calculation: field.calculation || null,
                    });
                  }
                }
              }
              metadata[metadataKey].iscustom = false;
            }
          }
        }
      } catch (error) {
        console.error(`Error loading metadata for file ${fileId}:`, error);
      }
    }

    setTableMetadata(metadata);
    setFileBaseTables(Array.from(baseTables).sort());
    setFileViewTables(Array.from(viewTables).sort());
    setFileCteTables(Array.from(cteTables).sort());

    if (Object.keys(combinedEntities).length > 0) {
      setSourceDataProduct({
        entities: combinedEntities,
        metadata: { name: "Selected Files" },
      });
    }
  };

  const loadDataProduct = (dataProduct) => {
    try {
      setSourceDataProduct(dataProduct || null);

      const loadedNodes = [];
      const loadedEdges = [];
      const nodeMap = new Map();

      const savedEntityModes = dataProduct.entityAttributeModes || {};
      const savedToggles = dataProduct.attributeToggles || {};
      const defaultMode = dataProduct.globalAttributeMode || "runtime";

      const entitiesArray = Array.isArray(dataProduct.entities)
        ? dataProduct.entities
        : Object.values(dataProduct.entities || {});

      const entityKeyMap = new Map();
      entitiesArray.forEach((canvasNode) => {
        const entityKey = `${canvasNode.data.tableType}_${canvasNode.data.tableName}`;
        entityKeyMap.set(canvasNode.id, entityKey);
      });

      entitiesArray.forEach((canvasNode) => {
        const nodeId = canvasNode.id;
        const entityKey = `${canvasNode.data.tableType}_${canvasNode.data.tableName}`;

        nodeMap.set(entityKey, nodeId);

        const entityMode = savedEntityModes[nodeId] || defaultMode;

        const fields = canvasNode.data.fields.map((field) => {
          const toggleKey = `${nodeId}_${field.name}`;
          const isToggled = savedToggles[toggleKey] || false;
          const attributeMode = isToggled
            ? entityMode === "runtime"
              ? "loadtime"
              : "runtime"
            : entityMode;

          return {
            name: field.name,
            type: field.type || "unknown",
            attributeMode: field.attributeMode || attributeMode,
            isPK: field.isPK || false,
            calculation: field.calculation || null,
            ref: field.ref || null,
          };
        });

        loadedNodes.push({
          id: nodeId,
          type: "tableNode",
          position: canvasNode.position || {
            x: 100 + loadedNodes.length * 320,
            y: 100 + (loadedNodes.length % 3) * 250,
          },
          data: {
            tableName: canvasNode.data.tableName,
            tableType: canvasNode.data.tableType,
            fields,
            attributeToggles: savedToggles,
            globalAttributeMode: entityMode,
            onAddField: handleAddField,
            onRemoveField: handleRemoveField,
            onDeleteTable: handleDeleteTable,
            onTogglePK: handleTogglePK,
            onShowReverseDeps: handleShowReverseDeps,
            onToggleFieldSelection: handleToggleFieldSelection,
            onOpenSettings: handleOpenSettings,
            onFieldClick: handleFieldClick,
            selectedFields: [],
          },
        });
      });

      const relationships = Array.isArray(dataProduct.relationships)
        ? dataProduct.relationships
        : [];

      relationships.forEach((rel, idx) => {
        const sourceNode = loadedNodes.find((n) => n.id === rel.source);
        const targetNode = loadedNodes.find((n) => n.id === rel.target);

        if (sourceNode && targetNode) {
          const sourceHandle =
            rel.sourceHandle || `${rel.data?.sourceField}-source`;
          const targetHandle =
            rel.targetHandle || `${rel.data?.targetField}-target`;
          const connectionType = rel.data?.connectionType || "ref";
          const color =
            connectionType === "calculation" ? "#3b82f6" : "#ef4444";

          loadedEdges.push({
            id: rel.id || makeEdgeId(),
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle,
            targetHandle,
            type: "smoothstep",
            animated: false,
            style: { stroke: color, strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color,
            },
            data: { connectionType },
          });
        }
      });

      setNodes(loadedNodes);
      setEdges(loadedEdges);

      if (dataProduct.availableTables) {
        setTableMetadata(dataProduct.availableTables.tableMetadata || {});
        setFileBaseTables(dataProduct.availableTables.fileBaseTables || []);
        setFileViewTables(dataProduct.availableTables.fileViewTables || []);
        setFileCteTables(dataProduct.availableTables.fileCteTables || []);
        setCustomTables(
          dataProduct.availableTables.customTables || {
            BASE: [],
            CTE: [],
            VIEW: [],
          }
        );
      }

      if (savedEntityModes && Object.keys(savedEntityModes).length > 0) {
        setEntityAttributeModes(savedEntityModes);
      }

      setSidebarOpen(true);
    } catch (error) {
      console.error("Error loading data product:", error);
      alert("Error loading data product: " + error.message);
    }
  };

  const onConnect = useCallback(
    (params) => {
      // Check if an explicit connection between these exact handles already exists
      const exists = edges.some(
        (e) =>
          e.source === params.source &&
          e.target === params.target &&
          e.sourceHandle === params.sourceHandle &&
          e.targetHandle === params.targetHandle
      );

      // If edge already exists, prevent duplicate connection
      if (exists) {
        alert("A connection between these fields already exists.");
        return;
      }

      // Determine whether the target field already has a calculation
      const targetNode = nodes.find((n) => n.id === params.target);
      const targetFieldName = params.targetHandle
        ? params.targetHandle.replace("-target", "")
        : null;
      const targetField = targetNode?.data?.fields?.find(
        (f) => f.name === targetFieldName
      );
      const targetHasCalculation = !!(targetField && targetField.calculation);

      // Default connection type: calculation if target field has a calculation, otherwise ref
      const defaultType = targetHasCalculation ? "calculation" : "ref";
      const color = defaultType === "calculation" ? "#3b82f6" : "#ef4444";

      // Prepare a tentative edge object and show the dialog. The dialog
      // will call handleChangeConnectionType to either add the edge or
      // update an existing one.
      const tentativeEdge = {
        ...params,
        id: makeEdgeId(),
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: { connectionType: defaultType },
        style: { stroke: color, strokeWidth: 2 },
      };

      // Add tentative edge to canvas immediately
      setEdges((eds) => addEdge(tentativeEdge, eds));

      // Store tentative details so the dialog can act on them. Always
      // show the dialog so the user confirms the type.
      setSelectedEdgeDetails(tentativeEdge);
      setShowConnectionTypeDialog(true);
    },
    [edges, nodes, setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault();

      const tableData = event.dataTransfer.getData("application/reactflow");

      if (!tableData) {
        return;
      }

      const { tableName, tableType } = JSON.parse(tableData);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addTableToCanvas(tableName, tableType, [], position, tableMetadata);
    },
    [reactFlowInstance, tableMetadata]
  );

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
    setSelectedEdgeDetails(null);
    setEdges((eds) =>
      eds.map((e) => {
        const connectionType = e.data?.connectionType || "ref";
        const color = connectionType === "calculation" ? "#3b82f6" : "#ef4444";
        return {
          ...e,
          style: { stroke: color, strokeWidth: 2 },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color }
        };
      })
    );
  }, [setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete" && selectedEdge) {
        event.preventDefault();
        deleteSelectedEdge();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEdge, deleteSelectedEdge]);

  const handleAddField = useCallback((nodeId) => {
    setAddFieldNodeId(nodeId);
    setShowAddFieldDialog(true);
  }, []);

  const handleConfirmAddField = useCallback(() => {
    if (!newFieldName.trim()) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === addFieldNodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              fields: [
                ...node.data.fields,
                {
                  name: newFieldName,
                  type: newFieldType,
                  ref: null,
                  calculation: null,
                },
              ],
            },
          };

          const metadataKey = `${node.data.tableType}_${node.data.tableName}`;
          setTableMetadata((prev) => ({
            ...prev,
            [metadataKey]: {
              name: node.data.tableName,
              type: node.data.tableType,
              fields: updatedNode.data.fields.map((f) => ({
                name: f.name,
                type: f.type || "VARCHAR",
                ref: f.ref || null,
                calculation: f.calculation || null,
              })),
            },
          }));
          return updatedNode;
        }
        return node;
      })
    );

    setShowAddFieldDialog(false);
    setNewFieldName("");
    setNewFieldType("VARCHAR");
    setAddFieldNodeId(null);
  }, [newFieldName, newFieldType, addFieldNodeId, setNodes]);

  const handleRemoveField = useCallback(
    (nodeId, fieldName) => {
      if (window.confirm(`Remove field "${fieldName}"?`)) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  fields: node.data.fields.filter((f) => f.name !== fieldName),
                },
              };
            }
            return node;
          })
        );
        setEdges((eds) =>
          eds.filter(
            (e) =>
              !(
                (e.source === nodeId &&
                  e.sourceHandle === `${fieldName}-source`) ||
                (e.target === nodeId &&
                  e.targetHandle === `${fieldName}-target`)
              )
          )
        );
      }
    },
    [setNodes, setEdges]
  );

  const handleToggleFieldSelection = useCallback(
    (nodeId, fieldName) => {
      setAttributeToggles((prev) => {
        const toggleKey = `${nodeId}_${fieldName}`;
        const currentToggle = prev[toggleKey] || false;
        return {
          ...prev,
          [toggleKey]: !currentToggle,
        };
      });

      setSelectedFields((prev) => {
        const nodeSelections = prev[nodeId] || [];
        const isSelected = nodeSelections.includes(fieldName);

        const newSelections = {
          ...prev,
          [nodeId]: isSelected
            ? nodeSelections.filter((f) => f !== fieldName)
            : [...nodeSelections, fieldName],
        };

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  selectedFields: newSelections[nodeId],
                },
              };
            }
            return node;
          })
        );

        return newSelections;
      });
    },
    [setNodes]
  );

  const handleCreateFromSelection = useCallback(
    (nodeId, selectedFieldNames) => {
      setNodes((currentNodes) => {
        const node = currentNodes.find((n) => n.id === nodeId);

        if (!node) {
          return currentNodes;
        }

        const selectedFieldsData = node.data.fields.filter((f) =>
          selectedFieldNames.includes(f.name)
        );

        const initialToggles = {};
        node.data.fields.forEach((field) => {
          initialToggles[`${nodeId}_${field.name}`] = (
            node.data.selectedFields || []
          ).includes(field.name);
        });
        setAttributeToggles((prev) => ({ ...prev, ...initialToggles }));

        setSettingsData({
          nodeId,
          sourceEntityName: node.data.tableName,
          fields: selectedFieldsData,
          allFields: node.data.fields,
        });
        setNewEntityName("");
        setNewEntityType("CTE");
        setSearchQuery("");
        setSettingsActiveTab("byMode");
        setShowSettingsDialog(true);

        return currentNodes;
      });
    },
    []
  );

  const handleTogglePK = useCallback(
    (nodeId, fieldName) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.map((field) =>
                  field.name === fieldName
                    ? { ...field, isPK: !field.isPK }
                    : field
                ),
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const handleFieldClick = useCallback((fieldName, field, nodeId) => {
    let expression = "";
    if (field?.calculation?.expression) {
      expression = field.calculation.expression;
    }
    setCalculationFieldNodeId(nodeId);
    setCalculationFieldName(fieldName);
    setCalculationExpression(expression);
    setShowCalculationDialog(true);
  }, []);

  const handleSaveCalculation = useCallback(() => {
    // Update calculation only in the corresponding field in nodes (not in edge data)
    if (calculationFieldNodeId && calculationFieldName) {
      console.log("Saving calculation expression:", calculationExpression);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === calculationFieldNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.map((field) =>
                  field.name === calculationFieldName
                    ? {
                        ...field,
                        calculation:
                          calculationExpression !== ""
                            ? {
                                ...field.calculation,
                                expression: calculationExpression,
                              }
                            : null,
                      }
                    : field
                ),
              },
            };
          }
          return node;
        })
      );
    }

    setShowCalculationDialog(false);
    setCalculationExpression("");
    setCalculationFieldNodeId(null);
    setCalculationFieldName(null);
  }, [
    nodes,
    calculationExpression,
    setNodes,
    calculationFieldNodeId,
    calculationFieldName,
  ]);

  const handleEditCalculation = useCallback(() => {
    if (selectedEdgeDetails?.data?.connectionType === "calculation") {
      // Calculation is now stored in node field data, not in edge data
      // Empty expression to start - user will edit from field click context
      setCalculationExpression("");
      setShowCalculationDialog(true);
    }
  }, [selectedEdgeDetails]);

  const handleOpenSettings = useCallback((nodeId) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);

      if (!node) {
        return currentNodes;
      }

      const selectedFieldsForNode = node.data.selectedFields || [];
      const selectedFieldsData = node.data.fields.filter((f) =>
        selectedFieldsForNode.includes(f.name)
      );

      const entityMode = entityAttributeModesRef.current[nodeId] || "runtime";
      setGlobalAttributeMode(entityMode);

      setAttributeToggles((prev) => {
        const initialToggles = {};
        node.data.fields.forEach((field) => {
          const toggleKey = `${nodeId}_${field.name}`;
          if (prev[toggleKey] === undefined) {
            const fieldMode = field.attributeMode || entityMode;
            const shouldToggle = fieldMode !== entityMode;
            initialToggles[toggleKey] = shouldToggle;
          }
        });
        return Object.keys(initialToggles).length > 0
          ? { ...prev, ...initialToggles }
          : prev;
      });

      setSettingsData({
        nodeId,
        sourceEntityName: node.data.tableName,
        fields: selectedFieldsData,
        allFields: node.data.fields,
      });
      setNewEntityName("");
      setNewEntityType("CTE");
      setSearchQuery("");
      setAttributeSearchQuery("");
      setAttributeSelections({});
      setSettingsActiveTab("byMode");
      setShowSettingsDialog(true);

      return currentNodes;
    });
  }, []);

  const handleConfirmRemoveField = useCallback(() => {
    const { nodeId, fieldName } = deleteFieldInfo;

    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !edge.sourceHandle?.includes(fieldName) &&
          !edge.targetHandle?.includes(fieldName)
      )
    );

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              fields: node.data.fields.filter((f) => f.name !== fieldName),
            },
          };

          const metadataKey = `${node.data.tableType}_${node.data.tableName}`;
          setTableMetadata((prev) => ({
            ...prev,
            [metadataKey]: {
              name: node.data.tableName,
              type: node.data.tableType,
              fields: updatedNode.data.fields.map((f) => ({
                name: f.name,
                type: f.type || "VARCHAR",
                ref: f.ref || null,
                calculation: f.calculation || null,
              })),
            },
          }));

          return updatedNode;
        }
        return node;
      })
    );

    setShowDeleteFieldConfirm(false);
    setDeleteFieldInfo({ nodeId: null, fieldName: null });
  }, [deleteFieldInfo, setNodes, setEdges]);

  const handleDeleteTable = useCallback(
    (nodeId) => {
      if (!window.confirm("Delete this table?")) return;

      const nodeToDelete = nodes.find((n) => n.id === nodeId);

      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));

      if (nodeToDelete) {
        const metadataKey = `${nodeToDelete.data.tableType}_${nodeToDelete.data.tableName}`;
        setTableMetadata((prev) => {
          const updated = { ...prev };
          delete updated[metadataKey];
          return updated;
        });

        setCustomTables((prev) => ({
          ...prev,
          [nodeToDelete.data.tableType]: prev[
            nodeToDelete.data.tableType
          ].filter((t) => t !== nodeToDelete.data.tableName),
        }));
      }

      setTimeout(() => {
        if (showReverseDepsDialog && selectedEntityForReverseDeps) {
          handleShowReverseDeps(
            selectedEntityForReverseDeps.nodeId,
            selectedEntityForReverseDeps.tableName,
            selectedEntityForReverseDeps.tableType
          );
        }
        if (showSuggestDialog) {
          generateSuggestions(
            nodes.filter((n) => n.id !== nodeId),
            sourceDataProduct
          );
        }
      }, 100);
    },
    [
      setNodes,
      setEdges,
      nodes,
      showReverseDepsDialog,
      selectedEntityForReverseDeps,
      showSuggestDialog,
      handleShowReverseDeps,
      generateSuggestions,
      sourceDataProduct,
    ]
  );

  const handleCreateByMode = useCallback(() => {
    if (!newEntityName.trim()) {
      alert("Please enter an entity name");
      return;
    }

    const entityExists = nodes.some(
      (n) =>
        n.data.tableName === newEntityName && n.data.tableType === newEntityType
    );

    if (entityExists) {
      alert(
        `Entity "${newEntityName}" (${newEntityType}) already exists on canvas!`
      );
      return;
    }

    const sourceNode = nodes.find((n) => n.id === settingsData.nodeId);

    const entityMode = globalAttributeMode;

    const fieldsToUse = settingsData.allFields
      .filter((f) => {
        const toggleKey = `${settingsData.nodeId}_${f.name}`;
        const isToggled = attributeToggles[toggleKey] || false;
        const fieldAttributeMode = isToggled
          ? entityMode === "runtime"
            ? "loadtime"
            : "runtime"
          : entityMode;

        if (tab1FilterMode === "both") {
          return true;
        } else {
          return fieldAttributeMode === tab1FilterMode;
        }
      })
      .map((f) => {
        const toggleKey = `${settingsData.nodeId}_${f.name}`;
        const isToggled = attributeToggles[toggleKey] || false;
        const attributeMode = isToggled
          ? entityMode === "runtime"
            ? "loadtime"
            : "runtime"
          : entityMode;

        const sourceField = sourceNode?.data.fields.find(
          (sf) => sf.name === f.name
        );
        const isPK = sourceField?.isPK || false;

        return { ...f, isPK };
      });

    const newNodeId = makeNodeId();
    const newNode = {
      id: newNodeId,
      type: "tableNode",
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        tableName: newEntityName,
        tableType: newEntityType,
        fields: fieldsToUse,
        iscustom: true,
        selectedFields: [],
        attributeToggles: {},
        globalAttributeMode: globalAttributeMode,
        onAddField: handleAddField,
        onRemoveField: handleRemoveField,
        onTogglePK: handleTogglePK,
        onToggleFieldSelection: handleToggleFieldSelection,
        onFieldClick: handleFieldClick,
      },
    };

    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];

      return updatedNodes.map((node) => {
        if (node.id === newNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              onShowReverseDeps: (nodeId, tableName, tableType) =>
                handleShowReverseDeps(nodeId, tableName, tableType),
              onDeleteTable: (nodeId) => handleDeleteTable(nodeId),
              onOpenSettings: (nodeId) => handleOpenSettings(nodeId),
            },
          };
        }
        return node;
      });
    });

    setEntityAttributeModes((prev) => ({
      ...prev,
      [newNodeId]: entityMode,
    }));

    setAttributeToggles((prev) => {
      const newToggles = { ...prev };
      fieldsToUse.forEach((field) => {
        const sourceToggleKey = `${settingsData.nodeId}_${field.name}`;
        const newToggleKey = `${newNodeId}_${field.name}`;
        if (prev[sourceToggleKey] !== undefined) {
          newToggles[newToggleKey] = prev[sourceToggleKey];
        }
      });
      return newToggles;
    });

    const edgesToCopy = [];
    const sourceNodeId = settingsData.nodeId;

    fieldsToUse.forEach((field, idx) => {
      const outgoingEdges = edges.filter(
        (e) =>
          e.source === sourceNodeId && e.sourceHandle === `${field.name}-source`
      );

      outgoingEdges.forEach((sourceEdge, edgeIdx) => {
        edgesToCopy.push({
          field: field.name,
          idx: `${idx}-${edgeIdx}`,
          target: sourceEdge.target,
          targetHandle: sourceEdge.targetHandle,
          connectionType: sourceEdge.data?.connectionType || "ref",
          type: "outgoing",
        });
      });

      const incomingEdges = edges.filter(
        (e) =>
          e.target === sourceNodeId && e.targetHandle === `${field.name}-target`
      );

      incomingEdges.forEach((incomingEdge, edgeIdx) => {
        edgesToCopy.push({
          field: field.name,
          idx: `${idx}-${edgeIdx}`,
          source: incomingEdge.source,
          sourceHandle: incomingEdge.sourceHandle,
          connectionType: incomingEdge.data?.connectionType || "ref",
          type: "incoming",
        });
      });
    });

    setTimeout(() => {
      if (edgesToCopy.length > 0) {
        const newEdges = edgesToCopy.map((edgeInfo) => {
          if (edgeInfo.type === "outgoing") {
            return {
              id: makeEdgeId(),
              source: newNodeId,
              target: edgeInfo.target,
              sourceHandle: `${edgeInfo.field}-source`,
              targetHandle: edgeInfo.targetHandle,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                connectionType: edgeInfo.connectionType,
              },
              style: {
                stroke:
                  edgeInfo.connectionType === "calculation"
                    ? "#3b82f6"
                    : "#ef4444",
                strokeWidth: 2,
              },
            };
          } else {
            return {
              id: makeEdgeId(),
              source: edgeInfo.source,
              target: newNodeId,
              sourceHandle: edgeInfo.sourceHandle,
              targetHandle: `${edgeInfo.field}-target`,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                connectionType: edgeInfo.connectionType,
              },
              style: {
                stroke:
                  edgeInfo.connectionType === "calculation"
                    ? "#3b82f6"
                    : "#ef4444",
                strokeWidth: 2,
              },
            };
          }
        });

        setEdges((eds) => {
          const updated = [...eds, ...newEdges];
          return updated;
        });
      }
    }, 100);

    setSelectedFields((prev) => ({
      ...prev,
      [settingsData.nodeId]: [],
    }));

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === settingsData.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedFields: [],
            },
          };
        }
        return node;
      })
    );

    if (newEntityType === "BASE") {
      if (!fileBaseTables.includes(newEntityName)) {
        setFileBaseTables((prev) => [...prev, newEntityName]);
      }
    } else if (newEntityType === "VIEW") {
      if (!fileViewTables.includes(newEntityName)) {
        setFileViewTables((prev) => [...prev, newEntityName]);
      }
    } else if (newEntityType === "CTE") {
      setCustomTables((prev) => ({
        ...prev,
        CTE: [...prev.CTE, newEntityName],
      }));
    }

    setShowSettingsDialog(false);
  }, [
    newEntityName,
    newEntityType,
    nodes,
    settingsData,
    globalAttributeMode,
    attributeToggles,
    edges,
    handleAddField,
    handleRemoveField,
    handleTogglePK,
    handleToggleFieldSelection,
    fileBaseTables,
    fileViewTables,
    setNodes,
    setEdges,
    setCustomTables,
    setFileBaseTables,
    setFileViewTables,
    tab1FilterMode,
    handleShowReverseDeps,
    handleDeleteTable,
    handleOpenSettings,
    handleFieldClick,
  ]);

  const handleCreateFromSelected = useCallback(() => {
    if (!newEntityName.trim()) {
      alert("Please enter an entity name");
      return;
    }

    const entityExists = nodes.some(
      (n) =>
        n.data.tableName === newEntityName && n.data.tableType === newEntityType
    );

    if (entityExists) {
      alert(
        `Entity "${newEntityName}" (${newEntityType}) already exists on canvas!`
      );
      return;
    }

    const sourceNode = nodes.find((n) => n.id === settingsData.nodeId);

    const entityMode = globalAttributeMode;

    const selectedFields = settingsData.allFields
      ? settingsData.allFields.filter((f) => attributeSelections[f.name])
      : [];

    if (selectedFields.length === 0) {
      alert("Please select at least one attribute");
      return;
    }

    const fieldsToUse = selectedFields.map((f) => {
      const toggleKey = `${settingsData.nodeId}_${f.name}`;
      const isToggled = attributeToggles[toggleKey] || false;

      const sourceField = sourceNode?.data.fields.find(
        (sf) => sf.name === f.name
      );
      const isPK = sourceField?.isPK || false;

      return { ...f, isPK };
    });

    const newNodeId = makeNodeId();

    const newNode = {
      id: newNodeId,
      type: "tableNode",
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        tableName: newEntityName,
        tableType: newEntityType,
        fields: fieldsToUse,
        iscustom: true,
        selectedFields: [],
        attributeToggles: {},
        globalAttributeMode: globalAttributeMode,
        onAddField: handleAddField,
        onRemoveField: handleRemoveField,
        onTogglePK: handleTogglePK,
        onToggleFieldSelection: handleToggleFieldSelection,
        onFieldClick: handleFieldClick,
      },
    };

    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];

      return updatedNodes.map((node) => {
        if (node.id === newNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              onShowReverseDeps: (nodeId, tableName, tableType) =>
                handleShowReverseDeps(nodeId, tableName, tableType),
              onDeleteTable: (nodeId) => handleDeleteTable(nodeId),
              onOpenSettings: (nodeId) => handleOpenSettings(nodeId),
            },
          };
        }
        return node;
      });
    });

    setEntityAttributeModes((prev) => ({
      ...prev,
      [newNodeId]: entityMode,
    }));

    setAttributeToggles((prev) => {
      const newToggles = { ...prev };
      fieldsToUse.forEach((field) => {
        const sourceToggleKey = `${settingsData.nodeId}_${field.name}`;
        const newToggleKey = `${newNodeId}_${field.name}`;
        if (prev[sourceToggleKey] !== undefined) {
          newToggles[newToggleKey] = prev[sourceToggleKey];
        }
      });
      return newToggles;
    });

    const edgesToCopy = [];
    const sourceNodeId = settingsData.nodeId;

    fieldsToUse.forEach((field, idx) => {
      const outgoingEdges = edges.filter(
        (e) =>
          e.source === sourceNodeId && e.sourceHandle === `${field.name}-source`
      );

      outgoingEdges.forEach((sourceEdge, edgeIdx) => {
        edgesToCopy.push({
          field: field.name,
          idx: `${idx}-${edgeIdx}`,
          target: sourceEdge.target,
          targetHandle: sourceEdge.targetHandle,
          connectionType: sourceEdge.data?.connectionType || "ref",
          type: "outgoing",
        });
      });

      const incomingEdges = edges.filter(
        (e) =>
          e.target === sourceNodeId && e.targetHandle === `${field.name}-target`
      );

      incomingEdges.forEach((incomingEdge, edgeIdx) => {
        edgesToCopy.push({
          field: field.name,
          idx: `${idx}-${edgeIdx}`,
          source: incomingEdge.source,
          sourceHandle: incomingEdge.sourceHandle,
          connectionType: incomingEdge.data?.connectionType || "ref",
          type: "incoming",
        });
      });
    });

    setTimeout(() => {
      if (edgesToCopy.length > 0) {
        const newEdges = edgesToCopy.map((edgeInfo) => {
          if (edgeInfo.type === "outgoing") {
            return {
              id: makeEdgeId(),
              source: newNodeId,
              target: edgeInfo.target,
              sourceHandle: `${edgeInfo.field}-source`,
              targetHandle: edgeInfo.targetHandle,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                connectionType: edgeInfo.connectionType,
              },
              style: {
                stroke:
                  edgeInfo.connectionType === "calculation"
                    ? "#3b82f6"
                    : "#ef4444",
                strokeWidth: 2,
              },
            };
          } else {
            return {
              id: makeEdgeId(),
              source: edgeInfo.source,
              target: newNodeId,
              sourceHandle: edgeInfo.sourceHandle,
              targetHandle: `${edgeInfo.field}-target`,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                connectionType: edgeInfo.connectionType,
              },
              style: {
                stroke:
                  edgeInfo.connectionType === "calculation"
                    ? "#3b82f6"
                    : "#ef4444",
                strokeWidth: 2,
              },
            };
          }
        });

        setEdges((eds) => [...eds, ...newEdges]);
      }
    }, 100);

    if (newEntityType === "BASE") {
      if (!fileBaseTables.includes(newEntityName)) {
        setFileBaseTables((prev) => [...prev, newEntityName]);
      }
    } else if (newEntityType === "VIEW") {
      if (!fileViewTables.includes(newEntityName)) {
        setFileViewTables((prev) => [...prev, newEntityName]);
      }
    } else if (newEntityType === "CTE") {
      setCustomTables((prev) => ({
        ...prev,
        CTE: [...prev.CTE, newEntityName],
      }));
    }

    setShowSettingsDialog(false);
  }, [
    newEntityName,
    newEntityType,
    nodes,
    settingsData,
    globalAttributeMode,
    attributeToggles,
    attributeSelections,
    edges,
    handleAddField,
    handleRemoveField,
    handleTogglePK,
    handleToggleFieldSelection,
    fileBaseTables,
    fileViewTables,
    setNodes,
    setEdges,
    setCustomTables,
    setFileBaseTables,
    setFileViewTables,
    handleShowReverseDeps,
    handleDeleteTable,
    handleOpenSettings,
    handleFieldClick,
  ]);

  const onEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      setSelectedEdge(edge.id);
      setSelectedEdgeDetails(edge);
      // Highlight the selected edge
      setEdges((eds) =>
        eds.map((e) => {
          const isSelected = e.id === edge.id;
          const connectionType = e.data?.connectionType || "ref";
          const baseColor =
            connectionType === "calculation" ? "#3b82f6" : "#ef4444";
          return {
            ...e,
            style: {
              stroke: isSelected ? "#fbbf24" : baseColor,
              strokeWidth: isSelected ? 3 : 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isSelected ? "#fbbf24" : baseColor,
            },
            animated: isSelected,
          };
        })
      );
    },
    [setEdges]
  );

  const handleChangeConnectionType = useCallback(
    (newType) => {
      // If editing an existing selected edge, update it.
      if (selectedEdge) {
        setEdges((eds) =>
          eds.map((e) => {
            if (e.id === selectedEdge) {
              const color = newType === "calculation" ? "#3b82f6" : "#ef4444";
              return {
                ...e,
                data: { connectionType: newType },
                style: { stroke: color, strokeWidth: 3 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: color,
                },
              };
            }
            return e;
          })
        );
        setSelectedEdgeDetails((prev) =>
          prev ? { ...prev, data: { connectionType: newType } } : null
        );
        setShowConnectionTypeDialog(false);
        return;
      }

      // If we have tentative connection details (from onConnect), create the new edge
      if (selectedEdgeDetails) {
        const edgeColor = newType === "calculation" ? "#3b82f6" : "#ef4444";
        const newEdge = {
          ...selectedEdgeDetails,
          id: selectedEdgeDetails.id || makeEdgeId(),
          type: "smoothstep",
          animated: true,
          data: { connectionType: newType },
          style: {
            stroke: edgeColor,
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setSelectedEdge(newEdge.id);
        setSelectedEdgeDetails(newEdge);
      }

      setShowConnectionTypeDialog(false);
    },
    [selectedEdge, selectedEdgeDetails, edges]
  );

  const handleExport = useCallback(() => {
    const dataProduct = {
      entities: nodes,
      relationships: edges,
      metadata: {
        name: currentDataProductName || "untitled",
        created: new Date().toISOString(),
        tableCount: nodes.length,
        connectionCount: edges.length,
      },
      availableTables: {
        tableMetadata,
        fileBaseTables,
        fileCteTables,
        fileViewTables,
        customTables,
      },
    };
    setExportJson(JSON.stringify(dataProduct, null, 2));
    setShowExportDialog(true);
  }, [
    nodes,
    edges,
    currentDataProductName,
    tableMetadata,
    fileBaseTables,
    fileCteTables,
    fileViewTables,
    customTables,
  ]);

  const addTableToCanvas = (
    tableName,
    tableType = "BASE",
    fields = [],
    customPosition = null,
    tableMetadata = {}
  ) => {
    const entityExists = nodes.some(
      (n) => n.data.tableName === tableName && n.data.tableType === tableType
    );

    if (entityExists) {
      alert(`Entity "${tableName}" (${tableType}) already exists on canvas!`);
      return false;
    }
    let table = tableMetadata[`${tableType}_${tableName}`];

    const actualType = table?.type || tableType;

    const finalFields =
      fields && fields.length > 0 ? fields : table?.fields || [];
    const newNode = {
      id: makeNodeId(),
      type: "tableNode",
      position: customPosition || {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        tableName: tableName,
        tableType: actualType,
        fields: finalFields,
        iscustom: table?.iscustom,
        selectedFields: [],
        attributeToggles: {},
        globalAttributeMode: globalAttributeMode,
        onAddField: handleAddField,
        onRemoveField: handleRemoveField,
        onDeleteTable: handleDeleteTable,
        onTogglePK: handleTogglePK,
        onShowReverseDeps: handleShowReverseDeps,
        onFieldClick: handleFieldClick,
        onToggleFieldSelection: handleToggleFieldSelection,
        onOpenSettings: handleOpenSettings,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    return true;
  };

  const handleCreateNewTable = (entityName, entityType) => {
    const tableName = entityName;
    const tableType = entityType;

    if (!tableName.trim()) {
      alert("Please enter a table name");
      return;
    }

    const metadataKey = `${tableType}_${tableName}`;
    setTableMetadata((prev) => ({
      ...prev,
      [metadataKey]: {
        name: tableName,
        type: tableType,
        fields: [],
        iscustom: true,
      },
    }));

    setCustomTables((prev) => ({
      ...prev,
      [tableType]: [...prev[tableType], tableName],
    }));

    const meta_updated = {
      ...tableMetadata,
      [metadataKey]: {
        name: tableName,
        type: tableType,
        fields: [],
        iscustom: true,
      },
    };

    addTableToCanvas(tableName, tableType, [], null, meta_updated);
  };

  const handleSave = async () => {
    try {
      let finalFileName;

      if (currentDataProductName) {
        finalFileName = currentDataProductName;
      } else {
        const fileName = window.prompt(
          "Enter data product name:",
          "data_product"
        );
        if (!fileName) return;

        finalFileName = fileName.endsWith(".json")
          ? fileName
          : `${fileName}.json`;
      }

      const entities = nodes;
      const relationships = edges;
      const cleanedTableMetadata = tableMetadata;

      const dataProduct = {
        entities,
        relationships,
        metadata: {
          name: finalFileName.replace(".json", ""),
          created: new Date().toISOString(),
          tableCount: nodes.length,
          connectionCount: edges.length,
        },
        availableTables: {
          tableMetadata: cleanedTableMetadata,
          fileBaseTables,
          fileCteTables,
          fileViewTables,
          customTables,
        },
      };

      const savedProduct = await saveDataProduct(
        finalFileName,
        dataProduct,
        currentDataProductId,
        "sql"
      );

      setCurrentDataProductName(finalFileName);
      if (!currentDataProductId) {
        setCurrentDataProductId(savedProduct.id);
      }
      alert("Data product saved successfully!");
    } catch (error) {
      console.error("Error saving data product:", error);
      alert("Error saving data product: " + error.message);
    }
  };

  const handleSuggest = async () => {
    await generateSuggestions(nodes, sourceDataProduct);
  };

  const handleAddSuggestedEntity = async (suggestion) => {
    try {
      const checkEntityName = suggestion.entityName.replace(
        /^(BASE_|CTE_|VIEW_)/,
        ""
      );
      const checkEntityType =
        suggestion.entityType ||
        (suggestion.entityName.startsWith("CTE_") ? "CTE" : "VIEW");

      const entityExists = nodes.some(
        (n) =>
          n.data.tableName === checkEntityName &&
          n.data.tableType === checkEntityType
      );

      if (entityExists) {
        alert(
          `Entity "${checkEntityName}" (${checkEntityType}) already exists on canvas!`
        );
        return;
      }

      const sourceEntities = sourceDataProduct?.entities || {};
      // Construct the full entity key with prefix
      const fullEntityKey = `${checkEntityType}_${checkEntityName}`;
      const entity =
        suggestion.entityData ||
        sourceEntities[fullEntityKey] ||
        sourceEntities[suggestion.entityName];

      if (!entity) {
        alert("Entity not found in data product source");
        return;
      }

      let addedNodes = [];
      if (
        suggestion.coveragePercent < 100 &&
        suggestion.missingEntities &&
        suggestion.missingEntities.length > 0
      ) {
        for (const missingEntity of suggestion.missingEntities) {
          // Construct the full entity key for missing entities
          const missingEntityFullKey = `${missingEntity.type}_${missingEntity.name}`;
          const missingEntityData = sourceEntities[missingEntityFullKey];
          if (missingEntityData) {
            const missingFields = Array.isArray(missingEntityData.fields)
              ? missingEntityData.fields.map((f) => ({
                  name: f.name,
                  type: f.type || "unknown",
                  ref: f.ref || null,
                  calculation: f.calculation || null,
                  isPK: f.isPK || false,
                }))
              : Object.keys(missingEntityData.fields || {}).map(
                  (fieldName) => ({
                    name: fieldName,
                    type: missingEntityData.fields[fieldName].type || "unknown",
                    ref: missingEntityData.fields[fieldName].ref || null,
                    calculation:
                      missingEntityData.fields[fieldName].calculation || null,
                    isPK: missingEntityData.fields[fieldName].isPK || false,
                  })
                );

            const missingNodeId = makeNodeId();
            const missingNode = {
              id: missingNodeId,
              type: "tableNode",
              position: {
                x: Math.random() * 300 + 100,
                y: Math.random() * 300 + 100,
              },
              data: {
                tableName: missingEntity.name,
                tableType: missingEntity.type,
                fields: missingFields,
                entityKey: missingEntityFullKey,
                iscustom: false,
                selectedFields: [],
                attributeToggles: {},
                globalAttributeMode: globalAttributeMode,
                onAddField: handleAddField,
                onRemoveField: handleRemoveField,
                onDeleteTable: handleDeleteTable,
                onTogglePK: handleTogglePK,
                onShowReverseDeps: handleShowReverseDeps,
                onToggleFieldSelection: handleToggleFieldSelection,
                onOpenSettings: handleOpenSettings,
                onFieldClick: handleFieldClick,
              },
            };

            addedNodes.push(missingNode);

            if (missingEntity.type === "BASE") {
              if (!fileBaseTables.includes(missingEntity.name)) {
                setFileBaseTables((prev) => [...prev, missingEntity.name]);
              }
            } else if (missingEntity.type === "VIEW") {
              if (!fileViewTables.includes(missingEntity.name)) {
                setFileViewTables((prev) => [...prev, missingEntity.name]);
              }
            } else if (missingEntity.type === "CTE") {
              if (!fileCteTables.includes(missingEntity.name)) {
                setFileCteTables((prev) => [...prev, missingEntity.name]);
              }
            }
          }
        }
      }

      const entityFields = Array.isArray(entity.fields)
        ? entity.fields.map((f) => ({
            name: f.name,
            type: f.type || "unknown",
            ref: f.ref || null,
            calculation: f.calculation || null,
            isPK: f.isPK || false,
          }))
        : Object.keys(entity.fields || {}).map((fieldName) => ({
            name: fieldName,
            type: entity.fields[fieldName].type || "unknown",
            ref: entity.fields[fieldName].ref || null,
            calculation: entity.fields[fieldName].calculation || null,
            isPK: entity.fields[fieldName].isPK || false,
          }));

      if (checkEntityType === "BASE") {
        if (!fileBaseTables.includes(checkEntityName)) {
          setFileBaseTables((prev) => [...prev, checkEntityName]);
        }
      } else if (checkEntityType === "VIEW") {
        if (!fileViewTables.includes(checkEntityName)) {
          setFileViewTables((prev) => [...prev, checkEntityName]);
        }
      } else if (checkEntityType === "CTE") {
        if (!fileCteTables.includes(checkEntityName)) {
          setFileCteTables((prev) => [...prev, checkEntityName]);
        }
      }

      const newNodeId = makeNodeId();
      const newNode = {
        id: newNodeId,
        type: "tableNode",
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          tableName: checkEntityName,
          tableType: checkEntityType,
          fields: entityFields,
          entityKey: fullEntityKey,
          iscustom: false,
          selectedFields: [],
          attributeToggles: {},
          globalAttributeMode: globalAttributeMode,
          onAddField: handleAddField,
          onRemoveField: handleRemoveField,
          onDeleteTable: handleDeleteTable,
          onTogglePK: handleTogglePK,
          onShowReverseDeps: handleShowReverseDeps,
          onToggleFieldSelection: handleToggleFieldSelection,
          onOpenSettings: handleOpenSettings,
          onFieldClick: handleFieldClick,
        },
      };

      const updatedNodes = [...nodes, ...addedNodes, newNode];
      const newEdges = [];

      if (suggestion.dependencyMap) {
        Object.keys(suggestion.dependencyMap).forEach((dependentEntityKey) => {
          const connections = suggestion.dependencyMap[dependentEntityKey];
          const depEntityType = dependentEntityKey.split("_")[0];
          const depEntityName = dependentEntityKey.substring(
            depEntityType.length + 1
          );

          const sourceNode = updatedNodes.find((n) => {
            const nodeEntityKey = `${n.data.tableType}_${n.data.tableName}`;
            return (
              nodeEntityKey === dependentEntityKey ||
              n.data.entityKey === dependentEntityKey ||
              (n.data.tableType === depEntityType &&
                n.data.tableName === depEntityName)
            );
          });

          if (sourceNode) {
            connections.forEach((conn) => {
              const sourceFieldActual = sourceNode.data.fields.find(
                (f) => f.name.toLowerCase() === conn.sourceField.toLowerCase()
              );
              const targetFieldActual = newNode.data.fields.find(
                (f) => f.name.toLowerCase() === conn.targetField.toLowerCase()
              );

              if (sourceFieldActual && targetFieldActual) {
                const edgeColor =
                  conn.connectionType === "calculation" ? "#3b82f6" : "#ef4444";
                const edgeId = makeEdgeId();

                newEdges.push({
                  id: edgeId,
                  source: sourceNode.id,
                  target: newNodeId,
                  sourceHandle: `${sourceFieldActual.name}-source`,
                  targetHandle: `${targetFieldActual.name}-target`,
                  type: "smoothstep",
                  animated: true,
                  style: { strokeWidth: 2, stroke: edgeColor },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: edgeColor,
                  },
                  data: {
                    connectionType: conn.connectionType,
                  },
                });
              } else {
                console.debug(
                  `Skipping edge: source field "${
                    conn.sourceField
                  }" exists=${!!sourceFieldActual}, target field "${
                    conn.targetField
                  }" exists=${!!targetFieldActual}`
                );
              }
            });
          } else {
            console.debug(
              `Source node not found for dependency ${dependentEntityKey} - skipping edge creation`
            );
          }
        });
      }

      const updatedEdges = [...edges, ...newEdges];

      // Apply layout to the updated nodes and edges
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(updatedNodes, updatedEdges, "LR");

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setShowSuggestDialog(false);
    } catch (error) {
      console.error("Error adding suggested entity:", error);
      alert("Error adding suggested entity: " + error.message);
    }
  };

  const handleAddReverseDep = async (suggestion) => {
    try {
      const checkEntityName = suggestion.entityName.replace(
        /^(BASE_|CTE_|VIEW_)/,
        ""
      );
      const checkEntityType = suggestion.entityType;

      const entityExists = nodes.some(
        (n) =>
          n.data.tableName === checkEntityName &&
          n.data.tableType === checkEntityType
      );

      if (entityExists) {
        alert(
          `Entity "${checkEntityName}" (${checkEntityType}) already exists on canvas!`
        );
        return;
      }

      const entity = suggestion.entityData;
      if (!entity) {
        alert("Entity not found in data product source");
        return;
      }

      const entityFields = Array.isArray(entity.fields)
        ? entity.fields.map((f) => ({
            name: f.name,
            type: f.type || "unknown",
            ref: f.ref || null,
            calculation: f.calculation || null,
            isPK: f.isPK || false,
          }))
        : Object.keys(entity.fields || {}).map((fieldName) => ({
            name: fieldName,
            type: entity.fields[fieldName]?.type || "unknown",
            ref: entity.fields[fieldName]?.ref || null,
            calculation: entity.fields[fieldName]?.calculation || null,
            isPK: entity.fields[fieldName]?.isPK || false,
          }));

      const newNodeId = makeNodeId();
      const newNode = {
        id: newNodeId,
        type: "tableNode",
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          tableName: checkEntityName,
          tableType: checkEntityType,
          fields: entityFields,
          iscustom: false,
          selectedFields: [],
          attributeToggles: {},
          globalAttributeMode: globalAttributeMode,
          onAddField: handleAddField,
          onRemoveField: handleRemoveField,
          onDeleteTable: handleDeleteTable,
          onTogglePK: handleTogglePK,
          onShowReverseDeps: handleShowReverseDeps,
          onToggleFieldSelection: handleToggleFieldSelection,
          onOpenSettings: handleOpenSettings,
          onFieldClick: handleFieldClick,
        },
      };

      const targetNode = nodes.find(
        (n) => n.id === selectedEntityForReverseDeps.nodeId
      );

      setTableMetadata((prev) => ({
        ...prev,
        [suggestion.entityName]: {
          ...entity,
          fields: entityFields,
        },
      }));

      const newEdges = [];

      if (
        suggestion.dependencyMap &&
        selectedEntityForReverseDeps &&
        targetNode
      ) {
        Object.keys(suggestion.dependencyMap).forEach((dependentEntityKey) => {
          const connections = suggestion.dependencyMap[dependentEntityKey];

          connections.forEach((conn) => {
            const hasSourceField = newNode.data.fields.some(
              (f) => f.name === conn.sourceField
            );
            const hasTargetField = targetNode.data.fields.some(
              (f) => f.name === conn.targetField
            );

            if (hasSourceField && hasTargetField) {
              const edgeColor =
                conn.connectionType === "calculation" ? "#3b82f6" : "#ef4444";

              newEdges.push({
                id: makeEdgeId(),
                source: newNodeId,
                target: targetNode.id,
                sourceHandle: `${conn.sourceField}-source`,
                targetHandle: `${conn.targetField}-target`,
                type: "smoothstep",
                animated: true,
                style: { strokeWidth: 2, stroke: edgeColor },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: edgeColor,
                },
                data: {
                  connectionType: conn.connectionType,
                },
              });
            }
          });
        });
      }

      if (checkEntityType === "BASE") {
        if (!fileBaseTables.includes(checkEntityName)) {
          setFileBaseTables((prev) => [...prev, checkEntityName]);
        }
      } else if (checkEntityType === "VIEW") {
        if (!fileViewTables.includes(checkEntityName)) {
          setFileViewTables((prev) => [...prev, checkEntityName]);
        }
      } else if (checkEntityType === "CTE") {
        if (!fileCteTables.includes(checkEntityName)) {
          setFileCteTables((prev) => [...prev, checkEntityName]);
        }
      }

      const updatedNodes = [...nodes, newNode];
      const updatedEdges = [...edges, ...newEdges];

      // Apply layout to the updated nodes and edges
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(updatedNodes, updatedEdges, "LR");

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => {
        if (selectedEntityForReverseDeps) {
          handleShowReverseDeps(
            selectedEntityForReverseDeps.nodeId,
            selectedEntityForReverseDeps.tableName,
            selectedEntityForReverseDeps.tableType
          );
        }
      }, 300);
    } catch (error) {
      console.error("Error adding downstream dependency:", error);
      alert("Error adding downstream dependency: " + error.message);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/?modeler=sql")}
            style={{
              padding: "8px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <FiArrowLeft size={16} />
            Back
          </button>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            {currentDataProductName || "New Data Product"}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSuggest}
            style={{
              padding: "8px 16px",
              background: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <FiZap size={16} />
            Suggest
          </button>
          <button
            onClick={onLayout}
            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <FiLayout size={16} />
            Auto Layout
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: "8px 16px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <FiDownload size={16} />
            Export
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <FiSave size={16} />
            Save
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <DataProductSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTableTab}
          onTabChange={setActiveTableTab}
          searchQuery={sidebarSearchQuery}
          onSearchChange={setSidebarSearchQuery}
          fileBaseTables={fileBaseTables}
          fileViewTables={fileViewTables}
          fileCteTables={fileCteTables}
          customTables={customTables}
          onAddTable={addTableToCanvas}
          tableMetadata={tableMetadata}
          canvasEntities={nodes.map((n) => ({
            tableName: n.data.tableName,
            tableType: n.data.tableType,
          }))}
          onCreateNewEntity={handleCreateNewTable}
        />

        <div style={{ flex: 1, position: "relative" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              padding: "8px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              zIndex: 5,
            }}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <FiChevronsLeft size={16} />
            ) : (
              <FiChevronsRight size={16} />
            )}
          </button>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { strokeWidth: 2 },
            }}
            minZoom={0.1}
            maxZoom={4}
            translateExtent={[
              [-Infinity, -Infinity],
              [Infinity, Infinity],
            ]}
            nodeExtent={[
              [-Infinity, -Infinity],
              [Infinity, Infinity],
            ]}
          >
            <Background />
            <Controls />
            <MiniMap nodeColor="#3b82f6" maskColor="rgba(0, 0, 0, 0.1)" />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>

          {selectedEdge && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                onClick={() => setShowConnectionTypeDialog(true)}
                style={{
                  background: "white",
                  border:
                    selectedEdgeDetails?.data?.connectionType === "calculation"
                      ? "2px solid #8b5cf6"
                      : "2px solid #3b82f6",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color:
                    selectedEdgeDetails?.data?.connectionType === "calculation"
                      ? "#8b5cf6"
                      : "#3b82f6",
                  boxShadow:
                    selectedEdgeDetails?.data?.connectionType === "calculation"
                      ? "0 4px 8px rgba(139, 92, 246, 0.3)"
                      : "0 4px 8px rgba(59, 130, 246, 0.3)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background =
                    selectedEdgeDetails?.data?.connectionType === "calculation"
                      ? "#f3e8ff"
                      : "#eff6ff";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "white";
                  e.target.style.transform = "scale(1)";
                }}
              >
                <FiEdit2 size={16} />
                Change Type
              </button>
              <button
                onClick={deleteSelectedEdge}
                style={{
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "white",
                  boxShadow: "0 4px 8px rgba(239, 68, 68, 0.3)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "scale(1)";
                }}
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddFieldDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              minWidth: "400px",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>Add Field</h3>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Field name"
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "16px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            >
              <option value="VARCHAR">VARCHAR</option>
              <option value="INT">INT</option>
              <option value="FLOAT">FLOAT</option>
              <option value="DATE">DATE</option>
              <option value="BOOLEAN">BOOLEAN</option>
            </select>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowAddFieldDialog(false);
                  setNewFieldName("");
                  setNewFieldType("VARCHAR");
                }}
                style={{
                  padding: "8px 16px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddField}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuggestDialog && (
        <SuggestionDialog
          suggestions={suggestions}
          onAddSuggestion={handleAddSuggestedEntity}
          onClose={() => setShowSuggestDialog(false)}
          nodesCount={nodes.length}
        />
      )}

      {showReverseDepsDialog && selectedEntityForReverseDeps && (
        <ReverseDepsDialog
          reverseDeps={reverseDeps}
          selectedEntity={selectedEntityForReverseDeps}
          onAddEntity={handleAddReverseDep}
          onClose={() => setShowReverseDepsDialog(false)}
        />
      )}

      <CalculationDialog
        show={showCalculationDialog}
        onClose={() => {
          setShowCalculationDialog(false);
          setCalculationExpression("");
          setCalculationFieldNodeId(null);
          setCalculationFieldName(null);
        }}
        onSave={handleSaveCalculation}
        initialExpression={calculationExpression}
        fieldName={calculationFieldName}
        nodeId={calculationFieldNodeId}
        nodes={nodes}
        edges={edges}
      />

      <SettingsDialog
        show={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        settingsData={settingsData}
        nodes={nodes}
        globalAttributeMode={globalAttributeMode}
        setGlobalAttributeMode={setGlobalAttributeMode}
        attributeToggles={attributeToggles}
        setAttributeToggles={setAttributeToggles}
        attributeSelections={attributeSelections}
        setAttributeSelections={setAttributeSelections}
        newEntityName={newEntityName}
        setNewEntityName={setNewEntityName}
        newEntityType={newEntityType}
        setNewEntityType={setNewEntityType}
        tab1FilterMode={tab1FilterMode}
        setTab1FilterMode={setTab1FilterMode}
        attributeSearchQuery={attributeSearchQuery}
        setAttributeSearchQuery={setAttributeSearchQuery}
        activeTab={settingsActiveTab}
        setActiveTab={setSettingsActiveTab}
        onCreateByMode={handleCreateByMode}
        onCreateFromSelected={handleCreateFromSelected}
      />

      <ConnectionTypeDialog
        show={showConnectionTypeDialog}
        onClose={() => {
          setShowConnectionTypeDialog(false);
          setSelectedEdgeDetails(null);
        }}
        selectedEdgeDetails={selectedEdgeDetails}
        onChangeConnectionType={handleChangeConnectionType}
      />

      <ExportDialog
        show={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        exportJson={exportJson}
      />
    </div>
  );
};

const DataProductPageWrapper = () => (
  <ReactFlowProvider>
    <DataProductPage />
  </ReactFlowProvider>
);

export default DataProductPageWrapper;

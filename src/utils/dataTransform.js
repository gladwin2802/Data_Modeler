// src/utils/dataTransform.js
import rawModel from "../grok_output/AccountsPayableOverview.json";

/**
 * Extract table type (prefix) from table name
 * @param {string} entityName - Full entity name with prefix
 * @returns {string} The prefix: 'BASE', 'CTE', 'VIEW', or null if no prefix
 */
export function extractTableType(entityName) {
  if (entityName.startsWith("BASE_")) return "BASE";
  if (entityName.startsWith("CTE_")) return "CTE";
  if (entityName.startsWith("VIEW_")) return "VIEW";
  return null;
}

/**
 * Remove prefix from table name
 * @param {string} entityName - Full entity name with prefix
 * @returns {string} Entity name without prefix
 */
export function removeTablePrefix(entityName) {
  const prefixes = ["BASE_", "CTE_", "VIEW_"];
  for (const prefix of prefixes) {
    if (entityName.startsWith(prefix)) {
      return entityName.substring(prefix.length);
    }
  }
  return entityName;
}

/**
 * Add prefix to table name
 * @param {string} entityName - Entity name without prefix
 * @param {string} tableType - Type: 'BASE', 'CTE', 'VIEW'
 * @returns {string} Entity name with prefix
 */
export function addTablePrefix(entityName, tableType) {
  if (tableType === "BASE") return `BASE_${entityName}`;
  if (tableType === "CTE") return `CTE_${entityName}`;
  if (tableType === "VIEW") return `VIEW_${entityName}`;
  return entityName;
}

/**
 * Transforms the raw model data into ReactFlow nodes and edges
 * @param {Object} modelData - The model data object (default: imported rawModel)
 * @returns {Object} Object containing nodes and edges arrays
 */
// export function modelToFlow(modelData = {entities: {}}) {
  export function modelToFlow(modelData = rawModel) {
  const nodes = [];
  const edges = [];
  let y = 0;
  const rowHeight = 180;

  Object.entries(modelData.entities).forEach(([entityName, entity]) => {
    // entityName is the full name (may include prefix like BASE_, CTE_, VIEW_)
    const tableType = extractTableType(entityName);
    const displayName = removeTablePrefix(entityName);
    // Use the full entityName (with prefix) as the node id to avoid collisions
    // when multiple prefixed entities share the same display name.
    const nodeId = entityName;

    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y },
      data: {
        // keep a user-friendly label without prefix
        label: displayName,
        alias: entity.alias || "",
        fields: Object.entries(entity.fields).map(([fname, fdata]) => ({
          name: fname,
          ...fdata,
        })),
        tableType: tableType || "BASE",
      },
    });

    // Normal ref edges
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (field.ref) {
        field.ref.forEach((ref) => {
          const [sourceEntity, sourceField] = ref.split(".");
          // Use full prefixed entity names for edge endpoints and handles
          edges.push({
            id: `ref-${sourceEntity}.${sourceField}->${entityName}.${fieldName}`,
            ref_type: "normal",
            type: "smoothstep",
            source: sourceEntity,
            target: entityName,
            sourceHandle: `${sourceEntity}-${sourceField}`,
            targetHandle: `${entityName}-${fieldName}`,
            animated: true,
            style: { stroke: "#fd5d5dff" },
          });
        });
      }

      // Calculation edges
      if (field.calculation?.ref) {
        field.calculation.ref.forEach((ref) => {
          const [srcE, srcF] = ref.split(".");
          edges.push({
            id: `calc-${srcE}.${srcF}->${entityName}.${fieldName}`,
            ref_type: "calculation",
            source: srcE,
            type: "smoothstep",
            target: entityName,
            sourceHandle: `${srcE}-${srcF}`,
            targetHandle: `${entityName}-${fieldName}`,
            animated: false,
            style: { stroke: "#0066ff", strokeDasharray: "5,5" },
          });
        });
      }
    });

    y += rowHeight;
  });

  return { nodes, edges };
}


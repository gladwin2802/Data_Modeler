// src/utils/dataTransform.js
import rawModel from "../grok_output/VendorPerformance.json";

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
 * @returns {Object} Object containing nodes and edges arrays
 */
export function modelToFlow() {
  const nodes = [];
  const edges = [];
  let y = 0;
  const rowHeight = 180;

  Object.entries(rawModel.entities).forEach(([entityName, entity]) => {
    const tableType = extractTableType(entityName);
    const displayName = removeTablePrefix(entityName);
    const nodeId = displayName;

    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y },
      data: {
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
          const sourceDisplayName = removeTablePrefix(sourceEntity);
          edges.push({
            id: `ref-${sourceDisplayName}.${sourceField}->${displayName}.${fieldName}`,
            ref_type: "normal",
            type: "smoothstep",
            source: sourceDisplayName,
            target: displayName,
            sourceHandle: `${sourceDisplayName}-${sourceField}`,
            targetHandle: `${displayName}-${fieldName}`,
            animated: true,
            style: { stroke: "#fd5d5dff" },
          });
        });
      }

      // Calculation edges
      if (field.calculation?.ref) {
        field.calculation.ref.forEach((ref) => {
          const [srcE, srcF] = ref.split(".");
          const srcDisplayName = removeTablePrefix(srcE);
          edges.push({
            id: `calc-${srcDisplayName}.${srcF}->${displayName}.${fieldName}`,
            ref_type: "calculation",
            source: srcDisplayName,
            type: "smoothstep",
            target: displayName,
            sourceHandle: `${srcDisplayName}-${srcF}`,
            targetHandle: `${displayName}-${fieldName}`,
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


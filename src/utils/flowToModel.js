/**
 * Add prefix to table name
 * @param {string} displayName - Entity name without prefix
 * @param {string} tableType - Type: 'BASE', 'CTE', 'VIEW'
 * @returns {string} Entity name with prefix
 */
function addTablePrefix(displayName, tableType) {
    if (tableType === "BASE") return `BASE_${displayName}`;
    if (tableType === "CTE") return `CTE_${displayName}`;
    if (tableType === "VIEW") return `VIEW_${displayName}`;
    return displayName;
}

/**
 * Converts ReactFlow nodes and edges back to the JSON model format
 * @param {Array} nodes - Array of ReactFlow nodes
 * @param {Array} edges - Array of ReactFlow edges
 * @returns {Object} JSON model in the format matching AccountsPayable.json
 */
export function flowToModel(nodes, edges) {
    const entities = {};

    // Process each node
    nodes.forEach((node) => {
        const displayName = node.data.label || node.id;
        const tableType = node.data.tableType || "BASE";
        const entityName = addTablePrefix(displayName, tableType);
        const alias = node.data.alias || "";
        
        const entity = {
            ...(alias && { alias }),
            fields: {},
        };

        // Process each field in the node
        if (node.data.fields) {
            node.data.fields.forEach((field) => {
                const fieldName = field.name;
                const fieldData = {};

                // Collect normal references from edges
                const normalRefsFromEdges = edges
                    .filter(
                        (e) =>
                            e.ref_type === "normal" &&
                            e.target === displayName &&
                            e.targetHandle === `${displayName}-${fieldName}`
                    )
                    .map((e) => {
                        const sourceFieldName = e.sourceHandle.replace(
                            `${e.source}-`,
                            ""
                        );
                        // Find the source node to get its table type
                        const sourceNode = nodes.find((n) => n.id === e.source);
                        const sourceTableType = sourceNode?.data.tableType || "BASE";
                        const sourceEntityName = addTablePrefix(e.source, sourceTableType);
                        return `${sourceEntityName}.${sourceFieldName}`;
                    });

                // Collect calculation references from edges
                const calcRefsFromEdges = edges
                    .filter(
                        (e) =>
                            e.ref_type === "calculation" &&
                            e.target === displayName &&
                            e.targetHandle === `${displayName}-${fieldName}`
                    )
                    .map((e) => {
                        const sourceFieldName = e.sourceHandle.replace(
                            `${e.source}-`,
                            ""
                        );
                        // Find the source node to get its table type
                        const sourceNode = nodes.find((n) => n.id === e.source);
                        const sourceTableType = sourceNode?.data.tableType || "BASE";
                        const sourceEntityName = addTablePrefix(e.source, sourceTableType);
                        return `${sourceEntityName}.${sourceFieldName}`;
                    });

                // Merge existing refs from field data with refs from edges
                // For existing refs, we need to convert display names back to full names
                let existingRefs = field.ref || [];
                existingRefs = existingRefs.map((ref) => {
                    const [refEntity, refField] = ref.split(".");
                    // Try to find if this ref entity exists in nodes
                    const refNode = nodes.find((n) => n.id === refEntity);
                    if (refNode) {
                        const refTableType = refNode.data.tableType || "BASE";
                        return `${addTablePrefix(refEntity, refTableType)}.${refField}`;
                    }
                    return ref;
                });
                
                const allNormalRefs = [...new Set([...existingRefs, ...normalRefsFromEdges])];
                
                // Handle calculation
                // Use calculation from field data if it exists, otherwise build from edges
                let calculation = null;
                if (field.calculation) {
                    // Use existing calculation expression and refs
                    let calcRefs = field.calculation.ref || [];
                    // Convert display names back to full names
                    calcRefs = calcRefs.map((ref) => {
                        const [refEntity, refField] = ref.split(".");
                        // Try to find if this ref entity exists in nodes
                        const refNode = nodes.find((n) => n.id === refEntity);
                        if (refNode) {
                            const refTableType = refNode.data.tableType || "BASE";
                            return `${addTablePrefix(refEntity, refTableType)}.${refField}`;
                        }
                        return ref;
                    });
                    // Merge with refs from calculation edges
                    const allCalcRefs = [...new Set([...calcRefs, ...calcRefsFromEdges])];
                    
                    calculation = {
                        expression: field.calculation.expression || "",
                        ref: allCalcRefs,
                    };
                } else if (calcRefsFromEdges.length > 0) {
                    // No calculation object but we have calculation edges
                    // This shouldn't normally happen, but handle it gracefully
                    calculation = {
                        expression: "",
                        ref: calcRefsFromEdges,
                    };
                }

                // Match the format: if field has no refs and no calculation, use empty object {}
                // Otherwise include ref array and/or calculation
                if (allNormalRefs.length === 0 && !calculation) {
                    // Simple field with no refs or calculations - use empty object
                    entity.fields[fieldName] = {};
                } else {
                    // Field has refs or calculations - include them
                    if (allNormalRefs.length > 0) {
                        fieldData.ref = allNormalRefs;
                    } else {
                        // Some fields in the format have ref: [] even when empty
                        // especially when there's a calculation
                        fieldData.ref = [];
                    }
                    
                    if (calculation) {
                        fieldData.calculation = calculation;
                    }
                    
                    entity.fields[fieldName] = fieldData;
                }
            });
        }

        entities[entityName] = entity;
    });

    return {
        entities,
    };
}


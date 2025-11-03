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
        // node.id may now be a full prefixed entity name (e.g. BASE_..., CTE_...)
        // node.data.label holds the user-facing name without prefix.
        const displayName = node.data.label || node.id;
        const tableType = node.data.tableType || "BASE";
        // If node.id already contains a known prefix, use it as the entity name;
        // otherwise construct the prefixed name from displayName and tableType.
        let entityName;
        if (
            node.id.startsWith("BASE_") ||
            node.id.startsWith("CTE_") ||
            node.id.startsWith("VIEW_")
        ) {
            entityName = node.id;
        } else {
            entityName = addTablePrefix(displayName, tableType);
        }
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
                // Collect normal references from edges. Edges use full entity ids
                // for source/target (e.g. BASE_...), so match against entityName.
                const normalRefsFromEdges = edges
                    .filter(
                        (e) =>
                            e.ref_type === "normal" &&
                            e.target === entityName &&
                            e.targetHandle === `${entityName}-${fieldName}`
                    )
                    .map((e) => {
                        const sourceFieldName = e.sourceHandle.replace(`${e.source}-`, "");
                        // e.source should be a full entity id when created by modelToFlow
                        const sourceEntityName = e.source &&
                            (e.source.startsWith("BASE_") || e.source.startsWith("CTE_") || e.source.startsWith("VIEW_"))
                            ? e.source
                            : (nodes.find((n) => n.id === e.source)?.id || addTablePrefix(e.source, "BASE"));
                        return `${sourceEntityName}.${sourceFieldName}`;
                    });

                // Collect calculation references from edges
                const calcRefsFromEdges = edges
                    .filter(
                        (e) =>
                            e.ref_type === "calculation" &&
                            e.target === entityName &&
                            e.targetHandle === `${entityName}-${fieldName}`
                    )
                    .map((e) => {
                        const sourceFieldName = e.sourceHandle.replace(`${e.source}-`, "");
                        const sourceEntityName = e.source &&
                            (e.source.startsWith("BASE_") || e.source.startsWith("CTE_") || e.source.startsWith("VIEW_"))
                            ? e.source
                            : (nodes.find((n) => n.id === e.source)?.id || addTablePrefix(e.source, "BASE"));
                        return `${sourceEntityName}.${sourceFieldName}`;
                    });

                // Merge existing refs from field data with refs from edges
                // For existing refs, we need to convert display names back to full names
                // Normalize existing refs in the field data. If a ref already
                // contains a prefix (BASE_/CTE_/VIEW_) keep it. If it uses a
                // display name, map to the node's id (which is the prefixed name).
                let existingRefs = field.ref || [];
                existingRefs = existingRefs.map((ref) => {
                    const [refEntity, refField] = ref.split(".");
                    if (!refEntity) return ref;
                    // If already prefixed, leave as-is
                    if (
                        refEntity.startsWith("BASE_") ||
                        refEntity.startsWith("CTE_") ||
                        refEntity.startsWith("VIEW_")
                    ) {
                        return ref;
                    }
                    // Try to find node by id or by label
                    const refNode = nodes.find((n) => n.id === refEntity || n.data?.label === refEntity);
                    if (refNode) {
                        return `${refNode.id}.${refField}`;
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
                    // Normalize calculation refs similarly to existingRefs
                    calcRefs = calcRefs.map((ref) => {
                        const [refEntity, refField] = ref.split(".");
                        if (!refEntity) return ref;
                        if (
                            refEntity.startsWith("BASE_") ||
                            refEntity.startsWith("CTE_") ||
                            refEntity.startsWith("VIEW_")
                        ) {
                            return ref;
                        }
                        const refNode = nodes.find((n) => n.id === refEntity || n.data?.label === refEntity);
                        if (refNode) {
                            return `${refNode.id}.${refField}`;
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
                // Otherwise include ref array (only when non-empty) and/or calculation
                if (allNormalRefs.length === 0 && !calculation) {
                    // Simple field with no refs or calculations - use empty object
                    entity.fields[fieldName] = {};
                } else {
                    // Field has refs and/or calculations - include them
                    if (allNormalRefs.length > 0) {
                        fieldData.ref = allNormalRefs;
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


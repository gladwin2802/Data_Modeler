import { useCallback } from "react";
import {
    updateNodeInNodes,
    updateFieldInFields,
    generateUniqueTableName,
    calculateCenterPosition,
} from "../utils/nodeUtils";
import { addTablePrefix } from "../utils/dataTransform";
import { getHandleId } from "../utils/edgeUtils";

/**
 * Custom hook for node-related handlers
 * @param {Array} nodes - Current nodes array
 * @param {Array} edges - Current edges array
 * @param {Function} setNodes - Function to update nodes
 * @param {Function} setEdges - Function to update edges
 * @param {Function} setEditingNode - Function to set editing node
 * @param {Function} setEditingLabels - Function to set editing labels
 * @param {Function} setEditingAliases - Function to set editing aliases
 * @returns {Object} Object containing all node handlers
 */
export const useNodeHandlers = (
    nodes,
    edges,
    setNodes,
    setEdges,
    setEditingNode,
    setEditingLabels,
    setEditingAliases
) => {
    const handleAddField = useCallback(
        (nodeId, fieldName) => {
            if (!fieldName || fieldName.trim() === "") return;

            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => {
                    const fieldExists = node.data.fields.some(
                        (f) => f.name === fieldName
                    );
                    if (fieldExists) return node;

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            fields: [
                                ...node.data.fields,
                                { name: fieldName.trim() },
                            ],
                        },
                    };
                })
            );
        },
        [setNodes]
    );

    const handleUpdateNodeLabel = useCallback(
        (nodeId, newLabel) => {
            if (!newLabel || newLabel.trim() === "") return;

            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => {
                    const oldLabel = node.id;
                    const updatedNode = {
                        ...node,
                        id: newLabel.trim(),
                        data: { ...node.data, label: newLabel.trim() },
                    };

                    // Update all edges that reference this node
                    setEdges((eds) =>
                        eds.map((edge) => {
                            const updatedEdge = { ...edge };
                            if (edge.source === oldLabel) {
                                updatedEdge.source = newLabel.trim();
                                updatedEdge.sourceHandle =
                                    updatedEdge.sourceHandle?.replace(
                                        `${oldLabel}-`,
                                        `${newLabel.trim()}-`
                                    );
                            }
                            if (edge.target === oldLabel) {
                                updatedEdge.target = newLabel.trim();
                                updatedEdge.targetHandle =
                                    updatedEdge.targetHandle?.replace(
                                        `${oldLabel}-`,
                                        `${newLabel.trim()}-`
                                    );
                            }
                            return updatedEdge;
                        })
                    );

                    return updatedNode;
                })
            );
        },
        [setNodes, setEdges]
    );

    const handleUpdateNodeAlias = useCallback(
        (nodeId, newAlias) => {
            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        alias: newAlias.trim(),
                    },
                }))
            );
        },
        [setNodes]
    );

    const handleUpdateFieldName = useCallback(
        (nodeId, oldFieldName, newFieldName) => {
            if (
                !newFieldName ||
                newFieldName.trim() === "" ||
                oldFieldName === newFieldName.trim()
            ) {
                return;
            }

            const oldHandle = getHandleId(nodeId, oldFieldName);
            const newHandle = getHandleId(nodeId, newFieldName.trim());

            // Update field name in node
            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => {
                    const field = node.data.fields.find((f) => f.name === oldFieldName);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            fields: updateFieldInFields(
                                node.data.fields,
                                oldFieldName,
                                () => ({ ...field, name: newFieldName.trim() })
                            ),
                        },
                    };
                })
            );

            // Update all edges that reference this field
            setEdges((eds) =>
                eds.map((edge) => {
                    const updatedEdge = { ...edge };
                    if (edge.sourceHandle === oldHandle) {
                        updatedEdge.sourceHandle = newHandle;
                        updatedEdge.id = updatedEdge.id.replace(
                            oldHandle,
                            newHandle
                        );
                    }
                    if (edge.targetHandle === oldHandle) {
                        updatedEdge.targetHandle = newHandle;
                        updatedEdge.id = updatedEdge.id.replace(
                            oldHandle,
                            newHandle
                        );
                    }
                    return updatedEdge;
                })
            );
        },
        [setNodes, setEdges]
    );

    const handleDeleteField = useCallback(
        (nodeId, fieldName) => {
            const handleId = getHandleId(nodeId, fieldName);

            // Delete field from node
            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        fields: node.data.fields.filter(
                            (f) => f.name !== fieldName
                        ),
                    },
                }))
            );

            // Delete all edges connected to this field
            setEdges((eds) =>
                eds.filter(
                    (edge) =>
                        edge.sourceHandle !== handleId &&
                        edge.targetHandle !== handleId
                )
            );
        },
        [setNodes, setEdges]
    );

    const handleUpdateFieldCalculation = useCallback(
        (nodeId, fieldName, expression) => {
            setNodes((nds) =>
                updateNodeInNodes(nds, nodeId, (node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        fields: updateFieldInFields(
                            node.data.fields,
                            fieldName,
                            (field) => ({
                                ...field,
                                calculation: {
                                    ...field.calculation,
                                    expression: expression,
                                },
                            })
                        ),
                    },
                }))
            );
        },
        [setNodes]
    );

    const handleAddNewTable = useCallback((tableType = "BASE") => {
        const tableName = generateUniqueTableName(nodes);
        const position = calculateCenterPosition();

        // Use prefixed entity name as the node id so newly created tables
        // are consistent with imported nodes which include prefixes.
        const prefixedId = addTablePrefix(tableName, tableType);

        const newNode = {
            id: prefixedId,
            type: "tableNode",
            position,
            data: {
                // user-facing label (without prefix)
                label: tableName,
                alias: "",
                fields: [],
                tableType: tableType,
            },
        };

        setNodes((nds) => [...nds, newNode]);

        // Automatically enter edit mode for the new table
        setEditingNode(prefixedId);
        setEditingLabels((prev) => ({
            ...prev,
            [prefixedId]: tableName,
        }));
        setEditingAliases((prev) => ({
            ...prev,
            [prefixedId]: "",
        }));

        // Return the new node info for navigation
        return { nodeId: prefixedId, position };
    }, [nodes, setNodes, setEditingNode, setEditingLabels, setEditingAliases]);

    const handleDeleteTable = useCallback(
        (nodeId) => {
            // Delete all edges connected to this node
            setEdges((eds) =>
                eds.filter(
                    (edge) =>
                        edge.source !== nodeId &&
                        edge.target !== nodeId
                )
            );

            // Delete the node
            setNodes((nds) =>
                nds.filter((node) => node.id !== nodeId)
            );
        },
        [setNodes, setEdges]
    );

    return {
        handleAddField,
        handleUpdateNodeLabel,
        handleUpdateNodeAlias,
        handleUpdateFieldName,
        handleDeleteField,
        handleUpdateFieldCalculation,
        handleAddNewTable,
        handleDeleteTable,
    };
};


import { useMemo } from "react";

/**
 * Custom hook for decorating nodes with additional data
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @param {Object} selectedField - Selected field object
 * @param {string} editingNode - ID of node being edited
 * @param {Object} editingLabels - Object mapping node IDs to editing label values
 * @param {Object} editingAliases - Object mapping node IDs to editing alias values
 * @param {Function} handleFieldClick - Function to handle field click
 * @param {Function} handleAddField - Function to handle adding a field
 * @param {Function} handleUpdateNodeLabel - Function to handle updating node label
 * @param {Function} handleUpdateNodeAlias - Function to handle updating node alias
 * @param {Function} handleUpdateFieldName - Function to handle updating field name
 * @param {Function} handleDeleteField - Function to handle deleting a field
 * @param {Function} handleUpdateFieldCalculation - Function to handle updating field calculation
 * @param {Function} handleDeleteFieldRef - Function to handle deleting field reference
 * @param {Function} handleLabelChange - Function to handle label change
 * @param {Function} handleAliasChange - Function to handle alias change
 * @param {Function} handleEditClick - Function to handle edit click
 * @returns {Array} Decorated nodes
 */
export const useNodeDecoration = (
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
) => {
    const decoratedNodes = useMemo(() => {
        return nodes.map((n) => ({
            ...n,
            data: {
                ...n.data,
                nodeId: n.id,
                tableType: n.data.tableType || "BASE",
                onFieldClick: (fieldName) => {
                    const fieldData = n.data.fields.find(
                        (f) => f.name === fieldName
                    );
                    handleFieldClick(n.id, fieldName, fieldData);
                },
                selectedField,
                isEditing: editingNode === n.id,
                editingLabel: editingLabels[n.id] ?? n.data.label,
                editingAlias: editingAliases[n.id] ?? n.data.alias ?? "",
                onLabelChange: (value) => handleLabelChange(n.id, value),
                onAliasChange: (value) => handleAliasChange(n.id, value),
                onEditClick: () => handleEditClick(n.id, n.data),
                onAddField: (fieldName) => handleAddField(n.id, fieldName),
                onUpdateLabel: (newLabel) =>
                    handleUpdateNodeLabel(n.id, newLabel),
                onUpdateAlias: (newAlias) =>
                    handleUpdateNodeAlias(n.id, newAlias),
                onUpdateFieldName: (oldName, newName) =>
                    handleUpdateFieldName(n.id, oldName, newName),
                onDeleteField: (fieldName) =>
                    handleDeleteField(n.id, fieldName),
                onUpdateFieldCalculation: (fieldName, expression) =>
                    handleUpdateFieldCalculation(n.id, fieldName, expression),
                onDeleteFieldRef: (fieldName, ref, isCalcRef) =>
                    handleDeleteFieldRef(n.id, fieldName, ref, isCalcRef),
                edges: edges.filter(
                    (e) => e.source === n.id || e.target === n.id
                ),
                onDeleteTable: () => handleDeleteTable(n.id),
            },
        }));
    }, [
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
        handleDeleteTable,
    ]);

    return decoratedNodes;
};


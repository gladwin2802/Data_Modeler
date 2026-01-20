import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const CreateEntityByJoinDialog = ({
    isOpen,
    onClose,
    onCreateEntity,
    fileBaseTables,
    fileViewTables,
    fileCteTables = [],
    customTables,
    tableMetadata,
    canvasEntities = []
}) => {
    const [newEntityName, setNewEntityName] = React.useState('');
    const [newEntityType, setNewEntityType] = React.useState('VIEW');
    const [selectedTables, setSelectedTables] = React.useState([]);
    const [joinConditions, setJoinConditions] = React.useState([]);
    const [selectedFields, setSelectedFields] = React.useState([]);
    const [projectFieldsTableFilter, setProjectFieldsTableFilter] = React.useState('');
    
    const [currentJoinCondition, setCurrentJoinCondition] = React.useState({
        from: { tableId: '', field: '' },
        to: { tableId: '', field: '' },
        type: 'INNER'
    });
    const [fromFieldSearch, setFromFieldSearch] = React.useState('');
    const [toFieldSearch, setToFieldSearch] = React.useState('');

    const handleCreateByJoin = () => {
        if (!newEntityName.trim()) {
            alert('Please enter an entity name');
            return;
        }
        if (selectedTables.length < 2) {
            alert('Please select at least 2 tables');
            return;
        }
        if (joinConditions.length === 0) {
            alert('Please add at least one join condition');
            return;
        }
        if (selectedFields.length === 0) {
            alert('Please select at least one field to project');
            return;
        }
        
        onCreateEntity(newEntityName, newEntityType, {
            mode: 'join',
            tables: selectedTables,
            joinConditions,
            projectedFields: selectedFields
        });
        
        resetForm();
    };

    const resetForm = () => {
        setNewEntityName('');
        setNewEntityType('VIEW');
        setSelectedTables([]);
        setJoinConditions([]);
        setSelectedFields([]);
        setProjectFieldsTableFilter('');
        setCurrentJoinCondition({ from: { tableId: '', field: '' }, to: { tableId: '', field: '' }, type: 'INNER' });
        setFromFieldSearch('');
        setToFieldSearch('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addJoinCondition = () => {
        if (!currentJoinCondition.from.field || !currentJoinCondition.to.field) {
            alert('Please select both FROM and TO fields');
            return;
        }
        
        setJoinConditions(prev => [...prev, currentJoinCondition]);
        setCurrentJoinCondition({ from: { tableId: '', field: '' }, to: { tableId: '', field: '' }, type: 'INNER' });
        setFromFieldSearch('');
        setToFieldSearch('');
    };

    const removeJoinCondition = (index) => {
        setJoinConditions(prev => prev.filter((_, i) => i !== index));
    };

    const toggleTableSelection = (tableName, tableType) => {
        const tableId = `${tableType}_${tableName}`;
        setSelectedTables(prev => 
            prev.includes(tableId) 
                ? prev.filter(t => t !== tableId)
                : [...prev, tableId]
        );
    };

    const toggleFieldSelection = (tableName, fieldName) => {
        const fieldId = `${tableName}.${fieldName}`;
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const getAllAvailableTables = () => {
        return [
            ...fileBaseTables.map(t => ({ name: t, type: 'BASE' })),
            ...fileCteTables.map(t => ({ name: t, type: 'CTE' })),
            ...fileViewTables.map(t => ({ name: t, type: 'VIEW' })),
            ...customTables.BASE.map(t => ({ name: t, type: 'BASE' })),
            ...customTables.CTE.map(t => ({ name: t, type: 'CTE' })),
            ...customTables.VIEW.map(t => ({ name: t, type: 'VIEW' }))
        ];
    };

    const getFieldsForTable = (tableType, tableName) => {
        return tableMetadata[`${tableType}_${tableName}`]?.fields || [];
    };

    const getTableAbbreviations = () => {
        const abbr = {};
        selectedTables.forEach((tableId, index) => {
            abbr[tableId] = String.fromCharCode(65 + index);
        });
        return abbr;
    };

    const getFilteredFields = (tableId, searchTerm) => {
        const [tableType, ...tableNameParts] = tableId.split('_');
        const tableName = tableNameParts.join('_');
        const fields = getFieldsForTable(tableType, tableName);
        
        if (!searchTerm.trim()) {
            return fields;
        }
        
        return fields.filter(field =>
            field.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const isOnCanvas = (tableName, tableType) => {
        return canvasEntities.some(entity => 
            entity.tableName === tableName && entity.tableType === tableType
        );
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
        }}>
            <div style={{
                background: "white",
                borderRadius: "8px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "90vh",
                boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #e5e7eb",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
                        Create Entity by Join
                    </h2>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6b7280",
                            fontSize: "20px",
                            transition: "color 200ms ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#1f2937"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "24px"
                }}>
                    {/* Entity Name */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                            Entity Name
                        </label>
                        <input
                            type="text"
                            value={newEntityName}
                            onChange={(e) => setNewEntityName(e.target.value)}
                            placeholder="e.g., CustomerOrders"
                            autoFocus
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Entity Type */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                            Entity Type
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {['BASE', 'CTE', 'VIEW'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setNewEntityType(type)}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        border: `2px solid ${newEntityType === type 
                                            ? (type === 'BASE' ? '#3b82f6' : type === 'CTE' ? '#8b5cf6' : '#10b981')
                                            : '#e5e7eb'}`,
                                        borderRadius: "6px",
                                        background: newEntityType === type 
                                            ? (type === 'BASE' ? '#eff6ff' : type === 'CTE' ? '#f3e8ff' : '#d1fae5')
                                            : 'white',
                                        color: newEntityType === type 
                                            ? (type === 'BASE' ? '#1e40af' : type === 'CTE' ? '#6b21a8' : '#065f46')
                                            : '#6b7280',
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        transition: "all 200ms ease",
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Select Tables */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                            Select Tables (min. 2)
                        </label>
                        <div style={{ 
                            border: "1px solid #d1d5db", 
                            borderRadius: "6px", 
                            maxHeight: "120px", 
                            overflow: "auto",
                            padding: "8px"
                        }}>
                            {getAllAvailableTables().map((table) => {
                                const tableId = `${table.type}_${table.name}`;
                                const isSelected = selectedTables.includes(tableId);
                                const onCanvas = isOnCanvas(table.name, table.type);
                                
                                return (
                                    <div key={tableId} style={{
                                        padding: "8px",
                                        marginBottom: "4px",
                                        background: isSelected ? '#eff6ff' : 'white',
                                        border: `1px solid ${isSelected ? '#bfdbfe' : '#e5e7eb'}`,
                                        borderRadius: "4px",
                                        cursor: onCanvas ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        opacity: onCanvas ? 0.6 : 1,
                                        transition: "all 150ms ease"
                                    }}
                                    onClick={() => !onCanvas && toggleTableSelection(table.name, table.type)}
                                    onMouseEnter={(e) => {
                                        if (!onCanvas) {
                                            e.currentTarget.style.background = '#f0f9ff';
                                            e.currentTarget.style.borderColor = '#93c5fd';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isSelected ? '#eff6ff' : 'white';
                                        e.currentTarget.style.borderColor = isSelected ? '#bfdbfe' : '#e5e7eb';
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}}
                                            disabled={onCanvas}
                                            style={{ cursor: onCanvas ? "not-allowed" : "pointer" }}
                                        />
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>
                                            {table.type}_{table.name}
                                        </span>
                                        {onCanvas && (
                                            <FiCheckCircle size={14} style={{ color: "#10b981", marginLeft: "auto" }} title="On Canvas" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Join Conditions */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                            Join Conditions
                        </label>
                        
                        <div style={{ 
                            border: "1px solid #d1d5db", 
                            borderRadius: "6px", 
                            padding: "12px",
                            marginBottom: "12px",
                            background: "#fafafa"
                        }}>
                            {/* FROM */}
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                                    FROM
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                                            Table
                                        </label>
                                        <select
                                            value={currentJoinCondition.from.tableId || ''}
                                            onChange={(e) => setCurrentJoinCondition(prev => ({
                                                ...prev,
                                                from: { ...prev.from, tableId: e.target.value, field: '' }
                                            }))}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        >
                                            <option value="">Select table...</option>
                                            {selectedTables.map(tableId => {
                                                const [type, ...nameParts] = tableId.split('_');
                                                const name = nameParts.join('_');
                                                return (
                                                    <option key={tableId} value={tableId}>
                                                        {type}_{name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                                            Field
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search fields..."
                                            value={fromFieldSearch}
                                            onChange={(e) => setFromFieldSearch(e.target.value)}
                                            disabled={!currentJoinCondition.from.tableId}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box",
                                                background: !currentJoinCondition.from.tableId ? "#f3f4f6" : "white",
                                                color: !currentJoinCondition.from.tableId ? "#9ca3af" : "#374151",
                                                marginBottom: "6px"
                                            }}
                                        />
                                        <select
                                            value={currentJoinCondition.from.field || ''}
                                            onChange={(e) => setCurrentJoinCondition(prev => ({
                                                ...prev,
                                                from: { ...prev.from, field: e.target.value }
                                            }))}
                                            disabled={!currentJoinCondition.from.tableId}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box",
                                                background: !currentJoinCondition.from.tableId ? "#f3f4f6" : "white",
                                                color: !currentJoinCondition.from.tableId ? "#9ca3af" : "#374151"
                                            }}
                                        >
                                            <option value="">Select field...</option>
                                            {currentJoinCondition.from.tableId && getFilteredFields(
                                                currentJoinCondition.from.tableId,
                                                fromFieldSearch
                                            ).map((field, idx) => (
                                                <option key={idx} value={`${currentJoinCondition.from.tableId}.${field.name}`}>
                                                    {field.name} ({field.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* TO */}
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                                    TO
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                                            Table
                                        </label>
                                        <select
                                            value={currentJoinCondition.to.tableId || ''}
                                            onChange={(e) => setCurrentJoinCondition(prev => ({
                                                ...prev,
                                                to: { ...prev.to, tableId: e.target.value, field: '' }
                                            }))}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        >
                                            <option value="">Select table...</option>
                                            {selectedTables.map(tableId => {
                                                const [type, ...nameParts] = tableId.split('_');
                                                const name = nameParts.join('_');
                                                return (
                                                    <option key={tableId} value={tableId}>
                                                        {type}_{name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                                            Field
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search fields..."
                                            value={toFieldSearch}
                                            onChange={(e) => setToFieldSearch(e.target.value)}
                                            disabled={!currentJoinCondition.to.tableId}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box",
                                                background: !currentJoinCondition.to.tableId ? "#f3f4f6" : "white",
                                                color: !currentJoinCondition.to.tableId ? "#9ca3af" : "#374151",
                                                marginBottom: "6px"
                                            }}
                                        />
                                        <select
                                            value={currentJoinCondition.to.field || ''}
                                            onChange={(e) => setCurrentJoinCondition(prev => ({
                                                ...prev,
                                                to: { ...prev.to, field: e.target.value }
                                            }))}
                                            disabled={!currentJoinCondition.to.tableId}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                outline: "none",
                                                boxSizing: "border-box",
                                                background: !currentJoinCondition.to.tableId ? "#f3f4f6" : "white",
                                                color: !currentJoinCondition.to.tableId ? "#9ca3af" : "#374151"
                                            }}
                                        >
                                            <option value="">Select field...</option>
                                            {currentJoinCondition.to.tableId && getFilteredFields(
                                                currentJoinCondition.to.tableId,
                                                toFieldSearch
                                            ).map((field, idx) => (
                                                <option key={idx} value={`${currentJoinCondition.to.tableId}.${field.name}`}>
                                                    {field.name} ({field.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Join Type */}
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                                    Join Type
                                </label>
                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                    {['INNER', 'LEFT', 'RIGHT', 'FULL'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setCurrentJoinCondition(prev => ({
                                                ...prev,
                                                type
                                            }))}
                                            style={{
                                                padding: "6px 10px",
                                                border: `1px solid ${currentJoinCondition.type === type ? '#3b82f6' : '#d1d5db'}`,
                                                background: currentJoinCondition.type === type ? '#dbeafe' : 'white',
                                                color: currentJoinCondition.type === type ? '#1e40af' : '#6b7280',
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                transition: "all 150ms ease"
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={addJoinCondition}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 150ms ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                            >
                                Add Join Condition
                            </button>
                        </div>

                        {/* Added Conditions */}
                        {joinConditions.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "block" }}>
                                    Added Conditions ({joinConditions.length})
                                </label>
                                <div style={{ 
                                    border: "1px solid #d1d5db", 
                                    borderRadius: "6px", 
                                    maxHeight: "150px", 
                                    overflow: "auto"
                                }}>
                                    {joinConditions.map((condition, index) => (
                                        <div key={index} style={{
                                            padding: "8px",
                                            borderBottom: index < joinConditions.length - 1 ? "1px solid #e5e7eb" : "none",
                                            background: index % 2 === 0 ? "#f9fafb" : "white",
                                            fontSize: "12px",
                                            color: "#374151",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>
                                                    {condition.from.field}
                                                </div>
                                                <div style={{ margin: "2px 0", color: "#9ca3af" }}>→ {condition.type} →</div>
                                                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>
                                                    {condition.to.field}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeJoinCondition(index)}
                                                style={{
                                                    padding: "4px 8px",
                                                    background: "#fee2e2",
                                                    color: "#dc2626",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    marginLeft: "8px",
                                                    transition: "all 150ms ease"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#fecaca"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "#fee2e2"}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Project Fields */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                Project Fields
                            </label>
                            <select
                                value={projectFieldsTableFilter}
                                onChange={(e) => setProjectFieldsTableFilter(e.target.value)}
                                style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    outline: "none",
                                    cursor: "pointer",
                                    background: "white"
                                }}
                            >
                                <option value="">All Tables</option>
                                {selectedTables.map(tableId => {
                                    const [type, ...nameParts] = tableId.split('_');
                                    const name = nameParts.join('_');
                                    return (
                                        <option key={tableId} value={tableId}>
                                            {type}_{name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Selected Fields Display */}
                        {selectedFields.length > 0 && (
                            <div style={{
                                border: "1px solid #d1fae5",
                                background: "#f0fdf4",
                                borderRadius: "6px",
                                padding: "8px",
                                marginBottom: "8px"
                            }}>
                                <label style={{ fontSize: "11px", fontWeight: 600, color: "#059669", display: "block", marginBottom: "6px" }}>
                                    Selected Fields ({selectedFields.length})
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {selectedFields.map(fieldId => (
                                        <div key={fieldId} style={{
                                            background: "#10b981",
                                            color: "white",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}>
                                            <span>{fieldId}</span>
                                            <button
                                                onClick={() => toggleFieldSelection(fieldId.split('.')[0], fieldId.split('.')[1])}
                                                style={{
                                                    background: "rgba(255,255,255,0.2)",
                                                    border: "none",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    borderRadius: "2px",
                                                    padding: "2px 4px",
                                                    fontSize: "10px",
                                                    transition: "all 100ms ease"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fields List */}
                        <div style={{ 
                            border: "1px solid #d1d5db", 
                            borderRadius: "6px", 
                            maxHeight: "150px", 
                            overflow: "auto",
                            padding: "8px"
                        }}>
                            {selectedTables.length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#9ca3af", padding: "8px" }}>
                                    Select tables above to see available fields
                                </div>
                            ) : projectFieldsTableFilter ? (
                                (() => {
                                    const [tableType, ...tableNameParts] = projectFieldsTableFilter.split('_');
                                    const tableName = tableNameParts.join('_');
                                    const fields = getFieldsForTable(tableType, tableName);
                                    return (
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", padding: "4px 0" }}>
                                                {tableType}_{tableName}
                                            </div>
                                            {fields.map((field, idx) => {
                                                const fieldId = `${tableName}.${field.name}`;
                                                const isSelected = selectedFields.includes(fieldId);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => toggleFieldSelection(tableName, field.name)}
                                                        style={{
                                                            padding: "6px 8px",
                                                            background: isSelected ? '#dbeafe' : 'white',
                                                            borderRadius: "4px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            marginBottom: "2px",
                                                            transition: "all 150ms ease",
                                                            border: `1px solid ${isSelected ? '#93c5fd' : 'transparent'}`
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#f0f9ff';
                                                            e.currentTarget.style.borderColor = '#93c5fd';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = isSelected ? '#dbeafe' : 'white';
                                                            e.currentTarget.style.borderColor = isSelected ? '#93c5fd' : 'transparent';
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            style={{ cursor: "pointer" }}
                                                        />
                                                        <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>
                                                            {field.name}
                                                        </span>
                                                        <span style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "monospace" }}>
                                                            {field.type}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()
                            ) : (
                                selectedTables.map((tableId) => {
                                    const [tableType, ...tableNameParts] = tableId.split('_');
                                    const tableName = tableNameParts.join('_');
                                    const fields = getFieldsForTable(tableType, tableName);
                                    return (
                                        <div key={tableId} style={{ marginBottom: "12px" }}>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", padding: "4px 0", marginBottom: "4px" }}>
                                                {tableType}_{tableName}
                                            </div>
                                            {fields.map((field, idx) => {
                                                const fieldId = `${tableName}.${field.name}`;
                                                const isSelected = selectedFields.includes(fieldId);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => toggleFieldSelection(tableName, field.name)}
                                                        style={{
                                                            padding: "6px 8px",
                                                            background: isSelected ? '#dbeafe' : 'white',
                                                            borderRadius: "4px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            marginBottom: "2px",
                                                            transition: "all 150ms ease",
                                                            border: `1px solid ${isSelected ? '#93c5fd' : 'transparent'}`
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#f0f9ff';
                                                            e.currentTarget.style.borderColor = '#93c5fd';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = isSelected ? '#dbeafe' : 'white';
                                                            e.currentTarget.style.borderColor = isSelected ? '#93c5fd' : 'transparent';
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            style={{ cursor: "pointer" }}
                                                        />
                                                        <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>
                                                            {field.name}
                                                        </span>
                                                        <span style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "monospace" }}>
                                                            {field.type}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    display: "flex", 
                    gap: "8px", 
                    justifyContent: "flex-end",
                    padding: "16px 24px",
                    borderTop: "1px solid #e5e7eb",
                    background: "white",
                    flexShrink: 0
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: "10px 16px",
                            background: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#374151",
                            transition: "all 200ms ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.borderColor = "#9ca3af";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#d1d5db";
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateByJoin}
                        disabled={!(newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0)}
                        style={{
                            padding: "10px 16px",
                            background: (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0) ? "#10b981" : "#d1d5db",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0) ? "pointer" : "not-allowed",
                            color: "white",
                            transition: "all 200ms ease"
                        }}
                        onMouseEnter={(e) => {
                            if (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0) {
                                e.currentTarget.style.background = "#059669";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0) {
                                e.currentTarget.style.background = "#10b981";
                            }
                        }}
                    >
                        Create Entity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateEntityByJoinDialog;

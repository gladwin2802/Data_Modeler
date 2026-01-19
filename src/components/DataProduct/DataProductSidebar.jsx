import React from 'react';
import { FiSearch, FiPlus, FiCheckCircle } from "react-icons/fi";

const DataProductSidebar = ({
    isOpen,
    onToggle,
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
    fileBaseTables,
    fileViewTables,
    fileCteTables = [],
    customTables,
    onAddTable,
    tableMetadata,
    canvasEntities = [],
    onCreateNewEntity
}) => {
    const [showCreateDialog, setShowCreateDialog] = React.useState(false);
    const [newEntityName, setNewEntityName] = React.useState('');
    const [newEntityType, setNewEntityType] = React.useState('BASE');
    const [createMode, setCreateMode] = React.useState('simple'); // 'simple' or 'join'
    
    // Join-based creation state
    const [selectedTables, setSelectedTables] = React.useState([]);
    const [joinConditions, setJoinConditions] = React.useState([]);
    const [selectedFields, setSelectedFields] = React.useState([]);
    const [projectFieldsTableFilter, setProjectFieldsTableFilter] = React.useState('');
    
    // Join condition UI state
    const [currentJoinCondition, setCurrentJoinCondition] = React.useState({
        from: { tableId: '', field: '' },
        to: { tableId: '', field: '' },
        type: 'INNER'
    });
    const [fromFieldSearch, setFromFieldSearch] = React.useState('');
    const [toFieldSearch, setToFieldSearch] = React.useState('');

    const handleCreateEntity = () => {
        if (newEntityName.trim()) {
            onCreateNewEntity(newEntityName, newEntityType);
            setNewEntityName('');
            setNewEntityType('BASE');
            setShowCreateDialog(false);
        }
    };

    const handleCreateByJoin = () => {
        if (!newEntityName.trim()) {
            alert('Please enter an entity name');
            return;
        }
        if (selectedTables.length < 2) {
            alert('Please select at least 2 tables to join');
            return;
        }
        if (joinConditions.length === 0) {
            alert('Please add at least 1 join condition');
            return;
        }
        if (selectedFields.length === 0) {
            alert('Please select at least 1 field to project');
            return;
        }
        
        // Call onCreateNewEntity with join information
        onCreateNewEntity(newEntityName, newEntityType, {
            mode: 'join',
            tables: selectedTables,
            joinConditions,
            projectedFields: selectedFields
        });
        
        // Reset state
        setNewEntityName('');
        setNewEntityType('VIEW');
        setSelectedTables([]);
        setJoinConditions([]);
        setSelectedFields([]);
        setProjectFieldsTableFilter('');
        setCurrentJoinCondition({ from: { field: '' }, to: { field: '' }, type: 'INNER' });
        setShowCreateDialog(false);
    };

    const addJoinCondition = () => {
        if (!currentJoinCondition.from.field || !currentJoinCondition.to.field) {
            alert('Please select both FROM and TO fields');
            return;
        }
        
        setJoinConditions(prev => [...prev, currentJoinCondition]);
        setCurrentJoinCondition({ from: { field: '' }, to: { field: '' }, type: 'INNER' });
        setIsCalculation(false);
        setCalculationExpression('');
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
            abbr[tableId] = String.fromCharCode(97 + index); // a, b, c, etc.
        });
        return abbr;
    };

    const getTableFromAbbreviation = (abbr) => {
        const abbrs = getTableAbbreviations();
        for (const [tableId, letter] of Object.entries(abbrs)) {
            if (letter === abbr) return tableId;
        }
        return '';
    };

    const buildReferenceDropdownOptions = () => {
        const abbrs = getTableAbbreviations();
        const options = [];
        selectedTables.forEach(tableId => {
            const [tableType, ...tableNameParts] = tableId.split('_');
            const tableName = tableNameParts.join('_');
            const letter = abbrs[tableId];
            const fields = getFieldsForTable(tableType, tableName);
            fields.forEach((field, index) => {
                options.push(`${letter}.${index + 1}`);
            });
        });
        return options;
    };

    const getFieldNameFromReference = (ref) => {
        if (!ref) return '';
        const [letter, fieldNum] = ref.split('.');
        const tableId = getTableFromAbbreviation(letter);
        if (!tableId) return '';
        
        const [tableType, ...tableNameParts] = tableId.split('_');
        const tableName = tableNameParts.join('_');
        const fields = getFieldsForTable(tableType, tableName);
        const fieldIndex = parseInt(fieldNum) - 1;
        
        if (fieldIndex >= 0 && fieldIndex < fields.length) {
            return `${tableId}.${fields[fieldIndex].name}`;
        }
        return '';
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
    
    const filterTables = (tables) => {
        if (!searchQuery) return tables;
        return tables.filter(table => 
            table.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    return (
        <>
            <div
                style={{
                    width: isOpen ? "320px" : "0",
                    height: "93vh",
                    background: "white",
                    borderRight: "1px solid #e5e7eb",
                    overflow: "auto",
                    transition: "width 300ms ease",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {isOpen && (
                    <>
                        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
                                    Available Tables
                                </h3>
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    style={{
                                        padding: "6px 10px",
                                        background: "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "all 200ms ease"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                                    title="Create new entity"
                                >
                                    <FiPlus size={14} />
                                    New
                                </button>
                            </div>
                            
                            <div style={{ position: "relative", marginBottom: "12px" }}>
                                <FiSearch
                                    size={16}
                                    style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#9ca3af"
                                    }}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search tables..."
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px 8px 36px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        outline: "none",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "8px" }}>
                                {['BASE', 'CTE', 'VIEW'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => onTabChange(type)}
                                        style={{
                                            flex: 1,
                                            padding: "8px",
                                            border: `2px solid ${activeTab === type 
                                                ? (type === 'BASE' ? '#3b82f6' : type === 'CTE' ? '#8b5cf6' : '#10b981')
                                                : '#e5e7eb'}`,
                                            borderRadius: "6px",
                                            background: activeTab === type 
                                                ? (type === 'BASE' ? '#eff6ff' : type === 'CTE' ? '#f3e8ff' : '#d1fae5')
                                                : 'white',
                                            color: activeTab === type 
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

                        <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                            {activeTab === 'BASE' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflow: "auto" }}>
                                    {filterTables([...new Set([...fileBaseTables, ...customTables.BASE])]).map((table) => {
                                        const fieldCount = tableMetadata[`BASE_${table}`]?.fields?.length || 0;
                                        const onCanvas = isOnCanvas(table, 'BASE');
                                        return (
                                            <button
                                                key={`BASE_${table}`}
                                                onClick={() => onAddTable(table, 'BASE',[],null, tableMetadata)}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('application/reactflow', JSON.stringify({ tableName: table, tableType: 'BASE' }));
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.currentTarget.style.cursor = 'grabbing';
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.style.cursor = 'grab';
                                                }}
                                                style={{
                                                    padding: "10px 12px",
                                                    background: onCanvas ? "#f3f4f6" : "white",
                                                    border: onCanvas ? "1px solid #9ca3af" : "1px solid #e5e7eb",
                                                    borderRadius: "6px",
                                                    textAlign: "left",
                                                    cursor: onCanvas ? "not-allowed" : "grab",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    color: onCanvas ? "#6b7280" : "#374151",
                                                    transition: "all 200ms ease",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    opacity: onCanvas ? 0.6 : 1,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "#eff6ff";
                                                        e.currentTarget.style.borderColor = "#3b82f6";
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "white";
                                                        e.currentTarget.style.borderColor = "#e5e7eb";
                                                    }
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span>{table}</span>
                                                    {onCanvas && (
                                                        <FiCheckCircle size={14} style={{ color: "#10b981" }} title="On Canvas" />
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: "11px",
                                                    background: onCanvas ? "#e5e7eb" : "#eff6ff",
                                                    color: onCanvas ? "#6b7280" : "#3b82f6",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    fontWeight: 600
                                                }}>
                                                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filterTables(fileBaseTables).length === 0 && (
                                        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", padding: "20px" }}>
                                            No BASE tables found
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'CTE' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {filterTables([...new Set([...fileCteTables, ...customTables.CTE])]).map((table) => {
                                        const fieldCount = tableMetadata[`CTE_${table}`]?.fields?.length || 0;
                                        const onCanvas = isOnCanvas(table, 'CTE');
                                        return (
                                            <button
                                                key={`CTE_${table}`}
                                                onClick={() => onAddTable(table, 'CTE',[],null, tableMetadata)}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('application/reactflow', JSON.stringify({ tableName: table, tableType: 'CTE' }));
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.currentTarget.style.cursor = 'grabbing';
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.style.cursor = 'grab';
                                                }}
                                                style={{
                                                    padding: "10px 12px",
                                                    background: onCanvas ? "#f3f4f6" : "white",
                                                    border: onCanvas ? "1px solid #9ca3af" : "1px solid #e5e7eb",
                                                    borderRadius: "6px",
                                                    textAlign: "left",
                                                    cursor: onCanvas ? "not-allowed" : "grab",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    color: onCanvas ? "#6b7280" : "#374151",
                                                    transition: "all 200ms ease",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    opacity: onCanvas ? 0.6 : 1,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "#f3e8ff";
                                                        e.currentTarget.style.borderColor = "#8b5cf6";
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "white";
                                                        e.currentTarget.style.borderColor = "#e5e7eb";
                                                    }
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span>{table}</span>
                                                    {onCanvas && (
                                                        <FiCheckCircle size={14} style={{ color: "#10b981" }} title="On Canvas" />
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: "11px",
                                                    background: onCanvas ? "#e5e7eb" : "#f3e8ff",
                                                    color: onCanvas ? "#6b7280" : "#8b5cf6",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    fontWeight: 600
                                                }}>
                                                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filterTables([...fileCteTables, ...customTables.CTE]).length === 0 && (
                                        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", padding: "20px" }}>
                                            No CTE tables found
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'VIEW' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {filterTables([...new Set([...fileViewTables, ...customTables.VIEW])]).map((table) => {
                                        const fieldCount = tableMetadata[`VIEW_${table}`]?.fields?.length || 0;
                                        const onCanvas = isOnCanvas(table, 'VIEW');
                                        return (
                                            <button
                                                key={`VIEW_${table}`}
                                                onClick={() => onAddTable(table, 'VIEW',[],null, tableMetadata)}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('application/reactflow', JSON.stringify({ tableName: table, tableType: 'VIEW' }));
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.currentTarget.style.cursor = 'grabbing';
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.style.cursor = 'grab';
                                                }}
                                                style={{
                                                    padding: "10px 12px",
                                                    background: onCanvas ? "#f3f4f6" : "white",
                                                    border: onCanvas ? "1px solid #9ca3af" : "1px solid #e5e7eb",
                                                    borderRadius: "6px",
                                                    textAlign: "left",
                                                    cursor: onCanvas ? "not-allowed" : "grab",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    color: onCanvas ? "#6b7280" : "#374151",
                                                    transition: "all 200ms ease",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    opacity: onCanvas ? 0.6 : 1,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "#d1fae5";
                                                        e.currentTarget.style.borderColor = "#10b981";
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!onCanvas) {
                                                        e.currentTarget.style.background = "white";
                                                        e.currentTarget.style.borderColor = "#e5e7eb";
                                                    }
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span>{table}</span>
                                                    {onCanvas && (
                                                        <FiCheckCircle size={14} style={{ color: "#10b981" }} title="On Canvas" />
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: "11px",
                                                    background: onCanvas ? "#e5e7eb" : "#d1fae5",
                                                    color: onCanvas ? "#6b7280" : "#10b981",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    fontWeight: 600
                                                }}>
                                                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filterTables(fileViewTables).length === 0 && (
                                        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", padding: "20px" }}>
                                            No VIEW tables found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {showCreateDialog && (
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
                        maxWidth: createMode === 'join' ? "600px" : "400px",
                        width: "90%",
                        maxHeight: "90vh",
                        boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        {/* Fixed Header */}
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid #e5e7eb",
                            flexShrink: 0,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
                                Create New Entity
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setNewEntityName('');
                                    setNewEntityType('BASE');
                                    setCreateMode('simple');
                                    setSelectedTables([]);
                                    setSelectedFields([]);
                                    setJoinConditions([]);
                                    setProjectFieldsTableFilter('');
                                    setCurrentJoinCondition({ from: { tableId: '', field: '' }, to: { tableId: '', field: '' }, type: 'INNER' });
                                }}
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

                        {/* Fixed Tabs */}
                        <div style={{ 
                            display: "flex", 
                            gap: "8px", 
                            padding: "12px 24px",
                            borderBottom: "1px solid #e5e7eb",
                            flexShrink: 0,
                            background: "white"
                        }}>
                            <button
                                onClick={() => {
                                    setCreateMode('simple');
                                    setSelectedTables([]);
                                    setSelectedFields([]);
                                }}
                                style={{
                                    padding: "8px 16px",
                                    border: `2px solid ${createMode === 'simple' ? '#3b82f6' : '#e5e7eb'}`,
                                    background: createMode === 'simple' ? '#eff6ff' : 'white',
                                    color: createMode === 'simple' ? '#1e40af' : '#6b7280',
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    transition: "all 200ms ease"
                                }}
                            >
                                Simple
                            </button>
                            <button
                                onClick={() => {
                                    setCreateMode('join');
                                    setNewEntityType('VIEW');
                                }}
                                style={{
                                    padding: "8px 16px",
                                    border: `2px solid ${createMode === 'join' ? '#3b82f6' : '#e5e7eb'}`,
                                    background: createMode === 'join' ? '#eff6ff' : 'white',
                                    color: createMode === 'join' ? '#1e40af' : '#6b7280',
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    transition: "all 200ms ease"
                                }}
                            >
                                Join Tables
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{
                            flex: 1,
                            overflow: "auto",
                            padding: "24px"
                        }}>

                        {createMode === 'simple' ? (
                            <>
                                {/* Simple Mode */}
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                                        Entity Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newEntityName}
                                        onChange={(e) => setNewEntityName(e.target.value)}
                                        placeholder="e.g., MyTable"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateEntity()}
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

                                <div style={{ marginBottom: "24px" }}>
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
                            </>
                        ) : (
                            <>
                                {/* Join Mode */}
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
                                            return (
                                                <label key={tableId} style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "8px",
                                                    cursor: "pointer",
                                                    background: isSelected ? "#f0f9ff" : "white",
                                                    marginBottom: "4px",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    color: "#374151"
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleTableSelection(table.name, table.type)}
                                                        style={{ marginRight: "8px", cursor: "pointer" }}
                                                    />
                                                    <span>{table.name}</span>
                                                    <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
                                                        {table.type}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Join Conditions */}
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                                        Join Conditions
                                    </label>
                                    
                                    {/* Current Join Condition Builder */}
                                    <div style={{ 
                                        border: "1px solid #d1d5db", 
                                        borderRadius: "6px", 
                                        padding: "12px",
                                        marginBottom: "12px",
                                        background: "#fafafa"
                                    }}>
                                        {/* FROM Section */}
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
                                                        onChange={(e) => {
                                                            setCurrentJoinCondition(prev => ({
                                                                ...prev,
                                                                from: { tableId: e.target.value, field: '' }
                                                            }));
                                                            setFromFieldSearch('');
                                                        }}
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
                                                            const [tableType, ...tableNameParts] = tableId.split('_');
                                                            const tableName = tableNameParts.join('_');
                                                            return (
                                                                <option key={tableId} value={tableId}>
                                                                    {tableName}
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

                                        {/* TO Section */}
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
                                                        onChange={(e) => {
                                                            setCurrentJoinCondition(prev => ({
                                                                ...prev,
                                                                to: { tableId: e.target.value, field: '' }
                                                            }));
                                                            setToFieldSearch('');
                                                        }}
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
                                                            const [tableType, ...tableNameParts] = tableId.split('_');
                                                            const tableName = tableNameParts.join('_');
                                                            return (
                                                                <option key={tableId} value={tableId}>
                                                                    {tableName}
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

                                    {/* Added Join Conditions List */}
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
                                                const [tableType, ...tableNameParts] = tableId.split('_');
                                                const tableName = tableNameParts.join('_');
                                                return (
                                                    <option key={tableId} value={tableId}>
                                                        {tableName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Selected Fields Box */}
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
                                            // Show fields only for selected table
                                            (() => {
                                                const [tableType, ...tableNameParts] = projectFieldsTableFilter.split('_');
                                                const tableName = tableNameParts.join('_');
                                                const fields = getFieldsForTable(tableType, tableName);
                                                return (
                                                    <div>
                                                        <div style={{
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            color: "#6b7280",
                                                            padding: "8px 4px",
                                                            borderBottom: "1px solid #e5e7eb",
                                                            marginBottom: "8px"
                                                        }}>
                                                            {tableName}
                                                        </div>
                                                        {fields.length === 0 ? (
                                                            <div style={{ fontSize: "12px", color: "#9ca3af", padding: "8px" }}>
                                                                No fields available
                                                            </div>
                                                        ) : (
                                                            fields.map((field) => {
                                                                const fieldId = `${tableName}.${field.name}`;
                                                                const isSelected = selectedFields.includes(fieldId);
                                                                return (
                                                                    <label key={fieldId} style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        padding: "6px 8px",
                                                                        cursor: "pointer",
                                                                        background: isSelected ? "#f0f9ff" : "white",
                                                                        marginBottom: "2px",
                                                                        borderRadius: "4px",
                                                                        fontSize: "12px",
                                                                        color: "#374151"
                                                                    }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleFieldSelection(tableName, field.name)}
                                                                            style={{ marginRight: "6px", cursor: "pointer" }}
                                                                        />
                                                                        <span>{field.name}</span>
                                                                        <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
                                                                            {field.type}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            // Show all fields from all selected tables
                                            selectedTables.map((tableId) => {
                                                const [tableType, ...tableNameParts] = tableId.split('_');
                                                const tableName = tableNameParts.join('_');
                                                const fields = getFieldsForTable(tableType, tableName);
                                                return (
                                                    <div key={tableId}>
                                                        <div style={{
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            color: "#6b7280",
                                                            padding: "8px 4px",
                                                            marginTop: "8px",
                                                            borderTop: "1px solid #e5e7eb"
                                                        }}>
                                                            {tableName}
                                                        </div>
                                                        {fields.map((field) => {
                                                            const fieldId = `${tableName}.${field.name}`;
                                                            const isSelected = selectedFields.includes(fieldId);
                                                            return (
                                                                <label key={fieldId} style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    padding: "6px 8px",
                                                                    cursor: "pointer",
                                                                    background: isSelected ? "#f0f9ff" : "white",
                                                                    marginBottom: "2px",
                                                                    borderRadius: "4px",
                                                                    fontSize: "12px",
                                                                    color: "#374151",
                                                                    marginLeft: "8px"
                                                                }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleFieldSelection(tableName, field.name)}
                                                                        style={{ marginRight: "6px", cursor: "pointer" }}
                                                                    />
                                                                    <span>{field.name}</span>
                                                                    <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
                                                                        {field.type}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        </div>

                        {/* Fixed Footer */}
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
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setNewEntityName('');
                                    setNewEntityType('BASE');
                                    setCreateMode('simple');
                                    setSelectedTables([]);
                                    setSelectedFields([]);
                                    setJoinConditions([]);
                                    setProjectFieldsTableFilter('');
                                    setCurrentJoinCondition({ from: { tableId: '', field: '' }, to: { tableId: '', field: '' }, type: 'INNER' });
                                }}
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
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#f3f4f6";
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createMode === 'simple' ? handleCreateEntity : handleCreateByJoin}
                                disabled={createMode === 'simple' ? !newEntityName.trim() : !(newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0)}
                                style={{
                                    padding: "10px 16px",
                                    background: (createMode === 'simple' ? newEntityName.trim() : (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0)) ? "#10b981" : "#d1d5db",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: (createMode === 'simple' ? newEntityName.trim() : (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0)) ? "pointer" : "not-allowed",
                                    color: "white",
                                    transition: "all 200ms ease"
                                }}
                                onMouseEnter={(e) => {
                                    if ((createMode === 'simple' ? newEntityName.trim() : (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0))) {
                                        e.currentTarget.style.background = "#059669";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if ((createMode === 'simple' ? newEntityName.trim() : (newEntityName.trim() && selectedTables.length >= 2 && joinConditions.length > 0 && selectedFields.length > 0))) {
                                        e.currentTarget.style.background = "#10b981";
                                    }
                                }}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DataProductSidebar;


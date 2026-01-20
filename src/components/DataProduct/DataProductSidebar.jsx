import React from 'react';
import { FiSearch, FiPlus, FiCheckCircle } from "react-icons/fi";
import CreateEntityByJoinDialog from './CreateEntityByJoinDialog';

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
    const [showJoinDialog, setShowJoinDialog] = React.useState(false);

    const handleCreateEntity = () => {
        if (newEntityName.trim()) {
            onCreateNewEntity(newEntityName, newEntityType, { mode: 'simple' });
            setNewEntityName('');
            setNewEntityType('BASE');
            setShowCreateDialog(false);
        } else {
            alert('Please enter an entity name');
        }
    };

    const handleOpenJoinDialog = () => {
        setShowCreateDialog(false);
        setShowJoinDialog(true);
    };

    const handleCreateByJoin = (entityName, entityType, joinConfig) => {
        onCreateNewEntity(entityName, entityType, joinConfig);
        setShowJoinDialog(false);
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
                        {/* <div style={{ 
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
                                onClick={() => handleOpenJoinDialog()}
                                style={{
                                    padding: "8px 16px",
                                    border: `2px solid #e5e7eb`,
                                    background: 'white',
                                    color: '#6b7280',
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    transition: "all 200ms ease"
                                }}
                            >
                                Join Tables
                            </button>
                        </div> */}

                        {/* Scrollable Content */}
                        <div style={{
                            flex: 1,
                            overflow: "auto",
                            padding: "24px"
                        }}>

                            {/* Simple Mode - Entity Creation */}
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
                                onClick={handleCreateEntity}
                                disabled={!newEntityName.trim()}
                                style={{
                                    padding: "10px 16px",
                                    background: newEntityName.trim() ? "#10b981" : "#d1d5db",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: newEntityName.trim() ? "pointer" : "not-allowed",
                                    color: "white",
                                    transition: "all 200ms ease"
                                }}
                                onMouseEnter={(e) => {
                                    if (newEntityName.trim()) {
                                        e.currentTarget.style.background = "#059669";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (newEntityName.trim()) {
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

            {/* Join Dialog */}
            {showJoinDialog && (
                <CreateEntityByJoinDialog
                    isOpen={showJoinDialog}
                    onClose={() => setShowJoinDialog(false)}
                    onCreateEntity={handleCreateByJoin}
                    fileBaseTables={fileBaseTables}
                    fileViewTables={fileViewTables}
                    fileCteTables={fileCteTables}
                    customTables={customTables}
                    tableMetadata={tableMetadata}
                    canvasEntities={canvasEntities}
                />
            )}
        </>
    );
};

export default DataProductSidebar;


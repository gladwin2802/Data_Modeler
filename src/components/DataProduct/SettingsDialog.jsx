import { useState, useEffect } from "react";
import { FiX, FiKey, FiSearch } from "react-icons/fi";

const SettingsDialog = ({
  show,
  onClose,
  settingsData,
  nodes,
  globalAttributeMode,
  setGlobalAttributeMode,
  attributeToggles,
  setAttributeToggles,
  attributeSelections,
  setAttributeSelections,
  newEntityName,
  setNewEntityName,
  newEntityType,
  setNewEntityType,
  tab1FilterMode,
  setTab1FilterMode,
  attributeSearchQuery,
  setAttributeSearchQuery,
  onCreateByMode,
  onCreateFromSelected
}) => {
  const [activeTab, setActiveTab] = useState("byMode");

  if (!show) return null;

  const filteredFieldsByMode = settingsData.allFields?.filter((field) => {
    if (tab1FilterMode === "both") return true;
    const toggleKey = `${settingsData.nodeId}_${field.name}`;
    const isToggled = attributeToggles[toggleKey] || false;
    const effectiveMode = isToggled
      ? globalAttributeMode === "runtime" ? "loadtime" : "runtime"
      : globalAttributeMode;
    return effectiveMode === tab1FilterMode;
  }) || [];

  const filteredFieldsBySearch = settingsData.allFields?.filter((field) =>
    field.name.toLowerCase().includes(attributeSearchQuery.toLowerCase())
  ) || [];

  const selectedFieldsList = settingsData.allFields?.filter(
    (f) => attributeSelections[f.name]
  ) || [];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          borderRadius: "12px",
          zIndex: 1000,
          width: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ 
          padding: "24px 24px 16px", 
          borderBottom: "1px solid #e5e7eb" 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
              Entity Settings
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "0",
                lineHeight: "1",
              }}
            >
              <FiX size={20} />
            </button>
          </div>
          
          {settingsData.sourceEntityName && (
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 12px 0" }}>
              Source: <strong>{settingsData.sourceEntityName}</strong>
            </p>
          )}

          <div style={{ 
            padding: "12px", 
            background: "#f0f9ff", 
            borderRadius: "6px", 
            fontSize: "13px",
            border: "1px solid #bfdbfe"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "4px", color: "#1e40af" }}>
                Entity Default Mode:
              </label>
              <select
                value={globalAttributeMode}
                onChange={(e) => setGlobalAttributeMode(e.target.value)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #bfdbfe",
                  borderRadius: "4px",
                  fontSize: "13px",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                <option value="runtime">Runtime</option>
                <option value="loadtime">Loadtime</option>
              </select>
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#374151" }}>
              In canvas, Toggle OFF = <strong>{globalAttributeMode}</strong><br/>
              Toggle ON = <strong>{globalAttributeMode === "runtime" ? "loadtime" : "runtime"}</strong>
            </p>
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px" 
        }}>
          <button
            onClick={() => setActiveTab("byMode")}
            style={{
              padding: "12px 16px",
              backgroundColor: activeTab === "byMode" ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === "byMode" ? "2px solid #6366f1" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "byMode" ? "600" : "500",
              color: activeTab === "byMode" ? "#6366f1" : "#6b7280",
            }}
          >
            Based on Type
          </button>
          <button
            onClick={() => setActiveTab("selected")}
            style={{
              padding: "12px 16px",
              backgroundColor: activeTab === "selected" ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === "selected" ? "2px solid #6366f1" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "selected" ? "600" : "500",
              color: activeTab === "selected" ? "#6366f1" : "#6b7280",
            }}
          >
            Selected Attributes
          </button>
        </div>

        <div style={{ 
          padding: "24px", 
          overflowY: "auto", 
          flex: 1 
        }}>
          {activeTab === "byMode" ? (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Entity Name *
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Enter entity name"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Entity Type *
                </label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="CTE">CTE</option>
                  <option value="VIEW">VIEW</option>
                  <option value="BASE">BASE</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Filter by Attribute Mode *
                </label>
                <select
                  value={tab1FilterMode}
                  onChange={(e) => setTab1FilterMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="runtime">Runtime</option>
                  <option value="loadtime">Loadtime</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  {tab1FilterMode.charAt(0).toUpperCase() + tab1FilterMode.slice(1)} Mode Attributes ({filteredFieldsByMode.length})
                </label>
                <div style={{
                  backgroundColor: "#f9fafb",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}>
                  {filteredFieldsByMode.length > 0 ? (
                    filteredFieldsByMode.map((field, idx) => {
                      const toggleKey = `${settingsData.nodeId}_${field.name}`;
                      const isToggled = attributeToggles[toggleKey] || false;
                      const effectiveMode = isToggled
                        ? globalAttributeMode === "runtime" ? "loadtime" : "runtime"
                        : globalAttributeMode;

                      const isPKInAnyEntity = nodes.some((node) =>
                        node.data.fields.some((f) => f.name === field.name && f.isPK)
                      );

                      return (
                        <div
                          key={field.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 4px",
                            fontSize: "13px",
                            color: "#1f2937",
                            borderBottom: idx < filteredFieldsByMode.length - 1 ? "1px solid #e5e7eb" : "none",
                          }}
                        >
                          <span style={{
                            fontFamily: "monospace",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            • {field.name} <span style={{ color: "#6b7280" }}>({field.type})</span>
                            {isPKInAnyEntity && (
                              <FiKey size={14} style={{ color: "#f59e0b", flexShrink: 0 }} title="Primary Key" />
                            )}
                          </span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: effectiveMode === "runtime" ? "#10b981" : "#f59e0b",
                            textTransform: "uppercase",
                          }}>
                            {effectiveMode}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>
                      No {tab1FilterMode} attributes. Toggle attributes to change their mode.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Entity Name *
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Enter entity name"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Entity Type *
                </label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="CTE">CTE</option>
                  <option value="VIEW">VIEW</option>
                  <option value="BASE">BASE</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Selected Attributes ({selectedFieldsList.length})
                </label>
                {selectedFieldsList.length === 0 ? (
                  <div style={{
                    backgroundColor: "#f9fafb",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>
                      No fields selected.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: "#f0f9ff",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                    marginBottom: "12px",
                  }}>
                    {selectedFieldsList.map((field, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 8px",
                          margin: "2px",
                          fontSize: "12px",
                          backgroundColor: "#dbeafe",
                          borderRadius: "4px",
                          color: "#1e40af",
                          fontFamily: "monospace",
                        }}
                      >
                        {nodes.some((node) => node.data.fields.some((f) => f.name === field.name && f.isPK)) && (
                          <FiKey size={12} style={{ color: "#f59e0b", marginRight: "4px" }} title="Primary Key" />
                        )}
                        {field.name}
                        <button
                          onClick={() => {
                            setAttributeSelections((prev) => ({
                              ...prev,
                              [field.name]: false,
                            }));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            color: "#1e40af",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: "12px", position: "relative" }}>
                  <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} size={16} />
                  <input
                    type="text"
                    value={attributeSearchQuery}
                    onChange={(e) => setAttributeSearchQuery(e.target.value)}
                    placeholder="Search attributes..."
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{
                  backgroundColor: "#f9fafb",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}>
                  {filteredFieldsBySearch.map((field, idx) => {
                    const isSelected = attributeSelections[field.name];
                    return (
                      <div
                        key={field.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 4px",
                          fontSize: "13px",
                          borderBottom: idx < filteredFieldsBySearch.length - 1 ? "1px solid #e5e7eb" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={() => {
                            setAttributeSelections((prev) => ({
                              ...prev,
                              [field.name]: !prev[field.name],
                            }));
                          }}
                          style={{ marginRight: "8px", cursor: "pointer" }}
                        />
                        <span style={{ fontFamily: "monospace", flex: 1 }}>
                          {field.name} <span style={{ color: "#6b7280" }}>({field.type})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ 
          padding: "16px 24px", 
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => activeTab === "byMode" ? onCreateByMode() : onCreateFromSelected()}
            disabled={!newEntityName.trim() || (activeTab === "selected" && selectedFieldsList.length === 0)}
            style={{
              padding: "10px 16px",
              background: newEntityName.trim() && (activeTab === "byMode" || selectedFieldsList.length > 0) ? "#6366f1" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: newEntityName.trim() && (activeTab === "byMode" || selectedFieldsList.length > 0) ? "pointer" : "not-allowed",
            }}
          >
            Create Entity
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsDialog;


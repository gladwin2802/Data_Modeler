import { useRef } from "react";
import { FiX, FiUpload } from "react-icons/fi";

/**
 * Dialog component for importing JSON files from system
 */
const ImportJsonDialog = ({ onConfirm, onCancel }) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is JSON
        if (!file.name.endsWith(".json")) {
            alert("Please select a valid JSON file");
            return;
        }

        // Read the file
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                onConfirm(jsonData);
            } catch (error) {
                alert("Invalid JSON file. Please select a valid JSON file.");
                console.error("JSON parse error:", error);
            }
        };
        reader.onerror = () => {
            alert("Error reading file. Please try again.");
        };
        reader.readAsText(file);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                borderRadius: 16,
                padding: "28px",
                minWidth: "500px",
                maxWidth: "600px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(229, 231, 235, 0.5)",
            }}
        >
            <h2
                style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1f2937",
                }}
            >
                Import Data Model
            </h2>
            <p
                style={{
                    margin: 0,
                    marginBottom: 24,
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.5,
                }}
            >
                Select a JSON file from your system to load into the editor.
            </p>

            <div
                style={{
                    marginBottom: 24,
                    padding: 20,
                    border: "2px dashed rgba(59, 130, 246, 0.3)",
                    borderRadius: 10,
                    background: "rgba(59, 130, 246, 0.05)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1f2937",
                        marginBottom: 4,
                    }}
                >
                    Click to browse or drag & drop
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6b7280",
                    }}
                >
                    JSON files only
                </div>
            </div>

            {/* Hidden input for file selection */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                }}
            >
                <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                        padding: "10px 18px",
                        background: "rgba(229, 231, 235, 0.5)",
                        color: "#6b7280",
                        border: "1px solid rgba(209, 213, 219, 0.5)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                        transition: "all 200ms ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "rgba(229, 231, 235, 0.7)";
                        e.target.style.borderColor = "rgba(209, 213, 219, 0.7)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "rgba(229, 231, 235, 0.5)";
                        e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
                    }}
                >
                    <FiX size={16} />
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ImportJsonDialog;

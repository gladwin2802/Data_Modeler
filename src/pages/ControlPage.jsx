import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiUpload, FiFile, FiTrash2, FiFolder, FiSearch, FiX, FiEdit2, FiRefreshCw, FiPackage } from "react-icons/fi";
import { getAllFiles, saveFile, deleteFile, selectStorageDirectory, getStorageDirectory, getStorageDirectoryPath, getAllMergedFiles, saveMergedFile, deleteMergedFile, getFile, renameFile, renameMergedFile, syncFilesFromDirectory, getAllDataProducts, deleteDataProduct, renameDataProduct, getDataProduct } from "../utils/ControlPage/fileStorage";

const ControlPage = () => {
    const [files, setFiles] = useState([]);
    const [mergedFiles, setMergedFiles] = useState([]);
    const [dataProducts, setDataProducts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [directorySelected, setDirectorySelected] = useState(false);
    const [directoryPath, setDirectoryPath] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [activeTab, setActiveTab] = useState("individual");
    const [searchParams, setSearchParams] = useSearchParams();
    const [modelerType, setModelerType] = useState(() => {
        const modelerParam = searchParams.get("modeler");
        return modelerParam === "pipeline" ? "pipeline" : "sql";
    });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const modelerParam = searchParams.get("modeler");
        if (modelerParam === "pipeline" && modelerType !== "pipeline") {
            setModelerType("pipeline");
        } else if (modelerParam === "sql" && modelerType !== "sql") {
            setModelerType("sql");
        } else if (!modelerParam && modelerType !== "sql") {
            setModelerType("sql");
        }
    }, [searchParams]);

    useEffect(() => {
        const init = async () => {
            await checkDirectory();
        };
        init();
    }, [modelerType]);

    const checkDirectory = async () => {
        const handle = await getStorageDirectory();
        setDirectorySelected(!!handle);
        if (handle) {
            const path = await getStorageDirectoryPath();
            setDirectoryPath(path || "");
            await syncFilesFromDirectory();
            await loadFiles();
            await loadMergedFiles();
            await loadDataProducts();
        }
    };

    const loadFiles = async () => {
        const storedFiles = await getAllFiles(modelerType, 'individual');
        setFiles(storedFiles);
    };

    const loadMergedFiles = async () => {
        const storedMergedFiles = await getAllMergedFiles(modelerType);
        setMergedFiles(storedMergedFiles);
    };

    const loadDataProducts = async () => {
        const storedDataProducts = await getAllDataProducts(modelerType);
        setDataProducts(storedDataProducts);
    };

    const handleSelectDirectory = async () => {
        try {
            await selectStorageDirectory();
            setDirectorySelected(true);
            const path = await getStorageDirectoryPath();
            setDirectoryPath(path || "");
            await loadFiles();
            await loadMergedFiles();
            await loadDataProducts();
        } catch (error) {
            if (error.message.includes('not supported')) {
                alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
            } else if (error.name !== 'AbortError') {
                alert('Error selecting directory: ' + error.message);
            }
        }
    };

    const handleRefresh = async () => {
        if (directorySelected) {
            await syncFilesFromDirectory();
            await loadFiles();
            await loadMergedFiles();
            await loadDataProducts();
        }
    };

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const jsonFiles = selectedFiles.filter(file => file.name.endsWith(".json"));
        if (jsonFiles.length === 0) {
            alert("Please select valid JSON files");
            return;
        }

        if (jsonFiles.length < selectedFiles.length) {
            alert(`Only ${jsonFiles.length} of ${selectedFiles.length} files are JSON files. Processing JSON files only.`);
        }

        setUploading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of jsonFiles) {
            try {
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onload = async (event) => {
                        try {
                            const jsonData = JSON.parse(event.target.result);
                            await saveFile(file.name, jsonData, modelerType, 'individual');
                            successCount++;
                        } catch (error) {
                            console.error(`Error processing ${file.name}:`, error);
                            errorCount++;
                        }
                        resolve();
                    };
                    reader.onerror = () => {
                        console.error(`Error reading ${file.name}`);
                        errorCount++;
                        resolve();
                    };
                    reader.readAsText(file);
                });
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                errorCount++;
            }
        }

        if (successCount > 0) {
            await loadFiles();
        }

        if (errorCount > 0) {
            alert(`Uploaded ${successCount} file(s) successfully. ${errorCount} file(s) failed.`);
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (e, fileId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this file?")) {
            await deleteFile(fileId, modelerType, 'individual');
            await loadFiles();
            setSelectedFiles(new Set());
        }
    };

    const handleDeleteMerged = async (e, fileId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this merged file?")) {
            await deleteMergedFile(fileId, modelerType);
            await loadMergedFiles();
        }
    };

    const handleFileClick = (file) => {
        if (modelerType === "pipeline") {
            navigate(`/pipeline/editor/${file.id}`);
        } else {
            navigate(`/editor/${file.id}`);
        }
    };

    const handleMergedFileClick = (mergedFile) => {
        if (modelerType === "pipeline") {
            navigate(`/pipeline/editor/merged/${mergedFile.id}`);
        } else {
            navigate(`/editor/merged/${mergedFile.id}`);
        }
    };

    const handleRenameFile = async (e, fileId) => {
        e.stopPropagation();
        const file = files.find(f => f.id === fileId);
        if (!file) return;

        const newName = window.prompt("Enter new file name:", file.name);
        if (!newName || newName === file.name) return;

        if (!newName.endsWith('.json')) {
            alert("File name must end with .json");
            return;
        }

        const success = await renameFile(fileId, newName, modelerType, 'individual');
        if (success) {
            await loadFiles();
        } else {
            alert("Failed to rename file. Please try again.");
        }
    };

    const handleRenameMergedFile = async (e, fileId) => {
        e.stopPropagation();
        const mergedFile = mergedFiles.find(f => f.id === fileId);
        if (!mergedFile) return;

        const newName = window.prompt("Enter new file name:", mergedFile.name);
        if (!newName || newName === mergedFile.name) return;

        if (!newName.endsWith('.json')) {
            alert("File name must end with .json");
            return;
        }

        const success = await renameMergedFile(fileId, newName, modelerType);
        if (success) {
            await loadMergedFiles();
        } else {
            alert("Failed to rename file. Please try again.");
        }
    };

    const handleSelectFile = (fileId, checked) => {
        const newSelected = new Set(selectedFiles);
        if (checked) {
            newSelected.add(fileId);
        } else {
            newSelected.delete(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
        } else {
            setSelectedFiles(new Set());
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedFiles.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedFiles.size} selected file(s)?`)) {
            for (const fileId of selectedFiles) {
                await deleteFile(fileId, modelerType, 'individual');
            }
            await loadFiles();
            setSelectedFiles(new Set());
        }
    };

    const findBaseEntitiesForEntity = (entityName, allEntities, visited = new Set()) => {
        if (visited.has(entityName)) {
            return new Set();
        }
        visited.add(entityName);

        const entity = allEntities[entityName];
        if (!entity || !entity.fields) {
            return new Set();
        }

        const baseEntities = new Set();

        const processRefs = (refs) => {
            if (refs && Array.isArray(refs)) {
                for (const ref of refs) {
                    const [refEntityName] = ref.split('.');
                    if (refEntityName.startsWith('BASE_')) {
                        baseEntities.add(refEntityName.replace('BASE_', ''));
                    } else if (refEntityName.startsWith('CTE_')) {
                        const cteBaseEntities = findBaseEntitiesForEntity(refEntityName, allEntities, visited);
                        cteBaseEntities.forEach(base => baseEntities.add(base));
                    }
                }
            }
        };

        for (const fieldName in entity.fields) {
            const field = entity.fields[fieldName];
            if (field.ref) {
                processRefs(field.ref);
            }
            if (field.calculation && field.calculation.ref) {
                processRefs(field.calculation.ref);
            }
        }

        return baseEntities;
    };

    const handleMergeSelected = async () => {
        if (selectedFiles.size < 2) {
            alert("Please select at least 2 files to merge.");
            return;
        }
        
        const selectedFileList = files.filter(f => selectedFiles.has(f.id));
        const mergedFileName = `merged_${Date.now()}.json`;
        
        if (modelerType === 'pipeline') {
            const allSourceEntities = {};
            const allTargetEntities = {};

            for (const file of selectedFileList) {
                try {
                    const fileData = await getFile(file.id, modelerType, 'individual');
                    if (fileData && fileData.data) {
                        if (fileData.data.source_entities) {
                            Object.assign(allSourceEntities, fileData.data.source_entities);
                        }
                        if (fileData.data.target_entities) {
                            Object.assign(allTargetEntities, fileData.data.target_entities);
                        }
                    }
                } catch (error) {
                    console.error(`Error reading file ${file.name}:`, error);
                }
            }

            const mergedData = {
                source_entities: allSourceEntities,
                target_entities: allTargetEntities
            };
            
            await saveMergedFile(mergedFileName, mergedData, Array.from(selectedFiles), modelerType);
            await loadMergedFiles();
            setSelectedFiles(new Set());
            setActiveTab("merged");
            return;
        }

        const allEntities = {};
        const allBaseEntities = new Set();
        const targetEntities = {};

        for (const file of selectedFileList) {
            try {
                const fileData = await getFile(file.id, modelerType, 'individual');
                if (fileData && fileData.data && fileData.data.entities) {
                    Object.assign(allEntities, fileData.data.entities);
                }
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
            }
        }

        for (const entityName in allEntities) {
            if (entityName.startsWith('BASE_')) {
                const baseName = entityName.replace('BASE_', '');
                allBaseEntities.add(baseName);
            } else if (entityName.startsWith('VIEW_')) {
                const viewName = entityName.replace('VIEW_', '');
                const baseDependencies = findBaseEntitiesForEntity(entityName, allEntities);
                if (baseDependencies.size > 0) {
                    targetEntities[viewName] = {
                        ref: Array.from(baseDependencies).sort()
                    };
                }
            }
        }

        const mergedData = {
            SOURCE_entities: Array.from(allBaseEntities).sort(),
            TARGET_entities: targetEntities
        };
        
        await saveMergedFile(mergedFileName, mergedData, Array.from(selectedFiles), modelerType);
        await loadMergedFiles();
        setSelectedFiles(new Set());
        setActiveTab("merged");
    };

    const handleCreateDataProduct = () => {
        if (modelerType !== 'sql') {
            alert('Data Products are only available for SQL modeler');
            return;
        }
        
        if (selectedFiles.size === 0) {
            alert('Please select at least one file to create a data product');
            return;
        }
        
        navigate('/data-product', {
            state: {
                selectedFileIds: Array.from(selectedFiles)
            }
        });
    };

    const handleDataProductClick = async (dataProduct) => {
        try {
            const productData = await getDataProduct(dataProduct.id, modelerType);
            navigate('/data-product', {
                state: {
                    dataProductData: productData.data,
                    dataProductId: dataProduct.id,
                    dataProductName: dataProduct.name
                }
            });
        } catch (error) {
            console.error('Error loading data product:', error);
            alert('Error loading data product: ' + error.message);
        }
    };

    const handleDeleteDataProduct = async (e, productId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this data product?')) {
            await deleteDataProduct(productId, modelerType);
            await loadDataProducts();
        }
    };

    const handleRenameDataProduct = async (e, productId) => {
        e.stopPropagation();
        const product = dataProducts.find(p => p.id === productId);
        if (!product) return;

        const newName = window.prompt('Enter new name:', product.name);
        if (!newName || newName === product.name) return;

        if (!newName.endsWith('.json')) {
            alert('File name must end with .json');
            return;
        }

        const success = await renameDataProduct(productId, newName, modelerType);
        if (success) {
            await loadDataProducts();
        } else {
            alert('Failed to rename data product. Please try again.');
        }
    };

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMergedFiles = mergedFiles.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDataProducts = dataProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.has(f.id));
    const someSelected = filteredFiles.some(f => selectedFiles.has(f.id));

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                padding: "40px",
                overflow: "auto",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    width: "100%",
                    margin: "0 auto",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                    <div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "8px",
                            }}
                        >
                            Data Model Manager
                        </h1>
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#6b7280",
                            }}
                        >
                            Upload and manage your data model JSON files
                        </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                            Modeler Type
                        </label>
                        <select
                            value={modelerType}
                            onChange={(e) => {
                                const newModelerType = e.target.value;
                                setModelerType(newModelerType);
                                setSearchParams({ modeler: newModelerType });
                            }}
                            style={{
                                padding: "8px 12px",
                                fontSize: "14px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                background: "white",
                                color: "#1f2937",
                                cursor: "pointer",
                                minWidth: "180px",
                            }}
                        >
                            <option value="sql">SQL Modeler</option>
                            <option value="pipeline">Pipeline Modeler</option>
                        </select>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "350px 1fr",
                        gap: "32px",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            border: "1px solid rgba(229, 231, 235, 0.5)",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                            position: "sticky",
                            top: "40px",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1f2937",
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <FiFolder size={20} color="#3b82f6" />
                            Folder Selection
                        </h2>

                        {!directorySelected ? (
                            <div
                                style={{
                                    padding: "20px",
                                    background: "rgba(251, 191, 36, 0.1)",
                                    border: "1px solid rgba(251, 191, 36, 0.3)",
                                    borderRadius: "12px",
                                    marginBottom: "20px",
                                }}
                            >
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
                                    Select Storage Directory
                                </div>
                                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
                                    Choose a folder to store your JSON files locally
                                </div>
                                <button
                                    onClick={handleSelectDirectory}
                                    style={{
                                        width: "100%",
                                        padding: "10px 16px",
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        transition: "all 200ms ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = "#2563eb";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "#3b82f6";
                                    }}
                                >
                                    Select Folder
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div
                                    style={{
                                        padding: "16px",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        borderRadius: "8px",
                                        marginBottom: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <FiFolder size={16} color="#10b981" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937" }}>
                                            Directory Selected
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6b7280", wordBreak: "break-word" }}>
                                            {directoryPath || "Ready to upload files"}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSelectDirectory}
                                    style={{
                                        width: "100%",
                                        padding: "8px 16px",
                                        background: "transparent",
                                        color: "#3b82f6",
                                        border: "1px solid #3b82f6",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                        fontSize: "13px",
                                        transition: "all 200ms ease",
                                        marginBottom: "12px",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = "rgba(59, 130, 246, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                    }}
                                >
                                    Change Folder
                                </button>
                                <button
                                    onClick={handleRefresh}
                                    style={{
                                        width: "100%",
                                        padding: "8px 16px",
                                        background: "transparent",
                                        color: "#10b981",
                                        border: "1px solid #10b981",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                        fontSize: "13px",
                                        transition: "all 200ms ease",
                                        marginBottom: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = "rgba(16, 185, 129, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                    }}
                                >
                                    <FiRefreshCw size={16} />
                                    Refresh Files
                                </button>
                                <div
                                    style={{
                                        padding: "20px",
                                        border: "2px dashed rgba(59, 130, 246, 0.3)",
                                        borderRadius: "12px",
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
                                        multiple
                                        onChange={handleFileUpload}
                                        style={{ display: "none" }}
                                    />
                                    <FiUpload
                                        size={32}
                                        style={{
                                            color: "#3b82f6",
                                            marginBottom: "12px",
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "#1f2937",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        {uploading ? "Uploading..." : "Upload Files"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        JSON files only
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div
                            style={{
                                background: "white",
                                borderRadius: "12px",
                                padding: "24px",
                                border: "1px solid rgba(229, 231, 235, 0.5)",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 16px",
                                    background: "#f9fafb",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <FiSearch size={20} color="#6b7280" />
                                <input
                                    type="text"
                                    placeholder="Search JSON files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        background: "transparent",
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        outline: "none",
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#6b7280",
                                            padding: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span style={{ fontSize: "18px" }}>×</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {!directorySelected ? (
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    padding: "60px 20px",
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    border: "1px solid rgba(229, 231, 235, 0.5)",
                                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                <FiFile size={64} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                                    Select a folder first
                                </div>
                                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                                    Choose a storage directory to view and manage files
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(229, 231, 235, 0.5)",
                                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        borderBottom: "1px solid #e5e7eb",
                                        background: "#f9fafb",
                                    }}
                                >
                                    <button
                                        onClick={() => setActiveTab("individual")}
                                        style={{
                                            flex: 1,
                                            padding: "12px 20px",
                                            background: activeTab === "individual" ? "white" : "transparent",
                                            border: "none",
                                            borderBottom: activeTab === "individual" ? "2px solid #3b82f6" : "2px solid transparent",
                                            cursor: "pointer",
                                            fontWeight: activeTab === "individual" ? 600 : 500,
                                            color: activeTab === "individual" ? "#3b82f6" : "#6b7280",
                                            fontSize: "14px",
                                            transition: "all 200ms ease",
                                        }}
                                    >
                                        {modelerType === "sql" ? "Individual SQL" : "Individual Pipelines"} ({filteredFiles.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("merged")}
                                        style={{
                                            flex: 1,
                                            padding: "12px 20px",
                                            background: activeTab === "merged" ? "white" : "transparent",
                                            border: "none",
                                            borderBottom: activeTab === "merged" ? "2px solid #3b82f6" : "2px solid transparent",
                                            cursor: "pointer",
                                            fontWeight: activeTab === "merged" ? 600 : 500,
                                            color: activeTab === "merged" ? "#3b82f6" : "#6b7280",
                                            fontSize: "14px",
                                            transition: "all 200ms ease",
                                        }}
                                    >
                                        {modelerType === "sql" ? "Consolidated SQL" : "Consolidated Pipelines"} ({filteredMergedFiles.length})
                                    </button>
                                    {modelerType === "sql" && (
                                        <button
                                            onClick={() => setActiveTab("dataProducts")}
                                            style={{
                                                flex: 1,
                                                padding: "12px 20px",
                                                background: activeTab === "dataProducts" ? "white" : "transparent",
                                                border: "none",
                                                borderBottom: activeTab === "dataProducts" ? "2px solid #10b981" : "2px solid transparent",
                                                cursor: "pointer",
                                                fontWeight: activeTab === "dataProducts" ? 600 : 500,
                                                color: activeTab === "dataProducts" ? "#10b981" : "#6b7280",
                                                fontSize: "14px",
                                                transition: "all 200ms ease",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <FiPackage size={16} />
                                            Data Products ({filteredDataProducts.length})
                                        </button>
                                    )}
                                </div>

                                {activeTab === "individual" && (
                                    <>
                                        {filteredFiles.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: "60px 20px",
                                                    textAlign: "center",
                                                    color: "#9ca3af",
                                                }}
                                            >
                                                <FiFile size={64} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                                                    {searchQuery ? "No files found" : "No files uploaded yet"}
                                                </div>
                                                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                                                    {searchQuery
                                                        ? "Try a different search term"
                                                        : "Upload your first JSON file to get started"}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {selectedFiles.size > 0 && (
                                                    <div
                                                        style={{
                                                            padding: "12px 20px",
                                                            background: "#eff6ff",
                                                            borderBottom: "1px solid #e5e7eb",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "12px",
                                                        }}
                                                    >
                                                        <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>
                                                            {selectedFiles.size} file(s) selected
                                                        </span>
                                                        <button
                                                            onClick={handleMergeSelected}
                                                            style={{
                                                                padding: "6px 12px",
                                                                background: "#3b82f6",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontSize: "13px",
                                                                fontWeight: 500,
                                                                transition: "all 200ms ease",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = "#2563eb";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = "#3b82f6";
                                                            }}
                                                        >
                                                            Merge Selected
                                                        </button>
                                                        {modelerType === 'sql' && (
                                                            <button
                                                                onClick={handleCreateDataProduct}
                                                                style={{
                                                                    padding: "6px 12px",
                                                                    background: "#10b981",
                                                                    color: "white",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontSize: "13px",
                                                                    fontWeight: 500,
                                                                    transition: "all 200ms ease",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = "#059669";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = "#10b981";
                                                                }}
                                                            >
                                                                <FiPackage size={14} />
                                                                Create Data Product
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleDeleteSelected}
                                                            style={{
                                                                padding: "6px 12px",
                                                                background: "rgba(239, 68, 68, 0.1)",
                                                                color: "#ef4444",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontSize: "13px",
                                                                fontWeight: 500,
                                                                transition: "all 200ms ease",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = "rgba(239, 68, 68, 0.2)";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = "rgba(239, 68, 68, 0.1)";
                                                            }}
                                                        >
                                                            Delete Selected
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedFiles(new Set())}
                                                            style={{
                                                                padding: "6px 12px",
                                                                background: "transparent",
                                                                color: "#6b7280",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                fontSize: "13px",
                                                                marginLeft: "auto",
                                                            }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "auto auto 1fr auto auto auto",
                                                        gap: "16px",
                                                        padding: "16px 20px",
                                                        background: "#f9fafb",
                                                        borderBottom: "1px solid #e5e7eb",
                                                        alignItems: "center",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: "#6b7280",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={(input) => {
                                                            if (input) input.indeterminate = someSelected && !allSelected;
                                                        }}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: "18px",
                                                            height: "18px",
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                    <div style={{ width: "24px" }}></div>
                                                    <div>File Name</div>
                                                    <div>Created Date</div>
                                                    <div style={{ width: "40px" }}></div>
                                                    <div style={{ width: "40px" }}></div>
                                                </div>
                                                <div>
                                                    {filteredFiles.map((file, index) => (
                                                        <div
                                                            key={file.id}
                                                            onClick={() => handleFileClick(file)}
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "auto auto 1fr auto auto auto",
                                                                gap: "16px",
                                                                padding: "16px 20px",
                                                                borderBottom: index < filteredFiles.length - 1 ? "1px solid #e5e7eb" : "none",
                                                                cursor: "pointer",
                                                                transition: "all 200ms ease",
                                                                alignItems: "center",
                                                                background: selectedFiles.has(file.id) ? "#eff6ff" : "white",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!selectedFiles.has(file.id)) {
                                                                    e.currentTarget.style.background = "#f9fafb";
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!selectedFiles.has(file.id)) {
                                                                    e.currentTarget.style.background = "white";
                                                                }
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFiles.has(file.id)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectFile(file.id, e.target.checked);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    width: "18px",
                                                                    height: "18px",
                                                                    cursor: "pointer",
                                                                }}
                                                            />
                                                            <FiFile
                                                                size={20}
                                                                style={{
                                                                    color: "#3b82f6",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    fontSize: "14px",
                                                                    fontWeight: 500,
                                                                    color: "#1f2937",
                                                                    wordBreak: "break-word",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {file.name}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: "13px",
                                                                    color: "#6b7280",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {new Date(file.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <button
                                                                onClick={(e) => handleRenameFile(e, file.id)}
                                                                style={{
                                                                    background: "rgba(59, 130, 246, 0.1)",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    padding: "6px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 200ms ease",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = "rgba(59, 130, 246, 0.2)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = "rgba(59, 130, 246, 0.1)";
                                                                }}
                                                            >
                                                                <FiEdit2 size={16} color="#3b82f6" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(e, file.id)}
                                                                style={{
                                                                    background: "rgba(239, 68, 68, 0.1)",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    padding: "6px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 200ms ease",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = "rgba(239, 68, 68, 0.2)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = "rgba(239, 68, 68, 0.1)";
                                                                }}
                                                            >
                                                                <FiTrash2 size={16} color="#ef4444" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {activeTab === "merged" && (
                                    <>
                                        {filteredMergedFiles.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: "60px 20px",
                                                    textAlign: "center",
                                                    color: "#9ca3af",
                                                }}
                                            >
                                                <FiFile size={64} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                                                    {searchQuery ? "No merged files found" : "No merged files yet"}
                                                </div>
                                                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                                                    {searchQuery
                                                        ? "Try a different search term"
                                                        : "Select files and merge them to create merged files"}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr auto auto auto",
                                                        gap: "16px",
                                                        padding: "16px 20px",
                                                        background: "#f9fafb",
                                                        borderBottom: "1px solid #e5e7eb",
                                                        alignItems: "center",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: "#6b7280",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    <div>File Name</div>
                                                    <div>Created Date</div>
                                                    <div style={{ width: "40px" }}></div>
                                                    <div style={{ width: "40px" }}></div>
                                                </div>
                                                <div>
                                                    {filteredMergedFiles.map((file, index) => (
                                                        <div
                                                            key={file.id}
                                                            onClick={() => handleMergedFileClick(file)}
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "1fr auto auto auto",
                                                                gap: "16px",
                                                                padding: "16px 20px",
                                                                borderBottom: index < filteredMergedFiles.length - 1 ? "1px solid #e5e7eb" : "none",
                                                                cursor: "pointer",
                                                                transition: "all 200ms ease",
                                                                alignItems: "center",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = "#f9fafb";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = "white";
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: "14px",
                                                                    fontWeight: 500,
                                                                    color: "#1f2937",
                                                                    wordBreak: "break-word",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                }}
                                                            >
                                                                <FiFile size={20} color="#8b5cf6" />
                                                                {file.name}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: "13px",
                                                                    color: "#6b7280",
                                                                }}
                                                            >
                                                                {new Date(file.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <button
                                                                onClick={(e) => handleRenameMergedFile(e, file.id)}
                                                                style={{
                                                                    background: "rgba(139, 92, 246, 0.1)",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    padding: "6px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 200ms ease",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = "rgba(139, 92, 246, 0.2)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = "rgba(139, 92, 246, 0.1)";
                                                                }}
                                                            >
                                                                <FiEdit2 size={16} color="#8b5cf6" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteMerged(e, file.id)}
                                                                style={{
                                                                    background: "rgba(239, 68, 68, 0.1)",
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    padding: "6px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 200ms ease",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = "rgba(239, 68, 68, 0.2)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = "rgba(239, 68, 68, 0.1)";
                                                                }}
                                                            >
                                                                <FiTrash2 size={16} color="#ef4444" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === "dataProducts" && (
                                            <>
                                                {filteredDataProducts.length === 0 ? (
                                                    <div
                                                        style={{
                                                            padding: "60px 20px",
                                                            textAlign: "center",
                                                            color: "#9ca3af",
                                                        }}
                                                    >
                                                        <FiPackage size={64} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                                        <div style={{ fontSize: "18px", fontWeight: 500 }}>
                                                            {searchQuery ? "No data products found" : "No data products yet"}
                                                        </div>
                                                        <div style={{ fontSize: "14px", marginTop: "8px" }}>
                                                            {searchQuery
                                                                ? "Try a different search term"
                                                                : "Select SQL files and create a data product to get started"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "1fr auto auto auto",
                                                                gap: "16px",
                                                                padding: "16px 20px",
                                                                background: "#f9fafb",
                                                                borderBottom: "1px solid #e5e7eb",
                                                                alignItems: "center",
                                                                fontSize: "12px",
                                                                fontWeight: 600,
                                                                color: "#6b7280",
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.5px",
                                                            }}
                                                        >
                                                            <div>Product Name</div>
                                                            <div>Created Date</div>
                                                            <div style={{ width: "40px" }}></div>
                                                            <div style={{ width: "40px" }}></div>
                                                        </div>
                                                        <div>
                                                            {filteredDataProducts.map((product, index) => (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => handleDataProductClick(product)}
                                                                    style={{
                                                                        display: "grid",
                                                                        gridTemplateColumns: "1fr auto auto auto",
                                                                        gap: "16px",
                                                                        padding: "16px 20px",
                                                                        borderBottom: index < filteredDataProducts.length - 1 ? "1px solid #e5e7eb" : "none",
                                                                        cursor: "pointer",
                                                                        transition: "all 200ms ease",
                                                                        alignItems: "center",
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = "#f9fafb";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "white";
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize: "14px",
                                                                            fontWeight: 500,
                                                                            color: "#1f2937",
                                                                            wordBreak: "break-word",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "8px",
                                                                        }}
                                                                    >
                                                                        <FiPackage size={20} color="#10b981" />
                                                                        {product.name}
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: "13px",
                                                                            color: "#6b7280",
                                                                        }}
                                                                    >
                                                                        {new Date(product.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => handleRenameDataProduct(e, product.id)}
                                                                        style={{
                                                                            background: "rgba(16, 185, 129, 0.1)",
                                                                            border: "none",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            transition: "all 200ms ease",
                                                                            width: "32px",
                                                                            height: "32px",
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.background = "rgba(16, 185, 129, 0.2)";
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.background = "rgba(16, 185, 129, 0.1)";
                                                                        }}
                                                                    >
                                                                        <FiEdit2 size={16} color="#10b981" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleDeleteDataProduct(e, product.id)}
                                                                        style={{
                                                                            background: "rgba(239, 68, 68, 0.1)",
                                                                            border: "none",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            transition: "all 200ms ease",
                                                                            width: "32px",
                                                                            height: "32px",
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.background = "rgba(239, 68, 68, 0.2)";
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.background = "rgba(239, 68, 68, 0.1)";
                                                                        }}
                                                                    >
                                                                        <FiTrash2 size={16} color="#ef4444" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                };

export default ControlPage;


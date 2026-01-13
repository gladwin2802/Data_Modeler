const DB_NAME = 'sql_data_model_db';
const DB_VERSION = 5;
const STORE_META = 'metadata';
const CURRENT_FILE_KEY = 'current_file';
const DIRECTORY_HANDLE_KEY = 'directory_handle';
const DIRECTORY_PATH_KEY = 'directory_path';

function getStoreName(modelerType, fileType) {
    return `${modelerType}_${fileType}`;
}

function getFolderName(modelerType, fileType) {
    return `${fileType}_${modelerType}`;
}

let db = null;
let directoryHandle = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_META)) {
                database.createObjectStore(STORE_META);
            }
            
            const modelerTypes = ['sql', 'pipeline'];
            const fileTypes = ['individual', 'consolidated', 'data_products'];
            
            modelerTypes.forEach(modelerType => {
                fileTypes.forEach(fileType => {
                    const storeName = getStoreName(modelerType, fileType);
                    if (!database.objectStoreNames.contains(storeName)) {
                        const store = database.createObjectStore(storeName, { keyPath: 'id' });
                        store.createIndex('name', 'name', { unique: true });
                    } else if (event.oldVersion < 5) {
                        const transaction = event.target.transaction;
                        const store = transaction.objectStore(storeName);
                        if (!store.indexNames.contains('name')) {
                            store.createIndex('name', 'name', { unique: true });
                        }
                    }
                });
            });
            
            if (event.oldVersion < 3) {
                const oldStores = ['files', 'merged_files', 'data_products'];
                oldStores.forEach(storeName => {
                    if (database.objectStoreNames.contains(storeName)) {
                        database.deleteObjectStore(storeName);
                    }
                });
            }
        };
    });
}

async function checkAndRequestPermission(handle) {
    try {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
            return true;
        }
        // Only request permission if it was previously denied or never asked
        // This should only be called from direct user gestures
        if (permission === 'prompt') {
            await handle.requestPermission({ mode: 'readwrite' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

async function getDirectoryHandle(shouldSync = false) {
    if (directoryHandle) {
        try {
            const hasPermission = await checkAndRequestPermission(directoryHandle);
            if (!hasPermission) {
                directoryHandle = null;
                return null;
            }
            await createRequiredFolders(directoryHandle);
            if (shouldSync) {
                await syncAllFilesFromDirectory(directoryHandle);
            }
            return directoryHandle;
        } catch (error) {
            console.error('Error with cached directory handle:', error);
            directoryHandle = null;
        }
    }

    const database = await openDB();
    const transaction = database.transaction([STORE_META], 'readonly');
    const store = transaction.objectStore(STORE_META);
    const request = store.get(DIRECTORY_HANDLE_KEY);

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const handle = request.result;
            if (handle) {
                try {
                    const hasPermission = await checkAndRequestPermission(handle);
                    if (!hasPermission) {
                        resolve(null);
                        return;
                    }
                    directoryHandle = handle;
                    await createRequiredFolders(handle);
                    if (shouldSync) {
                        await syncAllFilesFromDirectory(handle);
                    }
                    resolve(handle);
                } catch (error) {
                    console.error('Permission error:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function selectStorageDirectory() {
    if (!window.showDirectoryPicker) {
        throw new Error('File System Access API is not supported in this browser');
    }

    try {
        const handle = await window.showDirectoryPicker();
        await handle.requestPermission({ mode: 'readwrite' });
        
        directoryHandle = handle;
        const directoryPath = handle.name;

        await createRequiredFolders(handle);

        const database = await openDB();
        const transaction = database.transaction([STORE_META], 'readwrite');
        const store = transaction.objectStore(STORE_META);
        store.put(handle, DIRECTORY_HANDLE_KEY);
        store.put(directoryPath, DIRECTORY_PATH_KEY);

        await syncAllFilesFromDirectory(handle);

        return handle;
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
        throw error;
    }
}

async function createRequiredFolders(directoryHandle) {
    const modelerTypes = ['sql', 'pipeline'];
    const fileTypes = ['individual', 'consolidated', 'data_products'];
    
    for (const modelerType of modelerTypes) {
        for (const fileType of fileTypes) {
            const folderName = getFolderName(modelerType, fileType);
            try {
                await directoryHandle.getDirectoryHandle(folderName, { create: true });
            } catch (error) {
                console.error(`Error creating folder ${folderName}:`, error);
            }
        }
    }
}

async function syncAllFilesFromDirectory(directoryHandle) {
    const modelerTypes = ['sql', 'pipeline'];
    const fileTypes = ['individual', 'consolidated', 'data_products'];
    
    for (const modelerType of modelerTypes) {
        for (const fileType of fileTypes) {
            await syncFilesFromFolder(directoryHandle, modelerType, fileType);
        }
    }
}

async function syncFilesFromFolder(directoryHandle, modelerType, fileType) {
    const folderName = getFolderName(modelerType, fileType);
    try {
        const database = await openDB();
        const storeName = getStoreName(modelerType, fileType);
        
        const existingFiles = await new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });

        const existingFilesMap = new Map(existingFiles.map(f => [f.name, f]));

        let folderHandle;
        try {
            folderHandle = await directoryHandle.getDirectoryHandle(folderName);
        } catch (error) {
            return;
        }

        const currentFileNames = new Set();
        const filesToAdd = [];
        const filesToUpdate = [];
        
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                currentFileNames.add(entry.name);
                try {
                    const fileHandle = await folderHandle.getFileHandle(entry.name);
                    const fileObj = await fileHandle.getFile();
                    const text = await fileObj.text();
                    let fileData = null;
                    try {
                        fileData = JSON.parse(text);
                    } catch (e) {
                        console.warn(`Failed to parse JSON for ${entry.name}`);
                    }
                    
                    const existingFile = existingFilesMap.get(entry.name);
                    const fileModifiedTime = fileObj.lastModified ? new Date(fileObj.lastModified).toISOString() : new Date().toISOString();
                    
                    if (existingFile) {
                        const fileEntry = {
                            ...existingFile,
                            updatedAt: fileModifiedTime,
                        };
                        
                        if (fileData) {
                            fileEntry.data = fileData;
                        }
                        
                        filesToUpdate.push(fileEntry);
                    } else {
                        const fileEntry = {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${filesToAdd.length}`,
                            name: entry.name,
                            createdAt: fileModifiedTime,
                            updatedAt: fileModifiedTime,
                            sourceFileIds: [],
                        };
                        
                        if (fileData) {
                            fileEntry.data = fileData;
                        }
                        
                        filesToAdd.push(fileEntry);
                    }
                } catch (error) {
                    console.error(`Error reading file ${entry.name}:`, error);
                }
            }
        }

        await new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const nameIndex = store.index('name');
            let completed = 0;
            let totalOps = filesToAdd.length + filesToUpdate.length;
            let hasError = false;

            if (totalOps === 0) {
                resolve();
                return;
            }

            for (const fileEntry of filesToAdd) {
                const checkRequest = nameIndex.get(fileEntry.name);
                checkRequest.onsuccess = () => {
                    const existingEntry = checkRequest.result;
                    let finalRequest;
                    if (existingEntry) {
                        const updatedEntry = {
                            ...existingEntry,
                            updatedAt: fileEntry.updatedAt,
                            data: fileEntry.data
                        };
                        finalRequest = store.put(updatedEntry);
                    } else {
                        finalRequest = store.add(fileEntry);
                    }
                    finalRequest.onsuccess = () => {
                        completed++;
                        if (completed === totalOps && !hasError) {
                            resolve();
                        }
                    };
                    finalRequest.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(finalRequest.error);
                        }
                    };
                };
                checkRequest.onerror = () => {
                    if (!hasError) {
                        hasError = true;
                        reject(checkRequest.error);
                    }
                };
            }

            for (const fileEntry of filesToUpdate) {
                const putRequest = store.put(fileEntry);
                putRequest.onsuccess = () => {
                    completed++;
                    if (completed === totalOps && !hasError) {
                        resolve();
                    }
                };
                putRequest.onerror = () => {
                    if (!hasError) {
                        hasError = true;
                        reject(putRequest.error);
                    }
                };
            }
        });

        const filesToDelete = existingFiles.filter(f => !currentFileNames.has(f.name));
        if (filesToDelete.length > 0) {
            await new Promise((resolve, reject) => {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                let completed = 0;
                let hasError = false;

                for (const file of filesToDelete) {
                    const deleteRequest = store.delete(file.id);
                    deleteRequest.onsuccess = () => {
                        completed++;
                        if (completed === filesToDelete.length && !hasError) {
                            resolve();
                        }
                    };
                    deleteRequest.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(deleteRequest.error);
                        }
                    };
                }
            });
        }
    } catch (error) {
        console.error(`Error syncing files from ${folderName}:`, error);
    }
}

async function clearAllFiles() {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_FILES], 'readwrite');
        const store = transaction.objectStore(STORE_FILES);
        store.clear();
    } catch (error) {
        console.error('Error clearing files:', error);
    }
}

export async function getStorageDirectory() {
    return await getDirectoryHandle();
}

export async function getStorageDirectoryPath() {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_META], 'readonly');
        const store = transaction.objectStore(STORE_META);
        const request = store.get(DIRECTORY_PATH_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = async () => {
                const storedPath = request.result;
                if (storedPath) {
                    resolve(storedPath);
                    return;
                }
                
                const handle = await getDirectoryHandle();
                if (handle) {
                    const folderName = handle.name;
                    resolve(folderName || "");
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting directory path:', error);
        return null;
    }
}

export async function getAllFiles(modelerType = 'sql', fileType = 'individual') {
    try {
        const database = await openDB();
        const storeName = getStoreName(modelerType, fileType);
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error reading files from storage:', error);
        return [];
    }
}

export async function saveFile(fileName, fileData, modelerType = 'sql', fileType = 'individual') {
    try {
        let handle = await getDirectoryHandle();
        if (!handle) {
            handle = await selectStorageDirectory();
            if (!handle) {
                throw new Error('No storage directory selected');
            }
        }

        const folderName = getFolderName(modelerType, fileType);
        const folderHandle = await handle.getDirectoryHandle(folderName, { create: true });
        
        const files = await getAllFiles(modelerType, fileType);
        const fileId = Date.now().toString();
        const fileEntry = {
            id: fileId,
            name: fileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: fileData,
        };

        const existingIndex = files.findIndex(f => f.name === fileName);
        if (existingIndex >= 0) {
            fileEntry.id = files[existingIndex].id;
            fileEntry.createdAt = files[existingIndex].createdAt;
        }

        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(fileData, null, 2));
        await writable.close();

        const database = await openDB();
        const storeName = getStoreName(modelerType, fileType);
        
        await new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (existingIndex >= 0) {
                request = store.put(fileEntry);
            } else {
                request = store.add(fileEntry);
            }
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        return fileEntry;
    } catch (error) {
        console.error('Error saving file to storage:', error);
        throw error;
    }
}

export async function getFile(fileId, modelerType = 'sql', fileType = 'individual') {
    try {
        const files = await getAllFiles(modelerType, fileType);
        const file = files.find(f => f.id === fileId);
        if (!file) return null;

        const handle = await getDirectoryHandle();
        if (!handle) {
            if (file.data) {
                return file;
            }
            throw new Error('No storage directory available');
        }

        const folderName = getFolderName(modelerType, fileType);
        try {
            const folderHandle = await handle.getDirectoryHandle(folderName);
            const fileHandle = await folderHandle.getFileHandle(file.name);
            const fileObj = await fileHandle.getFile();
            const text = await fileObj.text();
            const data = JSON.parse(text);

            return {
                ...file,
                data: data
            };
        } catch (error) {
            if (file.data) {
                return file;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error getting file from storage:', error);
        return null;
    }
}

export async function renameFile(fileId, newFileName, modelerType = 'sql', fileType = 'individual') {
    try {
        const files = await getAllFiles(modelerType, fileType);
        const file = files.find(f => f.id === fileId);
        if (!file) return false;

        if (file.name === newFileName) return true;

        const handle = await getDirectoryHandle();
        if (!handle) {
            throw new Error('No storage directory available');
        }

        const folderName = getFolderName(modelerType, fileType);
        const folderHandle = await handle.getDirectoryHandle(folderName);
        const oldFileHandle = await folderHandle.getFileHandle(file.name);
        const fileObj = await oldFileHandle.getFile();
        const text = await fileObj.text();

        const newFileHandle = await folderHandle.getFileHandle(newFileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(text);
        await writable.close();

        try {
            await folderHandle.removeEntry(file.name);
        } catch (error) {
            console.warn('Error removing old file:', error);
        }

        const updatedFileEntry = {
            ...file,
            name: newFileName,
            updatedAt: new Date().toISOString(),
        };

        const database = await openDB();
        const storeName = getStoreName(modelerType, fileType);
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(updatedFileEntry);

        return true;
    } catch (error) {
        console.error('Error renaming file:', error);
        return false;
    }
}

export async function deleteFile(fileId, modelerType = 'sql', fileType = 'individual') {
    try {
        const files = await getAllFiles(modelerType, fileType);
        const file = files.find(f => f.id === fileId);
        if (!file) return false;

        const handle = await getDirectoryHandle();
        if (handle) {
            try {
                const folderName = getFolderName(modelerType, fileType);
                const folderHandle = await handle.getDirectoryHandle(folderName);
                await folderHandle.removeEntry(file.name);
            } catch (error) {
                console.warn('Error deleting file from directory:', error);
            }
        }

        const database = await openDB();
        const storeName = getStoreName(modelerType, fileType);
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(fileId);

        return true;
    } catch (error) {
        console.error('Error deleting file from storage:', error);
        return false;
    }
}

export function setCurrentFile(fileId) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await openDB();
            const transaction = database.transaction([STORE_META], 'readwrite');
            const store = transaction.objectStore(STORE_META);
            if (fileId) {
                store.put(fileId, CURRENT_FILE_KEY);
            } else {
                store.delete(CURRENT_FILE_KEY);
            }
            resolve();
        } catch (error) {
            console.error('Error setting current file:', error);
            reject(error);
        }
    });
}

export function getCurrentFile() {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await openDB();
            const transaction = database.transaction([STORE_META], 'readonly');
            const store = transaction.objectStore(STORE_META);
            const request = store.get(CURRENT_FILE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        } catch (error) {
            console.error('Error getting current file:', error);
            resolve(null);
        }
    });
}

export function clearCurrentFile() {
    return setCurrentFile(null);
}

export async function getAllMergedFiles(modelerType = 'sql') {
    return getAllFiles(modelerType, 'consolidated');
}

export async function saveMergedFile(fileName, fileData, sourceFileIds, modelerType = 'sql') {
    return saveFile(fileName, fileData, modelerType, 'consolidated');
}

export async function getMergedFile(fileId, modelerType = 'sql') {
    return getFile(fileId, modelerType, 'consolidated');
}

export async function renameMergedFile(fileId, newFileName, modelerType = 'sql') {
    return renameFile(fileId, newFileName, modelerType, 'consolidated');
}

export async function deleteMergedFile(fileId, modelerType = 'sql') {
    return deleteFile(fileId, modelerType, 'consolidated');
}

export async function clearOldDataStores() {
    try {
        const database = await openDB();
        const oldStores = ['files', 'merged_files'];
        
        for (const storeName of oldStores) {
            if (database.objectStoreNames.contains(storeName)) {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => {
                        console.log(`Cleared old store: ${storeName}`);
                        resolve();
                    };
                    clearRequest.onerror = () => reject(clearRequest.error);
                });
            }
        }
        console.log('Old data stores cleared successfully');
        return true;
    } catch (error) {
        console.error('Error clearing old data stores:', error);
        return false;
    }
}

export async function deleteDatabase() {
    return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            console.log('Database deleted successfully');
            db = null;
            resolve();
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked. Close all tabs and try again.');
            reject(new Error('Database deletion blocked'));
        };
    });
}

export async function syncFilesFromDirectory() {
    try {
        const handle = await getDirectoryHandle();
        if (!handle) {
            throw new Error('No storage directory available');
        }
        await syncAllFilesFromDirectory(handle);
        return true;
    } catch (error) {
        console.error('Error syncing files from directory:', error);
        return false;
    }
}

export async function getStorageDirectoryWithSync() {
    return await getDirectoryHandle(true);
}

export async function getAllDataProducts(modelerType = 'sql') {
    try {
        const database = await openDB();
        const storeName = getStoreName(modelerType, 'data_products');
        
        if (!database.objectStoreNames.contains(storeName)) {
            return [];
        }
        
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting all data products from storage:', error);
        return [];
    }
}

function sanitizeForIndexedDB(obj) {
    const seen = new WeakMap();
    function walk(value) {
        if (value === null) return null;
        const t = typeof value;
        if (t === 'function') return undefined;
        if (t !== 'object') return value;
        if (value instanceof Date) return value.toISOString();
        if (seen.has(value)) return '[Circular]';
        seen.set(value, true);
        if (Array.isArray(value)) {
            const arr = [];
            for (const item of value) {
                const v = walk(item);
                arr.push(v === undefined ? null : v);
            }
            return arr;
        }
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            const w = walk(v);
            if (w !== undefined) out[k] = w;
        }
        return out;
    }
    return walk(obj);
}

export async function saveDataProduct(fileName, fileData, existingFileId = null, modelerType = 'sql') {
    try {
        let handle = await getDirectoryHandle();
        if (!handle) {
            handle = await selectStorageDirectory();
            if (!handle) {
                throw new Error('No storage directory selected');
            }
        }

        const folderName = getFolderName(modelerType, 'data_products');
        const dataProductsFolderHandle = await handle.getDirectoryHandle(folderName, { create: true });

        const allProducts = await getAllDataProducts(modelerType);
        
        if (!existingFileId) {
            const duplicate = allProducts.find(p => p.name === fileName);
            if (duplicate) {
                throw new Error(`A data product with the name "${fileName}" already exists`);
            }
        }

        let existingProduct = null;
        if (existingFileId) {
            existingProduct = allProducts.find(p => p.id === existingFileId);
        }

        const fileHandle = await dataProductsFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(fileData, null, 2));
        await writable.close();

        const sanitizedData = sanitizeForIndexedDB(fileData);

        const database = await openDB();
        const storeName = getStoreName(modelerType, 'data_products');
        
        if (!database.objectStoreNames.contains(storeName)) {
            await new Promise((resolve, reject) => {
                database.close();
                const request = indexedDB.open(DB_NAME, DB_VERSION + 1);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };
                request.onupgradeneeded = (event) => {
                    const database = event.target.result;
                    if (!database.objectStoreNames.contains(storeName)) {
                        database.createObjectStore(storeName, { keyPath: 'id' });
                    }
                };
            });
        }

        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        if (existingFileId && existingProduct) {
            const updatedEntry = {
                ...existingProduct,
                name: fileName,
                updatedAt: new Date().toISOString(),
                data: sanitizedData,
            };
            store.put(updatedEntry);
            
            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
            
            return updatedEntry;
        } else {
            const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const fileEntry = {
                id: fileId,
                name: fileName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: sanitizedData,
            };
            store.add(fileEntry);
            
            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
            
            return fileEntry;
        }
    } catch (error) {
        console.error('Error saving data product to storage:', error);
        throw error;
    }
}

export async function getDataProduct(fileId, modelerType = 'sql') {
    try {
        const dataProducts = await getAllDataProducts(modelerType);
        const dataProduct = dataProducts.find(f => f.id === fileId);
        if (!dataProduct) return null;

        const handle = await getDirectoryHandle();
        if (!handle) {
            if (dataProduct.data) {
                return dataProduct;
            }
            throw new Error('No storage directory available');
        }

        try {
            const folderName = getFolderName(modelerType, 'data_products');
            const dataProductsFolderHandle = await handle.getDirectoryHandle(folderName);
            const fileHandle = await dataProductsFolderHandle.getFileHandle(dataProduct.name);
            const fileObj = await fileHandle.getFile();
            const text = await fileObj.text();
            const data = JSON.parse(text);

            return {
                ...dataProduct,
                data: data
            };
        } catch (error) {
            if (dataProduct.data) {
                return dataProduct;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error getting data product from storage:', error);
        return null;
    }
}

export async function renameDataProduct(fileId, newFileName, modelerType = 'sql') {
    try {
        const dataProduct = await getDataProduct(fileId, modelerType);
        if (!dataProduct) return false;

        if (dataProduct.name === newFileName) return true;

        const handle = await getDirectoryHandle();
        if (!handle) {
            throw new Error('No storage directory available');
        }

        const folderName = getFolderName(modelerType, 'data_products');
        const dataProductsFolderHandle = await handle.getDirectoryHandle(folderName);
        const oldFileHandle = await dataProductsFolderHandle.getFileHandle(dataProduct.name);
        const fileObj = await oldFileHandle.getFile();
        const text = await fileObj.text();

        const newFileHandle = await dataProductsFolderHandle.getFileHandle(newFileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(text);
        await writable.close();

        try {
            await dataProductsFolderHandle.removeEntry(dataProduct.name);
        } catch (error) {
            console.warn('Error removing old data product file:', error);
        }

        const updatedFileEntry = {
            ...dataProduct,
            name: newFileName,
            updatedAt: new Date().toISOString(),
        };

        const database = await openDB();
        const storeName = getStoreName(modelerType, 'data_products');
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(updatedFileEntry);

        return true;
    } catch (error) {
        console.error('Error renaming data product:', error);
        return false;
    }
}

export async function deleteDataProduct(fileId, modelerType = 'sql') {
    try {
        const dataProduct = await getDataProduct(fileId, modelerType);
        if (dataProduct) {
            const handle = await getDirectoryHandle();
            if (handle) {
                try {
                    const folderName = getFolderName(modelerType, 'data_products');
                    const dataProductsFolderHandle = await handle.getDirectoryHandle(folderName);
                    await dataProductsFolderHandle.removeEntry(dataProduct.name);
                } catch (error) {
                    console.warn('Error deleting data product file from directory:', error);
                }
            }
        }

        const database = await openDB();
        const storeName = getStoreName(modelerType, 'data_products');
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(fileId);

        return true;
    } catch (error) {
        console.error('Error deleting data product from storage:', error);
        return false;
    }
}
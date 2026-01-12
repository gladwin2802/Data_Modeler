import { useState, useCallback } from 'react';

export const useSuggestions = () => {
    const [showSuggestDialog, setShowSuggestDialog] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const generateSuggestions = useCallback((nodes, sourceDataProduct) => {
        if (!sourceDataProduct || !sourceDataProduct.entities) {
            setSuggestions([]);
            return;
        }

        const canvasEntityKeys = new Set(
            nodes.map(node => `${node.data.tableType}_${node.data.tableName}`)
        );

        const allSuggestions = [];

        for (const entityKey in sourceDataProduct.entities) {
            if (canvasEntityKeys.has(entityKey)) {
                continue;
            }

            const entity = sourceDataProduct.entities[entityKey];
            const entityType = entityKey.split('_')[0];
            const entityName = entityKey.replace(/^(BASE_|CTE_|VIEW_)/, '');

            if (entityType === 'BASE') {
                continue;
            }

            const referencedEntities = [];
            const matchingTables = [];
            const missingEntities = [];
            const dependencyMap = {};

            if (entity.fields) {
                for (const fieldName in entity.fields) {
                    const field = entity.fields[fieldName];
                    
                    if (field.ref) {
                        // Handle both object format {entity, field} and array format ["entity.field"]
                        const refs = Array.isArray(field.ref) ? field.ref : [field.ref];
                        
                        refs.forEach(refItem => {
                            let refEntityKey, refFieldName;
                            
                            if (typeof refItem === 'string') {
                                // Handle array format: ["BASE_table.field"]
                                [refEntityKey, refFieldName] = refItem.split('.');
                            } else if (typeof refItem === 'object' && refItem.entity) {
                                // Handle object format: {entity: "BASE_table", field: "field"}
                                refEntityKey = refItem.entity;
                                refFieldName = refItem.field;
                            }
                            
                            if (!refEntityKey) return;
                            
                            const refEntityName = refEntityKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                            const refEntityType = refEntityKey.split('_')[0];

                            if (!referencedEntities.includes(refEntityKey)) {
                                referencedEntities.push(refEntityKey);
                            }

                            const isOnCanvas = canvasEntityKeys.has(refEntityKey);
                            if (isOnCanvas) {
                                if (!matchingTables.includes(refEntityName)) {
                                    matchingTables.push(refEntityName);
                                }

                                if (!dependencyMap[refEntityKey]) {
                                    dependencyMap[refEntityKey] = [];
                                }
                                dependencyMap[refEntityKey].push({
                                    sourceField: refFieldName || 'unknown',
                                    targetField: fieldName,
                                    connectionType: 'ref'
                                });
                            } else {
                                if (!missingEntities.some(e => e.name === refEntityName)) {
                                    missingEntities.push({
                                        name: refEntityName,
                                        type: refEntityType
                                    });
                                }
                            }
                        });
                    }

                    if (field.calculation && field.calculation.ref) {
                        const refs = Array.isArray(field.calculation.ref) ? field.calculation.ref : [];
                        refs.forEach(refPath => {
                            const parts = refPath.split('.');
                            if (parts.length >= 2) {
                                const refEntityKey = parts[0];
                                const refFieldName = parts.slice(1).join('.');

                                if (!referencedEntities.includes(refEntityKey)) {
                                    referencedEntities.push(refEntityKey);
                                }

                                const isOnCanvas = canvasEntityKeys.has(refEntityKey);
                                if (isOnCanvas) {
                                    if (!dependencyMap[refEntityKey]) {
                                        dependencyMap[refEntityKey] = [];
                                    }
                                    dependencyMap[refEntityKey].push({
                                        sourceField: refFieldName,
                                        targetField: fieldName,
                                        connectionType: 'calculation'
                                    });
                                }
                            }
                        });
                    }

                    if (field.calculation && field.calculation.dependencies) {
                        field.calculation.dependencies.forEach(dep => {
                            const depEntityKey = dep.entity;
                            if (!depEntityKey) return;
                            
                            const depEntityName = depEntityKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                            const depEntityType = depEntityKey.split('_')[0];

                            if (!referencedEntities.includes(depEntityKey)) {
                                referencedEntities.push(depEntityKey);
                            }

                            const isOnCanvas = canvasEntityKeys.has(depEntityKey);
                            if (isOnCanvas) {
                                if (!matchingTables.includes(depEntityName)) {
                                    matchingTables.push(depEntityName);
                                }

                                if (!dependencyMap[depEntityKey]) {
                                    dependencyMap[depEntityKey] = [];
                                }
                                dependencyMap[depEntityKey].push({
                                    sourceField: dep.field,
                                    targetField: fieldName,
                                    connectionType: 'calculation'
                                });
                            } else {
                                if (!missingEntities.some(e => e.name === depEntityName)) {
                                    missingEntities.push({
                                        name: depEntityName,
                                        type: depEntityType
                                    });
                                }
                            }
                        });
                    }
                }
            }

            const coveragePercent = referencedEntities.length > 0
                ? Math.round((matchingTables.length / referencedEntities.length) * 100)
                : 0;

            if (matchingTables.length > 0) {
                allSuggestions.push({
                    entityName,
                    entityType,
                    alias: entity.alias || null,
                    sourceFile: sourceDataProduct.metadata?.name || 'Unknown',
                    referencedEntitiesCount: referencedEntities.length,
                    matchingTables,
                    missingEntities,
                    coveragePercent,
                    dependencyMap,
                    level: 1,
                    entityData: entity
                });
            }
        }

        setSuggestions(allSuggestions);
        setShowSuggestDialog(true);
    }, []);

    return {
        showSuggestDialog,
        suggestions,
        generateSuggestions,
        setShowSuggestDialog
    };
};

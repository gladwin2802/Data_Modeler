import { useState } from 'react';

export const useSuggestions = () => {
    const [showSuggestDialog, setShowSuggestDialog] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionType, setSuggestionType] = useState('projected'); // 'projected' or 'joins'

    const generateProjectedEntitySuggestions = async (nodes, entitySource) => {
        try {
            // console.log("Current nodes:", nodes);
            // console.log("Source data product:", entitySource);  // tableMetadata
            const sourceEntities = entitySource || {};

            if (!entitySource || Object.keys(sourceEntities).length === 0) {
                alert('No data product entities available for suggestions.');
                return;
            }

            const canvasTables = nodes.map(node => ({
                name: node.data.tableName,
                type: node.data.tableType,
                fields: node.data.fields,
                fullKey: `${node.data.tableType}_${node.data.tableName}`
            }));

            if (canvasTables.length === 0) {
                alert('Please add some tables to the canvas first!');
                return;
            }

            const canvasEntityKeys = new Set(canvasTables.map(t => t.fullKey));

            const foundSuggestions = [];
            for (const entityKey in sourceEntities) {
                if (canvasEntityKeys.has(entityKey)) continue;
                if (!entityKey.startsWith('CTE_') && !entityKey.startsWith('VIEW_')) continue;

                const entity = sourceEntities[entityKey];
                const entityFields = Array.isArray(entity.fields) ? entity.fields : [];
                if (entityFields.length === 0) continue;

                const referencedEntities = new Set();
                const missingReferencedEntities = new Set();
                const dependencyMap = {}; // Map of dependent entities to their connection details
                const dependencyTypes = {}; // Track the type of each dependency (BASE, CTE, VIEW)

                entityFields.forEach(fieldObj => {
                    const fieldName = fieldObj.name;
                    const fieldData = fieldObj;
                    
                    const processRefs = (refs, isCalculation = false) => {
                        if (refs && Array.isArray(refs)) {
                            refs.forEach(refPath => {
                                const [refEntity, refField] = refPath.split('.');
                                if (refEntity && refField) {
                                    const isOnCanvas = canvasTables.some(t => 
                                        t.fullKey === refEntity || `${t.type}_${t.name}` === refEntity
                                    );
                                    
                                    // Extract entity type from the full key (BASE_, CTE_, VIEW_)
                                    const entityType = refEntity.split('_')[0]; // BASE, CTE, or VIEW
                                    const entityName = refEntity.substring(entityType.length + 1); // Remove prefix
                                    
                                    // Store dependency details for connection creation with original dependency info
                                    if (!dependencyMap[refEntity]) {
                                        dependencyMap[refEntity] = [];
                                        dependencyTypes[refEntity] = { type: entityType, name: entityName };
                                    }
                                    dependencyMap[refEntity].push({
                                        targetField: fieldName,
                                        sourceField: refField,
                                        connectionType: isCalculation ? 'calculation' : 'ref',
                                        calculation: isCalculation ? (fieldData.calculation?.expression || '') : null,
                                        dependencyEntityType: entityType, // Track original dependency type
                                        dependencyEntityName: entityName
                                    });
                                    
                                    if (isOnCanvas) {
                                        referencedEntities.add(refEntity);
                                    } else {
                                        missingReferencedEntities.add(refEntity);
                                    }
                                }
                            });
                        }
                    };

                    processRefs(fieldData.ref, false);
                    if (fieldData.calculation) {
                        processRefs(fieldData.calculation.ref, true);
                    }
                });
                
                if (referencedEntities.size > 0) {
                    const totalReferencedEntities = referencedEntities.size + missingReferencedEntities.size;
                    const coveragePercent = Math.round((referencedEntities.size / totalReferencedEntities) * 100);
                    
                    const missingEntitiesWithTypes = Array.from(missingReferencedEntities).map(fullKey => {
                        const type = fullKey.match(/^(BASE|CTE|VIEW)_/) ? fullKey.match(/^(BASE|CTE|VIEW)_/)[1] : 'BASE';
                        const name = fullKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                        const entityData = sourceEntities[fullKey] || {};
                        return { 
                            fullKey, 
                            name, 
                            type,
                            ...entityData
                        };
                    });
                    
                    foundSuggestions.push({
                        entityName: entityKey,
                        alias: entity.alias || entityKey,
                        entityType: entityKey.startsWith('CTE_') ? 'CTE' : 'VIEW',
                        sourceFile: "Unknown", // Placeholder, can be enhanced to track source files
                        matchingTables: Array.from(referencedEntities).map(e => e.replace(/^(BASE_|CTE_|VIEW_)/, '')),
                        coveragePercent,
                        missingEntities: missingEntitiesWithTypes,
                        totalFields: entityFields.length,
                        referencedEntitiesCount: totalReferencedEntities,
                        dependencyMap, // Store the complete dependency mapping with connection details
                        entityData: entity // Store full entity data for later use
                    });
                }
            }

            const uniqueSuggestions = [];
            const seenEntities = new Set();
            
            for (const suggestion of foundSuggestions) {
                if (!seenEntities.has(suggestion.entityName)) {
                    seenEntities.add(suggestion.entityName);
                    uniqueSuggestions.push(suggestion);
                }
            }

            uniqueSuggestions.sort((a, b) => b.coveragePercent - a.coveragePercent);
            // console.log("Generated suggestions:", uniqueSuggestions);
            setSuggestions(uniqueSuggestions);
            setShowSuggestDialog(true);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            alert('Error generating suggestions: ' + error.message);
        }
    };

    const generateJoinBasedSuggestions = async (nodes, entitySource) => {
        try {
            const sourceEntities = entitySource || {};

            if (!entitySource || Object.keys(sourceEntities).length === 0) {
                alert('No data product entities available for suggestions.');
                return;
            }

            const canvasTables = nodes.map(node => ({
                name: node.data.tableName,
                type: node.data.tableType,
                fields: node.data.fields,
                fullKey: `${node.data.tableType}_${node.data.tableName}`
            }));

            if (canvasTables.length === 0) {
                alert('Please add some tables to the canvas first!');
                return;
            }

            const canvasEntityKeys = new Set(canvasTables.map(t => t.fullKey));
            const foundSuggestions = [];

            // Find entities that have join relationships with canvas tables using the joins section
            for (const entityKey in sourceEntities) {
                if (canvasEntityKeys.has(entityKey)) continue;
                if (!entityKey.startsWith('CTE_') && !entityKey.startsWith('VIEW_')) continue;

                const entity = sourceEntities[entityKey];
                const joins = Array.isArray(entity.joins) ? entity.joins : [];
                
                if (joins.length === 0) continue;

                // Helper function to extract entity key from various formats
                const extractEntityKey = (entityData) => {
                    if (!entityData) return null;
                    if (typeof entityData === 'object' && entityData.field) {
                        return entityData.field.split('.')[0];
                    }
                    if (typeof entityData === 'string') {
                        return entityData;
                    }
                    return null;
                };

                // Identify all entities involved in joins
                const joinedEntities = new Set();
                joins.forEach(join => {
                    const fromKey = extractEntityKey(join.fromEntity || join.from);
                    const toKey = extractEntityKey(join.toEntity || join.to);
                    if (fromKey) joinedEntities.add(fromKey);
                    if (toKey) joinedEntities.add(toKey);
                });

                // Check if any joined entity is on canvas
                const hasCanvasJoin = Array.from(joinedEntities).some(entityKey => 
                    canvasTables.some(t => t.fullKey === entityKey || `${t.type}_${t.name}` === entityKey)
                );

                if (!hasCanvasJoin) continue;

                // Now extract field-level data like in generateProjectedEntitySuggestions
                const referencedEntities = new Set();
                const missingReferencedEntities = new Set();
                const dependencyMap = {};
                const dependencyTypes = {};

                const entityFields = Array.isArray(entity.fields) ? entity.fields : [];

                entityFields.forEach(fieldObj => {
                    const fieldName = fieldObj.name;
                    const fieldData = fieldObj;
                    
                    const processRefs = (refs, isCalculation = false) => {
                        if (refs && Array.isArray(refs)) {
                            refs.forEach(refPath => {
                                const [refEntity, refField] = refPath.split('.');
                                if (refEntity && refField) {
                                    const isOnCanvas = canvasTables.some(t => 
                                        t.fullKey === refEntity || `${t.type}_${t.name}` === refEntity
                                    );
                                    
                                    // Extract entity type from the full key (BASE_, CTE_, VIEW_)
                                    const entityType = refEntity.split('_')[0];
                                    const entityName = refEntity.substring(entityType.length + 1);
                                    
                                    // Store dependency details for connection creation
                                    if (!dependencyMap[refEntity]) {
                                        dependencyMap[refEntity] = [];
                                        dependencyTypes[refEntity] = { type: entityType, name: entityName };
                                    }
                                    dependencyMap[refEntity].push({
                                        targetField: fieldName,
                                        sourceField: refField,
                                        connectionType: isCalculation ? 'calculation' : 'ref',
                                        calculation: isCalculation ? (fieldData.calculation?.expression || '') : null,
                                        dependencyEntityType: entityType,
                                        dependencyEntityName: entityName
                                    });
                                    
                                    if (isOnCanvas) {
                                        referencedEntities.add(refEntity);
                                    } else {
                                        missingReferencedEntities.add(refEntity);
                                    }
                                }
                            });
                        }
                    };

                    processRefs(fieldData.ref, false);
                    if (fieldData.calculation) {
                        processRefs(fieldData.calculation.ref, true);
                    }
                });
                
                // Only suggest if entity has references to canvas tables (from fields)
                if (referencedEntities.size > 0) {
                    const totalReferencedEntities = referencedEntities.size + missingReferencedEntities.size;
                    const coveragePercent = Math.round((referencedEntities.size / totalReferencedEntities) * 100);
                    
                    const missingEntitiesWithTypes = Array.from(missingReferencedEntities).map(fullKey => {
                        const type = fullKey.match(/^(BASE|CTE|VIEW)_/) ? fullKey.match(/^(BASE|CTE|VIEW)_/)[1] : 'BASE';
                        const name = fullKey.replace(/^(BASE_|CTE_|VIEW_)/, '');
                        const entityData = sourceEntities[fullKey] || {};
                        return { 
                            fullKey, 
                            name, 
                            type,
                            ...entityData
                        };
                    });
                    
                    foundSuggestions.push({
                        entityName: entityKey,
                        alias: entity.alias || entityKey,
                        entityType: entityKey.startsWith('CTE_') ? 'CTE' : 'VIEW',
                        sourceFile: "Unknown",
                        matchingTables: Array.from(referencedEntities).map(e => e.replace(/^(BASE_|CTE_|VIEW_)/, '')),
                        coveragePercent,
                        missingEntities: missingEntitiesWithTypes,
                        totalFields: entityFields.length,
                        referencedEntitiesCount: totalReferencedEntities,
                        dependencyMap,
                        entityData: entity
                    });
                }
            }

            const uniqueSuggestions = [];
            const seenEntities = new Set();
            
            for (const suggestion of foundSuggestions) {
                if (!seenEntities.has(suggestion.entityName)) {
                    seenEntities.add(suggestion.entityName);
                    uniqueSuggestions.push(suggestion);
                }
            }

            uniqueSuggestions.sort((a, b) => b.coveragePercent - a.coveragePercent);
            setSuggestions(uniqueSuggestions);
            setShowSuggestDialog(true);
        } catch (error) {
            console.error('Error generating join-based suggestions:', error);
            alert('Error generating suggestions: ' + error.message);
        }
    };

    const generateSuggestions = async (nodes, entitySource, type = 'projected') => {
        if (type === 'joins') {
            await generateJoinBasedSuggestions(nodes, entitySource);
        } else {
            await generateProjectedEntitySuggestions(nodes, entitySource);
        }
        setSuggestionType(type);
    };

    return {
        showSuggestDialog,
        suggestions,
        suggestionType,
        generateSuggestions,
        setShowSuggestDialog,
        setSuggestionType
    };
};

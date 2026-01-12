import dagre from "dagre";

const getNodeDimensions = (node) => {
    if (node.type === "circleNode") {
        return { width: 120, height: 120 };
    }
    const fieldRows = node.data.fields?.length ?? 0;
    const headerHeight = 50;
    const fieldListPadding = 16;
    const fieldRowHeight = 38;
    const height = headerHeight + fieldListPadding + (fieldRows * fieldRowHeight);
    const width = 380;
    return { width, height };
};

export const getLayoutedElements = (nodes, edges, direction = "LR") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 250,
        ranksep: 350,
        align: 'UL',
        edgesep: 30,
        ranker: 'network-simplex',
        marginx: 50,
        marginy: 50,
    });

    nodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
    });
    
    edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
    dagre.layout(dagreGraph);

    return {
        nodes: nodes.map((node) => {
            const pos = dagreGraph.node(node.id);
            return {
                ...node,
                position: {
                    x: pos.x - pos.width / 2,
                    y: pos.y - pos.height / 2,
                },
            };
        }),
        edges,
    };
};

export const applyLayout = (nodes, edges, layoutType = 'dagre', direction = 'LR') => {
    const validDirection = direction === 'RL' ? 'RL' : 'LR';
    return getLayoutedElements(nodes, edges, validDirection);
};


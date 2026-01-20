# Data Model Visualizer

A powerful visual tool for designing, managing, and understanding your data models and transformations. Think of it as a canvas where you can see and work with your data structures visually, making complex data relationships easy to understand and manage.

## What Does This Application Do?

This application helps you:

### 📊 **Visualize Data Models**
See your database tables, their fields, and how they connect to each other in a beautiful visual diagram. No more getting lost in complex table relationships!

### 🔄 **Design Data Pipelines**
Create visual workflows showing how data flows from one place to another, what transformations happen along the way, and how different data sources connect together.

### 📦 **Build Data Products**
Organize your data models into reusable data products. A data product is like a package containing related tables and their relationships that can be shared and reused across projects.

### 🎯 **Work Both Ways**
- **Individual View**: Focus on one model at a time - perfect for building and editing
- **Consolidated View**: See the big picture with multiple models combined - great for understanding how everything fits together

## Key Features Explained

### Two Modeler Types

**SQL Modeler**
Work with your SQL queries visually. Upload JSON files representing your SQL table structures, see how tables join together, define calculations, and export the results.

**Pipeline Modeler**
Design data transformation pipelines. Map how data flows from source to destination, define field mappings, and visualize the entire data journey.

### Visual Canvas Features

- **Drag and Drop**: Move tables and entities around to organize your view
- **Zoom and Pan**: Navigate large models easily
- **Connection Lines**: See relationships between tables clearly with visual connection lines
- **Field Details**: View and edit individual fields within each table
- **Calculations**: Define custom calculations and transformations
- **Search**: Quickly find specific tables or fields
- **Export**: Save your work and share with others

### Smart Suggestions

The application provides intelligent suggestions for:
- Which tables should connect to each other
- Potential field relationships
- Common join patterns

### Local File Management

All your work is saved locally on your computer. You choose a folder, and the application manages everything there - complete control and privacy of your data.

---

## Technical Setup

### Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Modern Browser**: Chrome, Edge, or Opera (required for File System Access API)

### Installation

1. Clone or download the project to your local machine

2. Open a terminal/command prompt and navigate to the project directory:
```bash
cd Data_Modeler
```

3. Install dependencies:
```bash
npm install
```

### Running the Application

#### Development Mode
```bash
npm run dev
```
The application will start on `http://localhost:5173` (or another port if 5173 is busy)

#### Production Build
```bash
npm run build
```
This creates optimized files in the `dist` folder

#### Preview Production Build
```bash
npm run preview
```

### Project Structure

```
. 📂 src
├── 📄 App.jsx
└── 📂 assets/
└── 📂 components/
│  └── 📂 ConsolidatedPipelineView/
│    ├── 📄 AvailableEntitiesSidebar.jsx
│    ├── 📄 ConnectionSuggestionModal.jsx
│    ├── 📄 ConsolidatedFlowHeader.jsx
│  └── 📂 ConsolidatedSQLView/
│    ├── 📄 Header.jsx
│    ├── 📄 Minimap.jsx
│    ├── 📄 ZoomControls.jsx
│  └── 📂 DataProduct/
│    ├── 📄 CalculationDialog.jsx
│    ├── 📄 ConnectionTypeDialog.jsx
│    ├── 📄 DataProductSidebar.jsx
│    ├── 📄 ExportDialog.jsx
│    ├── 📄 ReverseDepsDialog.jsx
│    ├── 📄 SettingsDialog.jsx
│    ├── 📄 SuggestionDialog.jsx
│  └── 📂 IndividualPipelineView/
│    ├── 📄 EdgeConfigDialog.jsx
│    ├── 📄 EdgeContextMenu.jsx
│    ├── 📄 FieldDrawer.jsx
│    ├── 📄 FitViewHelper.jsx
│    ├── 📄 FlowHeader.jsx
│    └── 📂 TableNode/
│      ├── 📄 TableNode.jsx
│      ├── 📄 TableNodeAddField.jsx
│      ├── 📄 TableNodeCalculationEditor.jsx
│      ├── 📄 TableNodeField.jsx
│      ├── 📄 TableNodeFieldEditor.jsx
│      ├── 📄 TableNodeHeader.jsx
│  └── 📂 IndividualSQLView/
│    ├── 📄 EdgeConfigDialog.jsx
│    ├── 📄 EdgeContextMenu.jsx
│    ├── 📄 ExportDialog.jsx
│    ├── 📄 FieldCalculationPopup.jsx
│    ├── 📄 FieldDrawer.jsx
│    ├── 📄 FitViewHelper.jsx
│    ├── 📄 FlowHeader.jsx
│    ├── 📄 JoinDetailsDrawer.jsx
│    └── 📂 TableNode/
│      ├── 📄 TableNode.jsx
│      ├── 📄 TableNodeAddField.jsx
│      ├── 📄 TableNodeCalculationEditor.jsx
│      ├── 📄 TableNodeField.jsx
│      ├── 📄 TableNodeFieldEditor.jsx
│      ├── 📄 TableNodeHeader.jsx
│    ├── 📄 TableTypeDialog.jsx
└── 📂 hooks/
│  ├── 📄 useEdgeFiltering.js
│  ├── 📄 useEdgeHandlers.js
│  ├── 📄 useFieldHighlighting.js
│  ├── 📄 useFlowState.js
│  ├── 📄 useNodeDecoration.js
│  ├── 📄 useNodeHandlers.js
│  ├── 📄 usePipelineEdgeHandlers.js
│  ├── 📄 usePipelineFlowState.js
│  ├── 📄 usePipelineNodeHandlers.js
│  ├── 📄 useSuggestions.js
├── 📄 index.css
├── 📄 main.jsx
└── 📂 pages/
│  ├── 📄 ConsolidatedPipelineView.jsx
│  ├── 📄 ConsolidatedSQLView.jsx
│  ├── 📄 ControlPage.jsx
│  ├── 📄 DataProductPage.jsx
│  ├── 📄 IndividualPipelineView.jsx
│  ├── 📄 IndividualSQLView.jsx
└── 📂 testing/
│  └── 📂 PIPE_JSONs/
│    ├── 📄 combined_mapping.json
│    ├── 📄 distributor_mapping.json
│    ├── 📄 distributor_sale_order_mapping.json
│    ├── 📄 product_mapping.json
│  └── 📂 SQL/
│    ├── 📄 AccountsPayable.sql
│    ├── 📄 AccountsPayableOverview.sql
│    ├── 📄 AccountsPayableTurnover.sql
│    ├── 📄 BalanceSheet.sql
│    ├── 📄 CashDiscountUtilization.sql
│    ├── 📄 InventoryKeyMetrics.sql
│    ├── 📄 SalesFulfillment.sql
│    ├── 📄 VendorLeadTimeOverview.sql
│    ├── 📄 VendorPerformance.sql
│    ├── 📄 VendorPerformanceOverview.sql
│  └── 📂 SQL_JSONs/
│    ├── 📄 AccountsPayable.json
│    ├── 📄 AccountsPayableOverview.json
│    ├── 📄 AccountsPayableTurnover.json
│    ├── 📄 BalanceSheet.json
│    ├── 📄 CashDiscountUtilization.json
│    ├── 📄 InventoryKeyMetrics.json
│    ├── 📄 SalesFulfillment.json
│    ├── 📄 VendorLeadTimeOverview.json
│    ├── 📄 VendorPerformance.json
│    ├── 📄 VendorPerformanceOverview.json
│    ├── 📄 data_model.json
│  ├── 📄 test.ipynb
└── 📂 utils/
│  └── 📂 ConsolidatedSQLView/
│    ├── 📄 mergedToVisNetwork.js
│  └── 📂 ControlPage/
│    ├── 📄 fileStorage.js
│  └── 📂 DataProduct/
│    ├── 📄 layout.js
│  └── 📂 IndividualPipelineView/
│    ├── 📄 dataTransform.js
│    ├── 📄 edgeUtils.js
│    ├── 📄 flowToModel.js
│    ├── 📄 layout.js
│    ├── 📄 nodeUtils.js
│  └── 📂 IndividualSQLView/
│    ├── 📄 dataTransform.js
│    ├── 📄 edgeUtils.js
│    ├── 📄 flowToModel.js
│    ├── 📄 layout.js
│    └── 📄 nodeUtils.js
```

### Key Dependencies

- **React 19**: UI framework
- **React Router**: Navigation and routing
- **ReactFlow**: Visual flow diagram library
- **Vis-Network**: Network graph visualization
- **Dagre**: Graph layout algorithm
- **Vite**: Build tool and dev server

### Browser Compatibility

The File System Access API requires:
- Chrome 86+
- Edge 86+
- Opera 72+

Safari and Firefox do not currently support this feature.

### Environment Configuration

The application uses Vite's default configuration. To customize:
- Edit `vite.config.js` for build settings
- Edit `eslint.config.js` for linting rules

---

## Getting Started (First Time Use)

1. Launch the application
2. Click **"Select Storage Directory"** to choose where your files will be saved
3. Upload JSON files representing your data models
4. Choose between SQL or Pipeline modeler using the toggle
5. Click on any model to open it in the visual editor
6. Start exploring, editing, and creating!

## File Format

The application works with JSON files that describe your data structures. These files contain information about:
- Table names and types
- Field definitions
- Relationships and connections
- Calculations and transformations

Sample JSON files are available in the `src/testing/` directory for reference.

---

## Tips for Best Experience

- **Organize Your Folder**: Keep your JSON files in a dedicated folder for this application
- **Use Descriptive Names**: Name your files clearly so you can find them easily
- **Regular Saves**: The application auto-saves, but you can manually save using the save button
- **Layout Control**: Use the auto-layout feature to organize complex diagrams automatically
- **Zoom to Fit**: Use the fit-to-view button to see your entire model at once

## Support

For issues, questions, or suggestions, please refer to your technical team or the project maintainer.

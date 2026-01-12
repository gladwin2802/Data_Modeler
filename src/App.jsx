import { Routes, Route, Navigate } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import IndividualSQLView from "./pages/IndividualSQLView";
import ConsolidatedSQLView from "./pages/ConsolidatedSQLView";
import IndividualPipelineView from "./pages/IndividualPipelineView";
import ConsolidatedPipelineView from "./pages/ConsolidatedPipelineView";
import DataProductPage from "./pages/DataProductPage";
import "reactflow/dist/style.css";
import "./index.css";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<ControlPage />} />
            <Route path="/editor/:fileId" element={<IndividualSQLView />} />
            <Route path="/editor/merged/:fileId" element={<ConsolidatedSQLView />} />
            <Route path="/pipeline/editor/:fileId" element={<IndividualPipelineView />} />
            <Route path="/pipeline/editor/merged/:fileId" element={<ConsolidatedPipelineView />} />
            <Route path="/data-product" element={<DataProductPage />} />
            <Route path="/data-product/:productId" element={<DataProductPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

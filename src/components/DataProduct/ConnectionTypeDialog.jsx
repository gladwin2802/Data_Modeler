import { useState, useEffect } from "react";

const ConnectionTypeDialog = ({
  show,
  onClose,
  selectedEdgeDetails,
  onChangeConnectionType
}) => {
  if (!show || !selectedEdgeDetails) return null;

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
          padding: "32px",
          zIndex: 1000,
          minWidth: "400px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: "8px",
          }}
        >
          Connection Type
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "24px",
          }}
        >
          Select the type of relationship. Colors indicate:{" "}
          <span style={{ color: "#ef4444", fontWeight: 600 }}>Red</span> for
          Reference,{" "}
          <span style={{ color: "#3b82f6", fontWeight: 600 }}>Blue</span>{" "}
          for Calculation.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => onChangeConnectionType("ref")}
            style={{
              padding: "16px",
              border: `2px solid ${
                selectedEdgeDetails?.data?.connectionType === "ref"
                  ? "#3b82f6"
                  : "#e5e7eb"
              }`,
              borderRadius: "8px",
              background:
                selectedEdgeDetails?.data?.connectionType === "ref"
                  ? "#eff6ff"
                  : "white",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (selectedEdgeDetails?.data?.connectionType !== "ref") {
                e.target.style.background = "#f9fafb";
                e.target.style.borderColor = "#3b82f6";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedEdgeDetails?.data?.connectionType !== "ref") {
                e.target.style.background = "white";
                e.target.style.borderColor = "#e5e7eb";
              }
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "4px",
              }}
            >
              Direct Reference
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Directly projected attribute from source to target
            </div>
          </button>
          <button
            onClick={() => onChangeConnectionType("calculation")}
            style={{
              padding: "16px",
              border: `2px solid ${
                selectedEdgeDetails?.data?.connectionType === "calculation"
                  ? "#8b5cf6"
                  : "#e5e7eb"
              }`,
              borderRadius: "8px",
              background:
                selectedEdgeDetails?.data?.connectionType === "calculation"
                  ? "#f3e8ff"
                  : "white",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (
                selectedEdgeDetails?.data?.connectionType !== "calculation"
              ) {
                e.target.style.background = "#f9fafb";
                e.target.style.borderColor = "#8b5cf6";
              }
            }}
            onMouseLeave={(e) => {
              if (
                selectedEdgeDetails?.data?.connectionType !== "calculation"
              ) {
                e.target.style.background = "white";
                e.target.style.borderColor = "#e5e7eb";
              }
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "4px",
              }}
            >
              Calculation
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Calculated or derived relationship using expressions
            </div>
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default ConnectionTypeDialog;


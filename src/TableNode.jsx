import { memo } from "react";
import { Handle, Position } from "reactflow";

const TableNode = ({ data }) => {
  const bg = data.isViewOrCTE ? "#f0e6ff" : "#fff";
  const border = data.isViewOrCTE ? "2px solid #a855f7" : "1px solid #fff";

  return (
    <div
      style={{
        background: bg,
        border,
        borderRadius: 6,
        minWidth: 300,
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 6px rgba(0,0,0,.1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#555",
          color: "#fff",
          padding: "4px 8px",
          fontWeight: "bold",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          fontSize: 13,
        }}
      >
        {data.label}{" "}
        {data.alias && <small style={{ opacity: 0.7 }}>({data.alias})</small>}
      </div>

      {/* Field List */}
      <div style={{ padding: "4px 8px" }}>
        {data.fields.map((f, idx) => {
          const isSelected =
            data.selectedField?.nodeId === data.label &&
            data.selectedField?.fieldName === f.name;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 3,
                alignItems: "center",
                position: "relative",
                padding: "4px 12px",
                cursor: "pointer",
                background: isSelected ? "#f3f3f3" : "transparent",
                borderRadius: 4,
              }}
              onClick={() => data.onFieldClick?.(f.name, f)}
            >
              {/* Left Handle */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${data.label}-${f.name}`}
                style={{
                  background: "#555",
                  width: 8,
                  height: 8,
                  position: "absolute",
                  left: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />

              <span
                style={{
                  color: f.calculation ? "#333" : "inherit",
                  fontWeight: isSelected ? "bold" : f.calculation ? "500" : "normal",
                }}
              >
                {f.name}
              </span>

              {/* Right Handle */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${data.label}-${f.name}`}
                style={{
                  background: "#555",
                  width: 8,
                  height: 8,
                  position: "absolute",
                  right: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(TableNode);

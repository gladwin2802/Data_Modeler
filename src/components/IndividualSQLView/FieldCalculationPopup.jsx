import { FiX, FiHash } from "react-icons/fi";

/**
 * Popup component for displaying field calculations
 */
const FieldCalculationPopup = ({ field, onClose, position }) => {
    if (!field || !field.calculation) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
                    borderRadius: 16,
                    padding: '24px',
                    minWidth: '400px',
                    maxWidth: '600px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    position: 'relative',
                    maxHeight: '80vh',
                    overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #e5e7eb',
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            color: '#111827',
                            fontSize: '18px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <FiHash size={20} />
                        Field Calculation
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            cursor: 'pointer',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 150ms ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#dc2626';
                            e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#ef4444';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        <FiX size={16} />
                    </button>
                </div>

                {/* Field Information */}
                <div
                    style={{
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: 10,
                        border: '1px solid #fbbf24',
                    }}
                >
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#92400e', fontSize: '14px' }}>Field Name:</strong>
                        <span style={{ color: '#451a03', marginLeft: '8px', fontFamily: "'Fira Code', 'Courier New', monospace" }}>
                            {field.name}
                        </span>
                    </div>
                    {field.label && field.label !== field.name && (
                        <div>
                            <strong style={{ color: '#92400e', fontSize: '14px' }}>Field Label:</strong>
                            <span style={{ color: '#451a03', marginLeft: '8px' }}>
                                {field.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Calculation Content */}
                <div
                    style={{
                        marginBottom: '16px',
                    }}
                >
                    <h4
                        style={{
                            margin: '0 0 12px 0',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: 600,
                        }}
                    >
                        Calculation Expression:
                    </h4>
                    <div
                        style={{
                            padding: '16px',
                            background: '#1f2937',
                            borderRadius: 8,
                            border: '1px solid #374151',
                            fontFamily: "'Fira Code', 'Courier New', monospace",
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#f9fafb',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '300px',
                            overflow: 'auto',
                        }}
                    >
                        {/* Handle different calculation data structures */}
                        {typeof field.calculation === 'string' ? (
                            field.calculation
                        ) : typeof field.calculation === 'object' && field.calculation !== null ? (
                            <div>
                                {field.calculation.ref && field.calculation.ref.length > 0 ? (
                                    <div>
                                        <div style={{ marginBottom: '8px', color: '#10b981' }}>
                                            📋 Reference Fields:
                                        </div>
                                        {field.calculation.ref.map((ref, idx) => (
                                            <div key={idx} style={{ marginBottom: '4px', paddingLeft: '12px' }}>
                                                • {typeof ref === 'string' ? ref : JSON.stringify(ref)}
                                            </div>
                                        ))}
                                    </div>
                                ) : field.calculation.calculation ? (
                                    <div>
                                        <div style={{ marginBottom: '8px', color: '#10b981' }}>
                                            🔢 Nested Calculation:
                                        </div>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(field.calculation.calculation, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ marginBottom: '8px', color: '#10b981' }}>
                                            📝 Calculation Object:
                                        </div>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(field.calculation, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#f59e0b' }}>
                                ⚠️ No calculation expression found or unsupported format
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Footer */}
                <div
                    style={{
                        padding: '12px 16px',
                        background: '#f3f4f6',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        color: '#6b7280',
                    }}
                >
                    <strong>Note:</strong> This field contains a calculation expression. 
                    The displayed value is computed based on this expression.
                </div>
            </div>
        </div>
    );
};

export default FieldCalculationPopup;
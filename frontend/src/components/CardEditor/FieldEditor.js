import React from 'react';
import {
  HiTrash,
  HiChevronUp,
  HiChevronDown,
  HiLockClosed,
  HiLockOpen,
} from 'react-icons/hi';

const FieldEditor = ({
  field,
  index,
  totalFields,
  fieldTypes,
  onChange,
  onRemove,
  onMove,
}) => {
  const handleChange = (key, value) => {
    onChange({ ...field, [key]: value });
  };

  return (
    <div className="p-4 bg-term-base border border-term-border" style={{ borderRadius: '2px' }}>
      <div className="flex items-start gap-4">
        {/* Move buttons */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1 text-term-muted hover:text-term-subtle disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <HiChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={index === totalFields - 1}
            className="p-1 text-term-muted hover:text-term-subtle disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <HiChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Field inputs */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Label */}
          <div>
            <label className="text-xs text-term-muted mb-1 block font-mono uppercase tracking-widest">label *</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="input text-sm"
              placeholder="e.g., Full Name"
              maxLength={50}
            />
          </div>

          {/* Value */}
          <div>
            <label className="text-xs text-term-muted mb-1 block font-mono uppercase tracking-widest">value</label>
            {field.type === 'textarea' ? (
              <textarea
                value={field.value}
                onChange={(e) => handleChange('value', e.target.value)}
                className="input text-sm"
                placeholder="Enter value"
                rows={1}
                maxLength={1000}
              />
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                value={field.value}
                onChange={(e) => handleChange('value', e.target.value)}
                className="input text-sm"
                placeholder={
                  field.type === 'email'
                    ? 'email@example.com'
                    : field.type === 'phone'
                    ? '+1 234 567 8900'
                    : field.type === 'date'
                    ? 'YYYY-MM-DD'
                    : field.type === 'url'
                    ? 'https://example.com'
                    : 'Enter value'
                }
                maxLength={1000}
              />
            )}
          </div>

          {/* Type */}
          <div>
            <label className="text-xs text-term-muted mb-1 block font-mono uppercase tracking-widest">type</label>
            <select
              value={field.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="input text-sm"
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Encrypted toggle */}
          <div>
            <label className="text-xs text-term-muted mb-1 block font-mono uppercase tracking-widest">security</label>
            <button
              type="button"
              onClick={() => handleChange('encrypted', !field.encrypted)}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border text-xs font-mono transition-colors ${
                field.encrypted
                  ? 'bg-warn-muted border-warn text-warn'
                  : 'bg-term-base border-term-border text-term-muted hover:border-term-subtle'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {field.encrypted ? (
                <>
                  <HiLockClosed className="w-4 h-4" />
                  <span>encrypted</span>
                </>
              ) : (
                <>
                  <HiLockOpen className="w-4 h-4" />
                  <span>plain</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-term-muted hover:text-danger transition-colors"
          title="Remove field"
        >
          <HiTrash className="w-5 h-5" />
        </button>
      </div>

      {/* Encrypted warning */}
      {field.encrypted && (
        <p className="mt-2 text-xs text-warn font-mono flex items-center">
          <HiLockClosed className="w-3 h-3 mr-1" />
          this field will be encrypted with AES-256. the value will be hidden when shared.
        </p>
      )}
    </div>
  );
};

export default FieldEditor;

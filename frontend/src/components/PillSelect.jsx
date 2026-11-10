import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown estilo pastilla redondeada (reemplaza <select> nativo)
 * Renderiza el menú flotante vía Portal para evitar recortes en modales con overflow.
 */
export default function PillSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  menuMinWidth,
  align = 'left',
  disabled = false,
  hasCustomColors = false
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 160, openUp: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { value: opt.value, label: opt.label ?? String(opt.value) }
      : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find((o) => String(o.value) === String(value));

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = Math.min(normalizedOptions.length * 38 + 16, 250);
    const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, menuMinWidth || 0);
    let left = align === 'right' ? rect.right - width : rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    if (left < 12) left = 12;

    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUp
    });
  }, [normalizedOptions.length, menuMinWidth, align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleScrollOrResize = (e) => {
      if (menuRef.current && e?.target && menuRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  const defaultAppearance = hasCustomColors
    ? ''
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-[#173865] shadow-sm';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`rounded-full font-bold flex items-center justify-between gap-2 transition-all cursor-pointer select-none focus:outline-none ${
          open ? 'ring-2 ring-[#173865]/25 border-[#173865]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${defaultAppearance} ${
          className || 'w-full px-4 py-2 text-xs'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-400 font-semibold' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform duration-200 ${
            open ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999
            }}
            className="bg-white dark:bg-gray-900 rounded-[26px] shadow-[0_14px_38px_-6px_rgba(23,56,101,0.22)] border border-gray-100 dark:border-gray-800 p-1.5 max-h-60 overflow-y-auto animate-modal-in"
          >
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#eff4ff] dark:bg-blue-950/70 text-[#173865] dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-[#eff4ff] dark:hover:bg-blue-950/40 hover:text-[#173865]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#173865] dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

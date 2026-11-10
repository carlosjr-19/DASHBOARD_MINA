import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

function parseIsoDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const clean = isoStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIsoString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Selector de fecha personalizado con diseño de pastilla y calendario flotante redondeado.
 */
export default function PillDatePicker({
  value = '',
  onChange,
  placeholder = 'Seleccionar fecha',
  required = false,
  className = '',
  accent = 'navy'
}) {
  const parsedValue = parseIsoDate(value);
  const today = new Date();
  const todayIso = toIsoString(today);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((parsedValue || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((parsedValue || today).getMonth());
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (open) {
      const base = parseIsoDate(value) || new Date();
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
    }
  }, [open, value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 300;
    const estimatedHeight = 330;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }
    if (left < 12) left = 12;

    setCoords({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left,
      openUp
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleScrollOrResize = (e) => {
      if (popoverRef.current && e?.target && popoverRef.current.contains(e.target)) {
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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build 42-day grid (6 rows x 7 cols)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dt = new Date(viewYear, viewMonth - 1, d);
    cells.push({ date: dt, iso: toIsoString(dt), day: d, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    cells.push({ date: dt, iso: toIsoString(dt), day: d, currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(viewYear, viewMonth + 1, d);
    cells.push({ date: dt, iso: toIsoString(dt), day: d, currentMonth: false });
  }

  const formattedDisplay = parsedValue
    ? `${String(parsedValue.getDate()).padStart(2, '0')} ${MESES_CORTOS[parsedValue.getMonth()]} ${parsedValue.getFullYear()}`
    : '';

  const isGreen = accent === 'green';
  const selectedDayClass = isGreen
    ? 'bg-green-600 text-white shadow-md'
    : 'bg-[#173865] text-white shadow-md';

  const ringClass = isGreen
    ? 'ring-2 ring-green-500/30 border-green-500'
    : 'ring-2 ring-[#173865]/25 border-[#173865]';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`w-full rounded-full px-4 py-2 font-bold flex items-center justify-between gap-2 transition-all cursor-pointer select-none focus:outline-none ${
          open ? ringClass : ''
        } ${
          className ||
          'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-[#173865] shadow-sm text-xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={`w-3.5 h-3.5 shrink-0 ${isGreen ? 'text-green-600' : 'text-[#173865] dark:text-blue-400'}`} />
          <span className={`truncate ${!formattedDisplay ? 'text-gray-400 font-semibold' : ''}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        {!required && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                onChange('');
              }
            }}
            className="w-4 h-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 flex items-center justify-center shrink-0"
            title="Limpiar fecha"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: '300px',
              zIndex: 9999
            }}
            className="bg-white dark:bg-gray-900 rounded-[28px] shadow-[0_16px_44px_-8px_rgba(23,56,101,0.25)] border border-gray-100 dark:border-gray-800 p-4 animate-modal-in select-none"
          >
            {/* Header Mes y Año */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-[#eff4ff] text-[#173865] dark:text-blue-300 flex items-center justify-center transition-colors"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3.5 py-1 rounded-full bg-[#eff4ff] dark:bg-blue-950/60 text-[#173865] dark:text-blue-200 font-black text-xs tracking-wide">
                {MESES[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-[#eff4ff] text-[#173865] dark:text-blue-300 flex items-center justify-center transition-colors"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-[10px] font-bold uppercase text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Rejilla de días en pastillas circulares */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                const isSelected = value && cell.iso === value.split('T')[0];
                const isToday = cell.iso === todayIso;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      onChange(cell.iso);
                      setOpen(false);
                    }}
                    className={`w-9 h-9 mx-auto rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? selectedDayClass
                        : isToday
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-[#173865] dark:text-blue-300 ring-1 ring-blue-200 font-black hover:bg-[#eff4ff]'
                          : cell.currentMonth
                            ? 'text-gray-700 dark:text-gray-200 hover:bg-[#eff4ff] dark:hover:bg-blue-950/40 hover:text-[#173865]'
                            : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer de acciones rápidas */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  onChange(todayIso);
                  setOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#eff4ff] dark:bg-blue-950/60 text-[#173865] dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold transition-colors"
              >
                Hoy
              </button>

              <div className="flex items-center gap-1.5">
                {!required && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 text-[11px] font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

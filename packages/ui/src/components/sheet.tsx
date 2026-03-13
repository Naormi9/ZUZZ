'use client';

import * as React from 'react';
import { cn } from '../utils';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, setOpen: () => {} });

function Sheet({ children, open: controlledOpen, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = React.useContext(SheetContext);
  return <div onClick={() => setOpen(true)}>{children}</div>;
}

function SheetContent({ children, className, side = 'right' }: { children: React.ReactNode; className?: string; side?: 'left' | 'right' | 'bottom' }) {
  const { open, setOpen } = React.useContext(SheetContext);
  if (!open) return null;

  const sideClasses = {
    right: 'inset-y-0 end-0 w-full max-w-sm',
    left: 'inset-y-0 start-0 w-full max-w-sm',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className={cn('fixed bg-white shadow-xl p-6 overflow-y-auto', sideClasses[side], className)}>
        <button onClick={() => setOpen(false)} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };

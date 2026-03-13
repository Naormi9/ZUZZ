import * as React from 'react';
import { cn } from '../utils';

// Simple native select wrapper (can be replaced with Radix later)
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Select({ children, value, onValueChange }: SelectProps) {
  return (
    <div data-value={value} data-onchange={onValueChange ? 'true' : undefined}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { _value: value, _onValueChange: onValueChange });
        }
        return child;
      })}
    </div>
  );
}

function SelectTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { _value?: string }) {
  return (
    <div className={cn('flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-gray-50', className)} {...props}>
      {children}
    </div>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-500">{placeholder}</span>;
}

function SelectContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-white border rounded-lg shadow-lg mt-1 p-1', className)}>{children}</div>;
}

function SelectItem({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  return (
    <div className={cn('px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer', className)} data-value={value}>
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

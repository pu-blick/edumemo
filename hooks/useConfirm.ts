import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ConfirmState {
  visible: boolean;
  message: string;
}

interface ConfirmContextValue {
  confirmState: ConfirmState;
  confirm: (message: string) => Promise<boolean>;
  resolve: (value: boolean) => void;
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirmState(): ConfirmContextValue {
  const [confirmState, setConfirmState] = useState<ConfirmState>({ visible: false, message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string): Promise<boolean> => {
    setConfirmState({ visible: true, message });
    return new Promise<boolean>((res) => { resolverRef.current = res; });
  }, []);

  const resolve = useCallback((value: boolean) => {
    setConfirmState({ visible: false, message: '' });
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  return { confirmState, confirm, resolve };
}

export function useConfirm(): (message: string) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

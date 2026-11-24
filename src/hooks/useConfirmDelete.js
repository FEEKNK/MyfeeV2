import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Two-step destructive delete confirmation with automatic timer cleanup on unmount or re-trigger.
 */
export function useConfirmDelete(onConfirm, timeoutMs = 3000) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const timerRef = useRef(null);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingTimer, [clearPendingTimer]);

  const requestDelete = useCallback((id) => {
    clearPendingTimer();
    if (confirmDeleteId === id) {
      onConfirm(id);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(id);
    timerRef.current = setTimeout(() => {
      setConfirmDeleteId(null);
      timerRef.current = null;
    }, timeoutMs);
  }, [confirmDeleteId, onConfirm, timeoutMs, clearPendingTimer]);

  return { confirmDeleteId, requestDelete };
}

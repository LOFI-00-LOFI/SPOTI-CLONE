import { createPortal } from 'react-dom';
import Toast from './Toast';
import { useToast } from '@/contexts/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="flex flex-col items-center justify-end h-full pb-20 space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ToastContainer; 
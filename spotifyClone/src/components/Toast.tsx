import { useEffect, useState } from 'react';
import { Check, X, Info, Heart } from 'lucide-react';
import { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Check className="h-4 w-4" />;
      case 'error':
        return <X className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-[#1db954] text-white';
      case 'error':
        return 'bg-red-600 text-white';
      default:
        return 'bg-[#2a2a2a] text-white';
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
        flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        ${getStyles()}
      `}
    >
      {getIcon()}
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default Toast; 
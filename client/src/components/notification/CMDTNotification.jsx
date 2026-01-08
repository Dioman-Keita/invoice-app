import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const CMDTNotification = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apparition animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-close
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(timer);
    };
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const styles = {
    success: {
      bg: 'border-l-4 border-green-400/60',
      icon: 'text-green-500',
      text: 'text-gray-700',
      close: 'hover:bg-green-50/50 text-gray-400 hover:text-green-500',
      glow: 'shadow-green-200/50'
    },
    error: {
      bg: 'border-l-4 border-red-400/60',
      icon: 'text-red-500',
      text: 'text-gray-700',
      close: 'hover:bg-red-50/50 text-gray-400 hover:text-red-500',
      glow: 'shadow-red-200/50'
    },
    warning: {
      bg: 'border-l-4 border-amber-400/60',
      icon: 'text-amber-500',
      text: 'text-gray-700',
      close: 'hover:bg-amber-50/50 text-gray-400 hover:text-amber-500',
      glow: 'shadow-amber-200/50'
    },
    info: {
      bg: 'border-l-4 border-blue-400/60',
      icon: 'text-blue-500',
      text: 'text-gray-700',
      close: 'hover:bg-blue-50/50 text-gray-400 hover:text-blue-500',
      glow: 'shadow-blue-200/50'
    }
  };

  const currentStyle = styles[notification.type];

  return (
    <div className={`
      fixed top-4 right-4 z-50
      w-96 max-w-sm transition-all duration-700 ease-out
      ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
      ${isVisible ? 'animate-in slide-in-from-right-full fade-in duration-700' : 'opacity-0 translate-x-full scale-95'}
    `}>
      <div className={`
        ${currentStyle.bg}
        rounded-xl p-4
        flex items-start space-x-3
        backdrop-blur-md
        border border-white/30
        hover:shadow-2xl transition-all duration-300
        bg-gradient-to-br from-white/80 via-white/70 to-white/60
        shadow-lg ${currentStyle.glow}
        relative overflow-hidden
        transform hover:scale-[1.02] transition-transform duration-200
        max-h-32
      `}>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full animate-pulse"></div>

        {/* Soft halo effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl blur-sm"></div>
        <div className={`flex-shrink-0 mt-0.5 ${currentStyle.icon} relative z-10`}>
          {icons[notification.type]}
        </div>
        <div className="flex-1 min-w-0 relative z-10 overflow-y-auto">
          <p className={`text-sm font-medium leading-relaxed ${currentStyle.text} break-words hyphens-auto`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 rounded-full p-1 transition-all duration-200 ${currentStyle.close} relative z-10`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CMDTNotification;
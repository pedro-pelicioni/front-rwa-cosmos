import { toast, ToastOptions, ToastPosition } from 'react-toastify';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info') => {
    const options: ToastOptions = {
      position: 'top-right' as ToastPosition,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      default:
        toast.info(message, options);
    }
  };

  return { showToast };
}; 
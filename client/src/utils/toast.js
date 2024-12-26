import { toast as hotToast } from 'react-hot-toast';

const toast = {
  success: (message) => {
    hotToast.success(message, {
      style: {
        background: '#4C1D95',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#4C1D95',
      },
    });
  },
  error: (message) => {
    hotToast.error(message, {
      style: {
        background: '#991B1B',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#991B1B',
      },
    });
  },
};

export default toast;

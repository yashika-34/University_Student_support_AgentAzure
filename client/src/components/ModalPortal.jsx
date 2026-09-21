import { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * ModalPortal — renders children directly into document.body
 * via React Portal, escaping any CSS stacking context (backdrop-filter,
 * transform, etc.) that would otherwise trap position:fixed children.
 */
const ModalPortal = ({ children, isOpen }) => {
  // Lock page scroll while open, preserve scroll position
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(children, document.body);
};

export default ModalPortal;

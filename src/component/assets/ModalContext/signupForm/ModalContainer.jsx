import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useModal } from "..";
import { motion, AnimatePresence } from "framer-motion";
import "./postSignupStyle.css";

const PostSignupFormModal = ({ children, contentClassName = "" }) => {
  const { showModal } = useModal();
  const location = useLocation();

  useEffect(() => {}, [location]);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="global-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`global-modal-content ${contentClassName}`.trim()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostSignupFormModal;

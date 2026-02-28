/** @format */

import React from "react";

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className=" flex items-center justify-center rounded-lg shadow-lg px-6 relative h-full bg-black/85">
        {children}
      </div>
    </div>
  );
};

export default Modal;

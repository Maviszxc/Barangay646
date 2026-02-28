import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm bg-white shadow-2xl w-full border rounded-2xl border-gray-300 p-10 text-center space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-8xl font-light text-gray-900">404</h1>
          <h2 className="text-xl font-medium text-gray-700">Page Not Found</h2>
          <p className="text-gray-500">
            The page you're looking for doesn't exist.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoBack}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium flex items-center justify-center gap-2 mx-auto hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;

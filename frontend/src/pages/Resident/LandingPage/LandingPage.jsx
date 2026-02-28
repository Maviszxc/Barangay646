/** @format */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLoginCard from "../../../components/UserLoginCard";
import Loader from "../../../components/Loader";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import policeAnimation from "../../../animations/police.json";
import fireAnimation from "../../../animations/fire.json";
import medicalAnimation from "../../../animations/medical.json";
import barangayAnimation from "../../../animations/barangay.json";
import brgylogo from "../../../assets/BrgyLogo.png";
import ThreeD from "../../../components/3D.jsx";
import { Link } from "react-router-dom";

// Import barangay officials images
import roelImage from "../../../assets/Roel.png";
import raquelImage from "../../../assets/Raquel.png";
import maElenaImage from "../../../assets/Ma.Elena.png";
import charitoImage from "../../../assets/Charito.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const userToken = localStorage.getItem("userToken");
 
  useEffect(() => {
    if (userToken) {
      navigate("/dashboard");
    } else {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const services = [
    {
      title: "Resident Registration",
      description:
        "Register as a barangay resident to access essential services and participate in community programs",
      icon: "👥",
      image:
        "https://www.theforage.com/blog/wp-content/uploads/2024/03/client-services-e1709741837781.jpg",
    },
    {
      title: "Document Requests",
      description:
        "Request barangay clearance, certificates, indigency certificates, and other official documents",
      icon: "📄",
      image:
        "https://www.filedoc.com/wp-content/uploads/2022/04/filledoc-19.jpg",
    },
    {
      title: "Complaint & Dispute Resolution",
      description:
        "Submit complaints or concerns and access our Lupong Tagapamayapa for mediation services",
      icon: "⚖️",
      image:
        "https://blog.ipleaders.in/wp-content/uploads/2016/08/before-you-file-a-complaint.jpg",
    },
    {
      title: "Community Programs",
      description:
        "Participate in health initiatives, livelihood programs, youth activities, and senior citizen services",
      icon: "🤝",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto">
      {/* Hero Section */}
      <section className="dotted-bg rounded-lg mx-4 my-12 lg:mx-8 lg:my-9 relative py-12 md:py-20 bg-white/80">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full max-w-7xl mx-auto">
            {/* Left side - Barangay System text */}
            <div className="z-20 px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
                <span className="block">Barangay 646,</span>
                <span className="block mt-2 text-gray-500">Zone 67</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-6">
                Barangay Management System
              </p>
              <p className="text-base md:text-lg text-gray-500 mb-8 max-w-2xl">
                Welcome to Barangay San Miguel, Manila. Our Barangay Management
                System provides a comprehensive solution for managing barangay
                operations, resident information, document processing, and
                community services. We are committed to serving our residents
                with transparency, efficiency, and dedication to community
                development.
              </p>
            </div>

            {/* Right side - Login form */}
            <div className="z-20 w-full max-w-md mx-auto px-4">
              <UserLoginCard />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white/80 backdrop-blur-sm mx-4 lg:mx-8 mb-12 relative py-16">
        <div className="container mx-auto px-4">
          {/* Centered Services Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover the range of services we offer to our barangay residents
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    className="w-full h-full object-cover rounded-t-lg"
                    src={service.image}
                    alt={service.title}
                  />
                </div>
                <div className="p-6">
                  <div className="text-3xl mb-3">{service.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barangay Officials Section */}
      <section className="rounded-lg mx-4 my-12 lg:mx-8 lg:my-9 backdrop-blur-sm mb-12 relative py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Barangay Officials
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Our dedicated officials work together to ensure the welfare and
              progress of our community in health, education, infrastructure,
              and public safety.
            </p>
          </div>

          <div className="grid mb-8 border border-gray-200 rounded-lg shadow-sm md:mb-12 md:grid-cols-2 bg-white">
            <figure className="flex flex-col items-center justify-center p-8 text-center bg-white border-b border-gray-200 rounded-t-lg md:rounded-t-none md:rounded-ss-lg md:border-e">
              <blockquote className="max-w-2xl mx-auto mb-4 text-gray-500 lg:mb-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Committed to Public Service
                </h3>
                <p className="my-4">
                  "As your Barangay Captain, I pledge to lead with transparency
                  and dedication to improve our community."
                </p>
              </blockquote>
              <figcaption className="flex items-center justify-center">
                <img
                  className="rounded-full w-9 h-9"
                  src={roelImage}
                  alt="Barangay Captain"
                />
                <div className="space-y-0.5 font-medium text-left rtl:text-right ms-3">
                  <div>Roel S. Floro</div>
                  <div className="text-sm text-gray-500">Barangay Captain</div>
                </div>
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center justify-center p-8 text-center bg-white border-b border-gray-200 md:rounded-se-lg">
              <blockquote className="max-w-2xl mx-auto mb-4 text-gray-500 lg:mb-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Maintaining Official Records
                </h3>
                <p className="my-4">
                  "Ensuring accurate documentation and proper record-keeping of
                  all barangay proceedings and transactions for transparency and
                  accountability."
                </p>
              </blockquote>
              <figcaption className="flex items-center justify-center">
                <img
                  className="rounded-full w-9 h-9"
                  src={raquelImage}
                  alt="Barangay Secretary"
                />
                <div className="space-y-0.5 font-medium text-left rtl:text-right ms-3">
                  <div>Raquel F. Villanueva</div>
                  <div className="text-sm text-gray-500">
                    Barangay Secretary
                  </div>
                </div>
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center justify-center p-8 text-center bg-white border-b border-gray-200 md:rounded-es-lg md:border-b-0 md:border-e">
              <blockquote className="max-w-2xl mx-auto mb-4 text-gray-500 lg:mb-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Financial Management
                </h3>
                <p className="my-4">
                  "Ensuring proper allocation and management of barangay funds
                  to support community development projects."
                </p>
              </blockquote>
              <figcaption className="flex items-center justify-center">
                <img
                  className="rounded-full w-9 h-9"
                  src={maElenaImage}
                  alt="Barangay Treasurer"
                />
                <div className="space-y-0.5 font-medium text-left rtl:text-right ms-3">
                  <div>Ma. Elena A. Xavier</div>
                  <div className="text-sm text-gray-500">
                    Barangay Treasurer
                  </div>
                </div>
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center justify-center p-8 text-center bg-white border-gray-200 rounded-b-lg md:rounded-se-lg">
              <blockquote className="max-w-2xl mx-auto mb-4 text-gray-500 lg:mb-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Youth Development & Empowerment
                </h3>
                <p className="my-4">
                  "Creating opportunities for our youth to develop leadership
                  skills and become active community members is essential for
                  our future."
                </p>
              </blockquote>
              <figcaption className="flex items-center justify-center">
                <img
                  className="rounded-full w-9 h-9"
                  src={charitoImage}
                  alt="Kagawad"
                />
                <div className="space-y-0.5 font-medium text-left rtl:text-right ms-3">
                  <div>Charito T. Flores</div>
                  <div className="text-sm text-gray-500">SK Chairman</div>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Hotlines Section */}
      <section className="bg-white/80 backdrop-blur-sm mx-4 lg:mx-8 mb-12 relative py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Emergency Hotlines
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Important contact numbers for emergencies and assistance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Police */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="  border border-gray-200 shadow-sm rounded-xl p-6 text-center hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 mx-auto mb-4">
                <Lottie
                  animationData={policeAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Police Emergency
              </h3>
              <p className="text-gray-600 mb-2">Available 24/7</p>
              <a
                href="tel:911"
                className="text-red-600 font-semibold hover:underline block transition-colors cursor-pointer"
              >
                911 or (02) 8722-0650
              </a>
            </motion.div>

            {/* Fire Department */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="border border-gray-200 shadow-sm rounded-xl p-6 text-center hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 mx-auto mb-4">
                <Lottie
                  animationData={fireAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Fire Department
              </h3>
              <p className="text-gray-600 mb-2">Available 24/7</p>
              <a
                href="tel:911"
                className="text-orange-600 font-semibold hover:underline block transition-colors cursor-pointer"
              >
                911 or (02) 8426-0219
              </a>
            </motion.div>

            {/* Medical Emergency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="border border-gray-200 shadow-sm rounded-xl p-6 text-center hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 mx-auto mb-4">
                <Lottie
                  animationData={medicalAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Medical Emergency
              </h3>
              <p className="text-gray-600 mb-2">Available 24/7</p>
              <a
                href="tel:911"
                className="text-blue-600 font-semibold hover:underline block transition-colors cursor-pointer"
              >
                911 or (02) 8790-6300
              </a>
            </motion.div>

            {/* Barangay Hotline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="border border-gray-200 shadow-sm rounded-xl p-6 text-center hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 mx-auto mb-4">
                <Lottie
                  animationData={barangayAnimation}
                  loop={true}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Barangay Hotline
              </h3>
              <p className="text-gray-600 mb-2">Mon-Sun, 8AM-5PM</p>
              <a
                href="tel:+63285246000"
                className="text-green-600 font-semibold hover:underline block transition-colors cursor-pointer"
              >
                (02) 8524-6000
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <footer>
        <footer className="bg-white dark:bg-black">
          <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
            <div className="md:flex md:justify-between">
              <div className="mb-6 md:mb-0">
                <a href="#" className="flex items-center cursor-pointer">
                  <img
                    src={brgylogo}
                    className="h-8 me-3"
                    alt="Barangay 646 Logo"
                  />
                  <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                    Barangay 646
                  </span>
                </a>
              </div>
              <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                <div>
                  <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                    Address
                  </h2>
                  <ul className="text-gray-500 dark:text-gray-400 font-medium">
                    <li className="mb-4">
                      <a href="#" className="hover:underline cursor-pointer">
                        Zone 67, San Miguel
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline cursor-pointer">
                        Manila City, Philippines
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                    Follow us
                  </h2>
                  <ul className="text-gray-500 dark:text-gray-400 font-medium">
                    <li className="mb-4">
                      <a href="#" className="hover:underline cursor-pointer">
                        Facebook
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline cursor-pointer">
                        Twitter
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                    Legal
                  </h2>
                  <ul className="text-gray-500 dark:text-gray-400 font-medium">
                    <li className="mb-4">
                      <a href="#" className="hover:underline cursor-pointer">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline cursor-pointer">
                        Terms &amp; Conditions
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                © 2025{" "}
                <a href="#" className="hover:underline cursor-pointer">
                  Barangay 646, Zone 67, San Miguel, Manila
                </a>
                . All Rights Reserved.
              </span>
              <div className="flex mt-4 sm:justify-center sm:mt-0">
                <a
                  href="#"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 8 19"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Facebook page</span>
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 17"
                  >
                    <path
                      fillRule="evenodd"
                      d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Twitter page</span>
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 17"
                  >
                    <path
                      fillRule="evenodd"
                      d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Twitter page</span>
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 448 512"
                  >
                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                  </svg>
                  <span className="sr-only">Instagram page</span>
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 576 512"
                  >
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  <span className="sr-only">YouTube channel</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </footer>
    </div>
  );
};

export default Dashboard;

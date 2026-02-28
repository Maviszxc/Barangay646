import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaBullseye,
  FaLandmark,
  FaUserTie,
  FaHandsHelping,
} from "react-icons/fa";
import chairmanImg from "/src/assets/chairman.jpg";
import brgyHallImg from "/src/assets/646.jpg";
import axiosInstance from "../../../components/auth/axiosInstance";
import Loader from "../../../components/Loader";

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axiosInstance.get("/about");
        setAboutData(response.data.data);
      } catch (error) {
        console.error("Error fetching about data:", error);
        // Fallback data
        setAboutData({
          heroTitle: "About Our Barangay",
          heroDescription: "Learn about our community, leadership, and the principles that guide our service to residents",
          historyTitle: "Barangay History",
          historyContent: [
            "Barangay 646 Zone 67 is one of the 12 barangays situated in San Miguel of District VI, Manila, a neighborhood of Malacañang Palace.",
            "The name San Miguel was added by the Augustinian missionaries who selected Michael the Archangel as the patron saint of the area.",
            "Barangay 646 is one of the 896 barangays of the City of Manila within the administrative district of San Miguel, Zone 67, District VI.",
          ],
          vision: "To promote efficiency and transparency in government with regards to the manner of transacting with the public Citizens.",
          mission: "To ensure quality public service by local government to citizens.",
          officials: [
            { name: "Roel S. Floro", position: "Barangay Captain", imageUrl: "/src/assets/chairman.jpg" },
            { name: "Raquel F. Villanueva", position: "Barangay Secretary", imageUrl: "/src/assets/Raquel.png" },
            { name: "Ma. Elena A. Xavier", position: "Barangay Treasurer", imageUrl: "/src/assets/Ma.Elena.png" },
          ],
          kagawads: [
            { name: "Charito T. Flores", committee: "Health & Sanitation Committee", position: "Kagawad – 1", imageUrl: "/src/assets/Charito.png" },
            { name: "Raymundo M. Floro", committee: "Health & Sanitation Committee", position: "Kagawad – 2", imageUrl: "/src/assets/Raymundo.png" },
            { name: "Olimpio F. Vidallo Jr.", committee: "Education Committee", position: "Kagawad – 3", imageUrl: "/src/assets/Olimpio.png" },
            { name: "Kastine F. Villanueva", committee: "Social Services Committee", position: "Kagawad – 4", imageUrl: "/src/assets/Kastine.png" },
            { name: "Jessel P. Jarilla", committee: "Infrastructure Committee", position: "Kagawad – 5", imageUrl: "/src/assets/Jessel.png" },
            { name: "Conchita P. Barretto", committee: "Women & Family Welfare Committee", position: "Kagawad – 6", imageUrl: "/src/assets/Chonchita.png" },
            { name: "Tomas S. Tecson", committee: "Youth & Sports Development Committee", position: "Kagawad – 7", imageUrl: "/src/assets/Tomas.png" },
          ],
          coreValues: [
            { title: "Integrity", description: "We uphold honesty, accountability, and transparency in all our actions and decisions to maintain public trust.", icon: "shield" },
            { title: "Service", description: "We prioritize the welfare of our constituents through quality, efficient, and effective service delivery to improve quality of life.", icon: "users" },
            { title: "Progress", description: "We commit to continuous improvement, sustainable development, and creating a self-reliant community with empowered citizens.", icon: "trending-up" },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!aboutData) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Unable to load about page content.</p></div>;

  const getIconSvg = (iconName) => {
    switch (iconName) {
      case "shield":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
      case "users":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
      case "trending-up":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
      default:
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-7xl mx-auto gap-6">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">{aboutData.heroTitle}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{aboutData.heroDescription}</p>
        </div>

        <div className="rounded-xl p-8 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <FaLandmark className="mr-2 text-gray-800" />
                <span className="text-black">{aboutData.historyTitle}</span>
              </h2>
              {aboutData.historyContent.map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-4">{paragraph}</p>
              ))}
            </div>
            <div className="md:w-1/2">
              <img src={brgyHallImg} alt="Barangay Hall" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-500 rounded-xl p-8">
            <div className="flex items-center mb-4">
              <FaBullseye className="text-3xl mr-3 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-100">Our Vision</h2>
            </div>
            <p className="text-gray-300">{aboutData.vision}</p>
          </div>
          <div className="bg-gray-700 rounded-xl p-8">
            <div className="flex items-center mb-4">
              <FaHandsHelping className="text-3xl mr-3 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-100">Our Mission</h2>
            </div>
            <p className="text-gray-300">{aboutData.mission}</p>
          </div>
        </div>

        <div className="rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-black mb-8 flex items-center">
            <FaUserTie className="mr-2 text-black" />
            Barangay Officials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutData.officials.map((official, index) => (
              <div key={index} className="text-center">
                <img
                  src={official.imageUrl}
                  alt={official.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-700"
                  onError={(e) => { e.target.src = chairmanImg; }}
                />
                <h3 className="font-bold text-lg text-black">{official.name}</h3>
                <p className="text-gray-700">{official.position}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-8 flex items-center">
            <FaUsers className="mr-2 text-black" />
            Barangay Kagawads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutData.kagawads.map((kagawad, index) => (
              <div key={index} className="text-center">
                <img
                  src={kagawad.imageUrl}
                  alt={kagawad.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-700"
                  onError={(e) => { e.target.src = chairmanImg; }}
                />
                <p className="text-black text-lg font-bold">{kagawad.name}</p>
                <p className="text-gray-600 text-sm">{kagawad.position}</p>
                <p className="text-gray-500 text-xs">{kagawad.committee}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutData.coreValues.map((value, index) => (
              <div key={index} className="border bg-white border-gray-300 shadow-sm p-6 rounded-lg text-center">
                <div className="bg-gray-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getIconSvg(value.icon)}
                </div>
                <h3 className="font-bold text-lg text-black mb-2">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

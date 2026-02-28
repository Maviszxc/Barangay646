/** @format */

import React from "react";
import { Star } from "lucide-react";

const formatDateTime = (isoDateStr) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const date = new Date(isoDateStr);
  return date.toLocaleString("en-US", options);
};

function truncateLetters(text, maxLetters) {
  if (text.length > maxLetters) {
    return text.slice(0, maxLetters) + '...';
  }
  return text;
}

const AnnouncementList = ({ announcements }) => (
  <div className="bg-white bg-opacity-70 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
    <h3 className="text-gray-500 text-sm mb-4 flex items-center gap-2">
      <Star className="w-4 h-4" /> Announcements
    </h3>
    <div className="space-y-3">
      {announcements
        .filter((a) => !a.isOld) // ✅ Only include announcements that are not old
        .map((a, i) => (
          <div key={i} className="border-b pb-2 last:border-b-0 last:pb-0">
            <div className="font-semibold">{a.title}</div>
            <div className="text-xs text-gray-500">
              {formatDateTime(a.createdAt)}
            </div>
            <div className="text-sm text-gray-700">
              {truncateLetters(a.description,20)}
            </div>
          </div>
        ))}
    </div>
  </div>
);

export default AnnouncementList;

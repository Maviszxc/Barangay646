import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const ResidentsTable = ({ residents, onRowClick, handletoggle, onEdit, onDelete }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Image
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Address
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Contact
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {Array.isArray(residents) && residents.length > 0 ? (
        residents.map((resident) => (
          <tr
            key={resident.id}
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => onRowClick && onRowClick(resident)}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={resident.image}
                alt={resident.name}
              />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">
                {resident.name}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">{resident.address} {resident.houseNumber}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">{resident.contact}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  resident.accountStatus === "Active"
                    ? "bg-green-100 text-green-800"
                    : resident.accountStatus === "Deceased"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {resident.accountStatus}
              </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handletoggle(resident.id, resident.accountStatus);
                  }}
                  className={`px-3 py-1 rounded text-xs ${
                    resident.accountStatus === "Active"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : resident.accountStatus === "Deceased"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {resident.accountStatus === "Active"
                    ? "Mark as deceased"
                    : resident.accountStatus === "Deceased"
                    ? "Mark as active"
                    : "Mark as active"}
                </button>
                
                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(resident);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                  title="Edit Resident"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(resident);
                  }}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                  title="Delete Resident"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-500">
            No residents found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default ResidentsTable;
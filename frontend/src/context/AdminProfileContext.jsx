/** @format */
import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../components/auth/axiosInstance';
import { toast } from 'react-toastify';

const AdminProfileContext = createContext();

export const useAdminProfile = () => useContext(AdminProfileContext);

export const AdminProfileProvider = ({ children }) => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/profile');
      setAdminProfile(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Failed to load profile data');
      // Don't show toast on initial load to avoid annoying the user
      if (adminProfile !== null) {
        toast.error('Failed to refresh profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAdminProfile = async (updatedData) => {
    try {
      const response = await axiosInstance.put('/admin/profile', updatedData);
      setAdminProfile(response.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating admin profile:', err);
      toast.error('Failed to update profile');
      return false;
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'AU';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join(' ')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    // Only fetch if we have a token
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetchAdminProfile();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AdminProfileContext.Provider
      value={{
        adminProfile,
        loading,
        error,
        fetchAdminProfile,
        updateAdminProfile,
        getUserInitials
      }}
    >
      {children}
    </AdminProfileContext.Provider>
  );
};
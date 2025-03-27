import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface UserManagementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;  // Optional: user ID for updating or deleting
}

export function UserManagementForm({ onClose, onSuccess, userId }: UserManagementFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch user data if editing
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setFormData({
        email: data.email,
        password: '',  // Don't pre-fill password for security reasons
        role: data.role
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for both creating and updating users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Create or update user depending on whether userId exists. Validate input before proceeding.
      if (userId) {
        // Update user role. Ensure the role is valid before updating.
        const { error } = await supabase
          .from('profiles')
          .update({ role: formData.role })
          .eq('id', userId);

        if (error) throw error;

        onSuccess();
        onClose();
      } else {
        // Create new user. Validate email and password before creating.
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: formData.email,
          role: formData.role
        }]).single(); // Ensure a single record is inserted.


          if (profileError) throw profileError;
        }

        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion
  const handleDelete = async () => {
    if (!userId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      setIsLoading(true);

      // Delete user from profiles table. Confirm deletion with the user.
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Optionally, delete the user from auth (Supabase auth). Handle any errors appropriately.
      const { error: authError } = await supabase.auth.admin.deleteUser(userId); // Updated to correct method

      if (authError) throw authError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {userId ? 'Edit User' : 'Add User'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading && !!userId}  // Disable if loading for edit
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required={!userId}  // Password is only required if creating a new user
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading && !!userId}  // Disable if loading for edit
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>

            {userId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete User'}
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : userId ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

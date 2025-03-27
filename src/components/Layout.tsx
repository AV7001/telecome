import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Menu, MapPin, Image, Home } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import NotificationService from '../services/notificationService';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    const updateFcmToken = async () => {
      if (user?.role === 'admin') {
        console.log(user);
        
        const token = await NotificationService.requestPermission();
        
        if (token) {
          const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: token })
            .eq('id', user.id);
          
          if (error) {
            console.error('Error updating FCM token:', error.message);
          }
        }
      }
    };
  
    updateFcmToken();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: user?.role === 'admin' ? '/admin' : '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Site Map',
      path: '/site-map',
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      name: 'Site Images',
      path: '/site-images',
      icon: <Image className="h-5 w-5" />,
    }
    // Remove the All Sites nav item
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">
                  Fiber Network Manager
                </span>
              </div>

              {/* Desktop navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User menu (desktop) */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {user?.role === 'admin' && <NotificationBell />}
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user?.email}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {user?.role === 'admin' && (
                <div className="px-4 py-2">
                  <NotificationBell />
                </div>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4 py-2">
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
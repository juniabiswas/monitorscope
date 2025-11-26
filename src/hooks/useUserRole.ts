import { useState, useEffect } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Get user role from API (cookie is httpOnly, so we can't read it client-side)
        const response = await fetch('/api/profile');
        if (response.ok) {
          const user = await response.json();
          const trimmedRole = user.role?.trim();
          console.log('✅ Fetched user from API:', { ...user, role: trimmedRole });
          console.log('🔍 Can access email settings?', ['SuperAdmin', 'Admin'].includes(trimmedRole));
          setUserRole(trimmedRole);
        } else {
          console.error('❌ Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { userRole, loading };
}

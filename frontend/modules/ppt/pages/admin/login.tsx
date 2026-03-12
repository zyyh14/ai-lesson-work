import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login?as=admin&redirect=/admin', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminLogin;

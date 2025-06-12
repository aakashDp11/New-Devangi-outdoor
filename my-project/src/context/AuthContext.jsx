// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [auth, setAuth] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedToken = localStorage.getItem('accessToken');
//     if (storedToken) {
//       setAuth({ token: storedToken });
//     }
//   }, []);

//   const logout = () => {
//     localStorage.removeItem('accessToken');
//     navigate('/login');
//   };

//   return (
//     <AuthContext.Provider value={{ auth, setAuth, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

  import React, { createContext, useState, useEffect, useContext } from 'react';
  import { useNavigate } from 'react-router-dom';

  const AuthContext = createContext();

  export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true); // Track loading state
    const navigate = useNavigate();

    useEffect(() => {
      const storedToken = localStorage.getItem('accessToken');
      const storedName = localStorage.getItem('userName');
      if (storedToken && storedName) {
        // If token exists, we can verify it or just set the user
        console.log("stored name in auth context is",storedName);
        setAuth({ token: storedToken,userName: storedName });
      } else {
        setAuth(null); // User is not authenticated
      }

      setLoading(false); // Done loading
    }, []);
useEffect(() => {
  console.log('Auth state:', auth);
}, [auth]);  // This will run whenever `auth` state changes

    const logout = () => {
      console.log("Logout triggered"); 
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      setAuth(null);
      navigate('/login');
      window.location.href = '/login';
       window.location.reload();
    };

    if (loading) return <div>Loading...</div>; // Show loading screen until auth state is ready

    return (
      <AuthContext.Provider value={{ auth, setAuth, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => useContext(AuthContext);

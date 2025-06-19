// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import logo1 from '../assets/d3.png'
// function Login() {
//     const navigate=useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('${import.meta.env.VITE_API_BASE_URL}/api/auth/login', { email, password });
//       toast.success('Login successful!');
//       navigate('/home');
//     } catch (error) {
//         toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
//     }
//   };

//   return (
//     <div className='w-full ml-[65%] mt-[10%]'>
//         <img className='w-[30%] ml-[5%] mb-[5%]' src={logo1}/>
//       <h2 className="text-xl font-bold ml-[15%] mb-4">Log in</h2>
//       <form onSubmit={handleRegister} className="flex mt-[5%] w-[40%] flex-col gap-2">
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border p-2 rounded"
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border p-2 rounded"
//           required
//         />
//         <button type="submit" className="bg-orange-500 mt-[3%] text-white p-2 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 rounded">Sign in</button>
//       </form>
//     </div>
//   );
// }




// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import logo1 from '../assets/d3.png';

// function Login() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleRegister = async (e) => {
//     e.preventDefault(); // Prevent page reload on form submit

//     try {
//       const response = await axios.post('${import.meta.env.VITE_API_BASE_URL}/api/auth/login', { email, password });

//       // Store token if necessary
//       const { accessToken, user } = response.data;
//       console.log("User data is", user);
//       localStorage.setItem('accessToken', accessToken);
//       localStorage.setItem('userName', user.name);
//       localStorage.setItem('userEmail', user.email);
//       localStorage.setItem('userRole', user.role);
//       toast.success('Login successful!');

//       // Navigate to home after successful login
//       navigate('/home');  // Use navigate to route to the home page

//     } catch (error) {
//       toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
//     }
//   };

//   return (
//     <div className="w-full ml-[65%] mt-[10%]">
//       <img className="w-[30%] ml-[5%] mb-[5%]" src={logo1} />
//       <h2 className="text-xl font-bold ml-[15%] mb-4">Log in</h2>

//       <form onSubmit={handleRegister} className="flex mt-[5%] w-[40%] flex-col gap-2">
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border p-2 rounded"
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border p-2 rounded"
//           required
//         />
//         <button 
//           type="submit" 
//           className="bg-orange-500 mt-[3%] text-white p-2 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 rounded">
//           Sign in
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Login;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png';
import { useAuth } from '../context/AuthContext';
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
const {auth,setAuth}=useAuth();
  const handleRegister = async (e) => {
    e.preventDefault(); 

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { email, password });

      // Store token if necessary
      const { accessToken, user } = response.data;
      console.log("User data is", user);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userId', user.id);
      toast.success('Login successful!');
 setAuth({ token: accessToken, userName: user.name, role: user.role });
      // Redirect immediately after setting the state and localStorage
      navigate('/home');  // Navigate to /home after successful login

    } catch (error) {
      toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="w-full ml-[65%] mt-[10%]">
      <img className="w-[30%] ml-[5%] mb-[5%]" src={logo1} />
      <h2 className="text-xl font-bold ml-[15%] mb-4">Log in</h2>

      <form onSubmit={handleRegister} className="flex mt-[5%] w-[40%] flex-col gap-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button 
          type="submit" 
          className="bg-orange-500 mt-[3%] text-white p-2 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 rounded">
          Sign in
        </button>
      </form>
    </div>
  );
}

export default Login;

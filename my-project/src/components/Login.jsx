import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png'
function Login() {
    const navigate=useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      toast.success('Login successful!');
      navigate('/home');
    } catch (error) {
        toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className='w-[850px] ml-[65%]'>
        <img className='w-[30%] ml-[5%] mb-[5%]' src={logo1}/>
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
        <button type="submit" className="bg-orange-500 mt-[3%] text-white p-2 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 rounded">Sign in</button>
      </form>
    </div>
  );
}

export default Login;

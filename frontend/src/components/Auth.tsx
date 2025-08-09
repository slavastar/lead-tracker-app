import { useState } from 'react';
import { supabase } from '../supabaseClient';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border p-2 w-full mb-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="border p-2 w-full mb-2" />
      <button onClick={signIn} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Sign In</button>
      <button onClick={signUp} className="bg-green-500 text-white px-4 py-2 rounded">Sign Up</button>
    </div>
  );
};
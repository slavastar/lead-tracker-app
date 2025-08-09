// src/App.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LeadsPage } from './components/LeadsPage';
import { Auth } from './components/Auth';
import { GenerateEmailPage } from './components/GenerateEmailPage';
import { DashboardPage } from "./components/DashboardPage";
import { supabase } from './supabaseClient';


export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>
      {!user ? (
        <Route path="*" element={<Auth />} />
      ) : (
        <>
          <Route path="/" element={<LeadsPage user={user} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/generate-email/:leadId" element={<GenerateEmailPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
};

export default App;
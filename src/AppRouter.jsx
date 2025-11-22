import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import BusinessLogin from './pages/BusinessLogin';
import UserLogin from './pages/UserLogin';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="login">
          <Route path="business" element={<BusinessLogin />} />
          <Route path="user" element={<UserLogin />} />
        </Route>
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Places from '../pages/Places';
import UserLogin from '../pages/UserLogin';
import BusinessLogin from '../pages/BusinessLogin';
import About from '../pages/About';
import Contact from '../pages/Contact';
import NotFound from '../pages/NotFound';

export default function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'places', element: <Places /> },
        { path: 'login/user', element: <UserLogin /> },
        { path: 'login/business', element: <BusinessLogin /> },
        { path: 'about', element: <About /> },
        { path: 'contact', element: <Contact /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]);
}

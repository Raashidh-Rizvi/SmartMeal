<<<<<<< HEAD
/**
 * Router Configuration
 * Handles routing between different pages
 */

function AppRouter() {
  const { BrowserRouter, Routes, Route } = ReactRouterDOM;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={React.createElement(ShoppingPage)} />
        <Route path="/add-item" element={React.createElement(AddItemPage)} />
        <Route path="/edit-item/:itemId" element={React.createElement(EditItemPage)} />
=======
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShoppingPage from './pages/Shopping_List_Management/ShoppingPage';
import AddItemPage from './pages/Shopping_List_Management/AddItemPage.jsx';
import EditItemPage from './pages/Shopping_List_Management/EditItemPage.jsx';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShoppingPage />} />
        <Route path="/add-item" element={<AddItemPage />} />
        <Route path="/edit-item/:itemId" element={<EditItemPage />} />
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      </Routes>
    </BrowserRouter>
  );
}
<<<<<<< HEAD
=======

export default AppRouter;
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

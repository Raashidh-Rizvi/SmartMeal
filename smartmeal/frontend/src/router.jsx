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
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

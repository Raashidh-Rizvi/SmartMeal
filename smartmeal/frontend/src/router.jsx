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
      </Routes>
    </BrowserRouter>
  );
}

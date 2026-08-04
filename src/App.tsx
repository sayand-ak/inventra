import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProtectedRoute from "./routes/ProtectedRoutes";
import Brands from "./pages/Brands";
import Categories from "./pages/Category";
import Catalogues from "./pages/Catalogue";
import GenerateCatalogue from "./components/GenerateCatalogue";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Protected Products */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brands"
          element={
            <ProtectedRoute>
              <Brands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalogues"
          element={
            <ProtectedRoute>
              <Catalogues />
            </ProtectedRoute>
          }
        />

        <Route path="/catalogues/:id/generate" element={<GenerateCatalogue />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
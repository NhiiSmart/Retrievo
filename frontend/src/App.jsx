import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Dashboard } from './pages/Dashboard';
import { PostItem } from './pages/PostItem';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow container-custom py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/item/:id" element={<ItemDetailPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/post-item" element={
                <ProtectedRoute>
                  <PostItem />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

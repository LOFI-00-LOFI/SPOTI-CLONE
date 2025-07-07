
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LikedSongsProvider } from "@/contexts/LikedSongsContext";
import { PlaylistProvider } from "@/contexts/PlaylistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <LikedSongsProvider>
          <PlaylistProvider>
            <MusicPlayerProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<LoginPage />} />
                </Routes>
              </BrowserRouter>
            </MusicPlayerProvider>
          </PlaylistProvider>
        </LikedSongsProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LikedSongsProvider } from "@/contexts/LikedSongsContext";
import { PlaylistProvider } from "@/contexts/PlaylistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthPromptProvider } from "@/contexts/AuthPromptContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import Index from "./pages/Index";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import LandingPage from "./components/LandingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <LikedSongsProvider>
          <PlaylistProvider>
            <BrowserRouter>
              <AuthPromptProvider>
                <MusicPlayerProvider>
                  <NavigationProvider>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/landing" element={<LandingPage />} />
                      <Route path="/app" element={<Index />} />
                      <Route path="/" element={<Index />} />
                      <Route path="*" element={<Index />} />
                    </Routes>
                  </NavigationProvider>
                </MusicPlayerProvider>
              </AuthPromptProvider>
            </BrowserRouter>
          </PlaylistProvider>
        </LikedSongsProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

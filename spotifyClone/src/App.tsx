
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LikedSongsProvider } from "@/contexts/LikedSongsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadMusic from "./components/UploadMusic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <LikedSongsProvider>
        <MusicPlayerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadMusic onClose={() => {}} onUploadSuccess={() => {}} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </MusicPlayerProvider>
      </LikedSongsProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;

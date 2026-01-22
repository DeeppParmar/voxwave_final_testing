import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./contexts/PlayerContext";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Search from "./pages/Search";
import Rooms from "./pages/Rooms";
import Login from "./pages/Login";
import Queue from "./pages/Queue";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PlayerProvider>
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Layout>
                      <Home />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/library"
                element={
                  <RequireAuth>
                    <Layout>
                      <Library />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/search"
                element={
                  <RequireAuth>
                    <Layout>
                      <Search />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/rooms"
                element={
                  <RequireAuth>
                    <Layout>
                      <Rooms />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/queue"
                element={
                  <RequireAuth>
                    <Layout>
                      <Queue />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

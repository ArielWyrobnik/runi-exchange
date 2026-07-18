import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TICKETS_ENABLED } from "@/lib/constants";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Browse from "./pages/Browse";
import Tickets from "./pages/Tickets";
import TicketEvent from "./pages/TicketEvent";
import ListingDetail from "./pages/ListingDetail";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Watchlist from "./pages/Watchlist";
import SellerProfile from "./pages/SellerProfile";
import AdminReports from "./pages/AdminReports";
import AdminEvents from "./pages/AdminEvents";
import Sell from "./pages/Sell";
import Messages from "./pages/Messages";

const queryClient = new QueryClient();

// Vite injects BASE_URL from `base` in vite.config (now "/" everywhere).
// React Router wants the basename without a trailing slash (but never empty).
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            {TICKETS_ENABLED && <Route path="/tickets" element={<Tickets />} />}
            {TICKETS_ENABLED && <Route path="/tickets/:id" element={<TicketEvent />} />}
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/listing/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            {TICKETS_ENABLED && <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />}
            <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

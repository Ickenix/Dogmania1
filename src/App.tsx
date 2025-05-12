import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import AppPreviewSection from './components/AppPreviewSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/dashboard/DashboardLayout';
import CourseView from './components/courses/CourseView';
import Quiz from './components/courses/Quiz';
import CommunityPage from './components/community/CommunityPage';
import GroupPage from './components/community/GroupPage';
import ForumPage from './components/community/ForumPage';
import ForumPostDetail from './components/community/ForumPostDetail';
import GroupDetail from './components/community/GroupDetail';
import GroupsPage from './components/community/GroupsPage';
import AdminDashboard from './components/admin/AdminDashboard';
import TrainerDashboard from './components/trainer/TrainerDashboard';
import Privacy from './components/legal/Privacy';
import Terms from './components/legal/Terms';
import Imprint from './components/legal/Imprint';
import Contact from './components/legal/Contact';
import MarketplacePage from './components/marketplace/MarketplacePage';
import ListingDetails from './components/marketplace/ListingDetails';
import CreateListingModal from './components/marketplace/CreateListingModal';
import MessagesPage from './components/messages/MessagesPage';
import OnboardingWrapper from './components/onboarding/OnboardingWrapper';
import LoadingSpinner from './components/LoadingSpinner';
import PageTransition from './components/PageTransition';
import DogChatbot from './components/chat/DogChatbot';
import CertificatesPage from './components/certificates/CertificatesPage';
import PricingPlans from './components/payment/PricingPlans';
import CheckoutPage from './components/payment/CheckoutPage';
import PaymentSettings from './components/payment/PaymentSettings';
import PaymentSuccess from './components/payment/PaymentSuccess';
import BookTrainerPage from './components/trainer/BookTrainerPage';
import SupportPage from './components/support/SupportPage';
import MobileNavigation from './components/MobileNavigation';
import AiCoachPage from './components/ai-coach/AiCoachPage';
import MediaPage from './components/media/MediaPage';
import DogProfile from './components/dashboard/DogProfile';
import DogDiaryPage from './components/dog-diary/DogDiaryPage';
import TrainingPlan from './components/training/TrainingPlan';
import DogHealth from './components/dashboard/DogHealth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
        <LoadingSpinner size="large" text="Wird geladen..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <OnboardingWrapper>{children}</OnboardingWrapper>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
        <LoadingSpinner size="large" text="Wird geladen..." />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const isPublicRoute = ['/', '/login', '/register', '/pricing'].includes(location.pathname);
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PublicRoute>
            <PageTransition>
              <main>
                <HeroSection />
                <BenefitsSection />
                <AppPreviewSection />
                <StatsSection />
                <Footer />
              </main>
            </PageTransition>
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <PageTransition>
              <Login />
            </PageTransition>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <PageTransition>
              <Register />
            </PageTransition>
          </PublicRoute>
        } />
        
        {/* Dashboard Routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dog" element={<DogProfile />} />
          <Route path="dog/diary" element={<DogDiaryPage />} />
          <Route path="dog/training" element={<TrainingPlan />} />
          <Route path="dog/health" element={<DogHealth />} />
          <Route path="map" element={<div>Community Map</div>} />
          <Route path="courses/*" element={<div>Courses Content</div>} />
          <Route path="trainers/*" element={<div>Trainers Content</div>} />
          <Route path="marketplace/*" element={<div>Marketplace Content</div>} />
          <Route path="settings/*" element={<div>Settings Content</div>} />
        </Route>
        
        {/* Other Protected Routes */}
        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <PageTransition>
              <CourseView />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/quiz" element={
          <ProtectedRoute>
            <PageTransition>
              <Quiz />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/community" element={
          <ProtectedRoute>
            <PageTransition>
              <CommunityPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/community/groups/:groupId" element={
          <ProtectedRoute>
            <PageTransition>
              <GroupPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/forum" element={
          <ProtectedRoute>
            <PageTransition>
              <ForumPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/forum/:postId" element={
          <ProtectedRoute>
            <PageTransition>
              <ForumPostDetail />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute>
            <PageTransition>
              <GroupsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/groups/:groupId" element={
          <ProtectedRoute>
            <PageTransition>
              <GroupDetail />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <PageTransition>
              <AdminDashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/trainer" element={
          <ProtectedRoute>
            <PageTransition>
              <TrainerDashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/marketplace" element={
          <PageTransition>
            <MarketplacePage />
          </PageTransition>
        } />
        <Route path="/marketplace/create" element={
          <ProtectedRoute>
            <PageTransition>
              <CreateListingModal />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/marketplace/:id" element={
          <PageTransition>
            <ListingDetails />
          </PageTransition>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <PageTransition>
              <MessagesPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/certificates" element={
          <ProtectedRoute>
            <PageTransition>
              <CertificatesPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={
          <PageTransition>
            <PricingPlans />
          </PageTransition>
        } />
        <Route path="/checkout/:productId" element={
          <ProtectedRoute>
            <PageTransition>
              <CheckoutPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/payment-settings" element={
          <ProtectedRoute>
            <PageTransition>
              <PaymentSettings />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/book-trainer" element={
          <ProtectedRoute>
            <PageTransition>
              <BookTrainerPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/support" element={
          <PageTransition>
            <SupportPage />
          </PageTransition>
        } />
        <Route path="/privacy" element={
          <PageTransition>
            <Privacy />
          </PageTransition>
        } />
        <Route path="/terms" element={
          <PageTransition>
            <Terms />
          </PageTransition>
        } />
        <Route path="/imprint" element={
          <PageTransition>
            <Imprint />
          </PageTransition>
        } />
        <Route path="/contact" element={
          <PageTransition>
            <Contact />
          </PageTransition>
        } />
        <Route path="/ai-coach" element={
          <ProtectedRoute>
            <PageTransition>
              <AiCoachPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/media" element={
          <ProtectedRoute>
            <PageTransition>
              <MediaPage />
            </PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 text-white">
          <div className="pb-20 md:pb-0"> {/* Add padding bottom for mobile navigation */}
            <AnimatedRoutes />
          </div>
          <DogChatbot />
          <PaymentSuccess />
          <MobileNavigation /> {/* Add mobile navigation component */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
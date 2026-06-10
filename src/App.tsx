import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import akshayPhoto from "../assets/akshay.jpeg"
import { 
  Instagram, 
  MessageSquare, 
  Mail, 
  MapPin, 
  CalendarDays, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Heart, 
  Sparkle, 
  User, 
  Check, 
  CheckCircle2, 
  ArrowUpRight,
  Menu,
  X,
  Shield,
  LogOut
} from 'lucide-react';

import Logo from './components/Logo';
import BookingModal from './components/BookingModal';
import MyBookings from './components/MyBookings';
import AdminPortal from './components/AdminPortal';
import AkshayPhoto from './components/AkshayPhoto';
import { SOLO_PACKS, SessionPack, Booking, InstructorProfile } from './types';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function App() {
  // Active navigation tab highlight
  const [activeTab, setActiveTab] = useState<'trial' | 'packs' | 'about' | 'contact'>('trial');

  const scrollToSection = (id: string, tabName: 'trial' | 'packs' | 'about' | 'contact') => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
    
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const offsetPosition = element.offsetTop - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'hero-section', name: 'trial' },
        { id: 'trial-section', name: 'trial' },
        { id: 'session-packs-section', name: 'packs' },
        { id: 'about-section', name: 'about' },
        { id: 'contact-section', name: 'contact' },
      ];
      
      const scrollPosition = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(section.name as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Contact page form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'trial',
    message: ''
  });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  // Booking panel management
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPackForBooking, setSelectedPackForBooking] = useState<SessionPack | null>(null);

  // Instructor profile management
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile>({
    name: 'Akshay Chotara',
    role: 'LEAD INSTRUCTOR · BLEES YOGA',
    photoUrl: '',
    bio1: 'Akshay brings a calm, grounded approach to every session — meeting each student exactly where they are, and guiding them toward where they want to be.',
    bio2: 'At Blees Yoga, sessions are never one-size-fits-all. Every class is crafted around your unique body, goals, and pace of growth — so you always feel seen and supported.',
    bio3: 'Combining precise biological alignment markers with ancient deep pranayama breath synchronization, my program establishes a stable foundation that serves you both on the mat and in your daily active pursuits.',
    usePhotoUrlAsDefault: false
  });

  // Load and sync instructor profile
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'instructor'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setInstructorProfile({
          name: data.name || 'Akshay Chotara',
          role: data.role || 'LEAD INSTRUCTOR · BLEES YOGA',
          photoUrl: data.photoUrl || '',
          bio1: data.bio1 || 'Akshay brings a calm, grounded approach to every session — meeting each student exactly where they are, and guiding them toward where they want to be.',
          bio2: data.bio2 || 'At Blees Yoga, sessions are never one-size-fits-all. Every class is crafted around your unique body, goals, and pace of growth — so you always feel seen and supported.',
          bio3: data.bio3 || 'Combining precise biological alignment markers with ancient deep pranayama breath synchronization, my program establishes a stable foundation that serves you both on the mat and in your daily active pursuits.',
          usePhotoUrlAsDefault: data.usePhotoUrlAsDefault !== undefined ? data.usePhotoUrlAsDefault : (data.photoUrl ? true : false)
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/instructor');
    });

    return () => unsub();
  }, []);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);

  // Scroll to top of the page (home page) when a user signs in or signs up successfully
  const prevUserUidRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUid = currentUser?.uid || null;
    if (currentUid && prevUserUidRef.current === null) {
      setActiveTab('trial');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevUserUidRef.current = currentUid;
  }, [currentUser]);

  // Bookings list states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Interactive Mobile Navigation Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Success toast state for adding booking
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Authentication listener and Firestore sync
  useEffect(() => {
    let unsubscribeBookings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (unsubscribeBookings) {
        unsubscribeBookings();
        unsubscribeBookings = null;
      }

      if (user) {
        // Subscribe to user reservations dynamically (or query all if administrator)
        const bookingsQuery = user.email === 'akshayyoga1@gmail.com'
          ? query(collection(db, 'bookings'))
          : query(
              collection(db, 'bookings'),
              where('userId', '==', user.uid)
            );
        unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const list: Booking[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              ...data,
              // Convert firestore timestamp safely if available
              createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : data.createdAt
            } as Booking);
          });
          // Sort by date-time newest first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(list);
        }, (err) => {
          // If the user's snapshot subscription fails with permission denied after they log out/session change, ignore gracefully
          if (err.code === 'permission-denied') {
            console.warn("Bookings snapshot subscription permission denied, likely due to logout/transition.");
          } else {
            handleFirestoreError(err, OperationType.LIST, 'bookings');
          }
        });
      } else {
        setBookings([]);
        try {
          localStorage.removeItem('last_used_email');
        } catch (e) {
          console.warn('Failed to clear localStorage', e);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeBookings) {
        unsubscribeBookings();
      }
    };
  }, []);

  const handleBookingSuccess = (newBooking: Booking) => {
    setIsBookingOpen(false);
    setToastMessage(`SUCCESS: Registered appointment for ${newBooking.packageName}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      setToastMessage('Your appointment registration has been canceled.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const openBookingForPack = (pack: SessionPack) => {
    setSelectedPackForBooking(pack);
    setIsBookingOpen(true);
  };

  // Launch trial session helper
  const handleBookTrialSession = () => {
    const trialPack: SessionPack = {
      id: 'solo-trial-v1',
      sessions: 1,
      price: 0,
      sessionPrice: 0,
      description: 'One focused core trial session. Perfect for introduction.',
    };
    openBookingForPack(trialPack);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSubmitted(true);
    setToastMessage(`Namaste! Your message was sent successfully. Akshay will reach out soon!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="relative min-h-screen selection:bg-gold-light selection:text-charcoal flex flex-col">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-cream border border-gold/20 shadow-xl px-5 py-3 rounded-full flex items-center space-x-2 text-xs font-medium tracking-wide"
          >
            <CheckCircle2 size={15} className="text-gold animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo area */}
            <button
              onClick={() => scrollToSection('hero-section', 'trial')}
              className="flex items-center space-x-3 group text-left cursor-pointer"
            >
              <Logo size={42} showCircleBg={true} className="transition-transform group-hover:rotate-6 duration-300" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-wider text-charcoal">Blees Yoga</span>
                <span className="text-[9px] font-sans text-gold font-bold tracking-widest uppercase">Akshay Chotara</span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-8 text-xs font-sans tracking-widest uppercase font-semibold text-charcoal-light">
              <button
                onClick={() => scrollToSection('trial-section', 'trial')}
                className={`transition-colors duration-200 cursor-pointer pb-0.5 ${
                  activeTab === 'trial' 
                    ? 'text-gold border-b-2 border-gold font-bold' 
                    : 'hover:text-gold text-charcoal-light'
                }`}
              >
                Trial Session
              </button>
              <button
                onClick={() => scrollToSection('session-packs-section', 'packs')}
                className={`transition-colors duration-200 cursor-pointer pb-0.5 ${
                  activeTab === 'packs' 
                    ? 'text-gold border-b-2 border-gold font-bold' 
                    : 'hover:text-gold text-charcoal-light'
                }`}
              >
                Solo Packs
              </button>
              <button
                onClick={() => scrollToSection('about-section', 'about')}
                className={`transition-colors duration-200 cursor-pointer pb-0.5 ${
                  activeTab === 'about' 
                    ? 'text-gold border-b-2 border-gold font-bold' 
                    : 'hover:text-gold text-charcoal-light'
                }`}
              >
                Meet Akshay
              </button>
              <button
                onClick={() => scrollToSection('contact-section', 'contact')}
                className={`transition-colors duration-200 cursor-pointer pb-0.5 ${
                  activeTab === 'contact' 
                    ? 'text-gold border-b-2 border-gold font-bold' 
                    : 'hover:text-gold text-charcoal-light'
                }`}
              >
                Contact
              </button>
            </nav>

            {/* Right side interactions */}
            <div className="flex items-center space-x-3">
              {currentUser?.email === 'akshayyoga1@gmail.com' && (
                <button
                  onClick={() => setIsMyBookingsOpen(true)}
                  className="hidden sm:flex relative bg-white hover:bg-cream-dark text-charcoal border border-gold/25 hover:border-gold px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  id="my-appointments-btn"
                >
                  <CalendarDays size={13} className="text-gold" />
                  <span>My Bookings</span>
                  {bookings.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gold text-white font-sans text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {bookings.length}
                    </span>
                  )}
                </button>
              )}

              {currentUser?.email === 'akshayyoga1@gmail.com' && (
                <button
                  onClick={() => setIsAdminPortalOpen(true)}
                  className="hidden sm:flex bg-white hover:bg-cream-dark text-charcoal border border-gold/25 hover:border-gold px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer text-sans"
                  id="admin-portal-header-btn"
                >
                  <Shield size={13} className="text-gold font-bold" />
                  <span>Admin Panel</span>
                </button>
              )}

              {currentUser ? (
                <div className="hidden sm:flex items-center space-x-2 bg-cream-dark/60 border border-gold/15 px-3.5 py-2 rounded-full text-xs text-charcoal shadow-xs">
                  <span className="p-1.5 bg-gold/5 text-gold rounded-full flex items-center justify-center shrink-0">
                    <User size={12} />
                  </span>
                  <span className="font-semibold max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    onClick={() => {
                      signOut(auth);
                    }}
                    className="text-gold hover:text-charcoal pl-1.5 ml-1 border-l border-gold/15 transition-colors cursor-pointer font-bold select-none"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBookTrialSession}
                  className="hidden sm:block bg-charcoal hover:bg-gold text-white border border-transparent px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all hover:shadow cursor-pointer font-bold"
                >
                  Sign In
                </button>
              )}

              {/* Hamburger menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-charcoal hover:bg-gold/10 rounded-full transition-colors"
                id="mobile-hamburger-btn"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-cream border-t border-gold/10 overflow-y-auto max-h-[85vh] shadow-lg"
            >
              <div className="px-4 pt-3 pb-6 space-y-3.5 text-xs font-semibold uppercase tracking-widest text-charcoal-light">
                <button
                  onClick={() => scrollToSection('trial-section', 'trial')}
                  className={`w-full text-left block py-2.5 px-3 rounded hover:bg-gold/5 hover:text-gold cursor-pointer ${
                    activeTab === 'trial' ? 'bg-gold/5 text-gold font-bold' : ''
                  }`}
                >
                  Trial Session
                </button>
                <button
                  onClick={() => scrollToSection('session-packs-section', 'packs')}
                  className={`w-full text-left block py-2.5 px-3 rounded hover:bg-gold/5 hover:text-gold cursor-pointer ${
                    activeTab === 'packs' ? 'bg-gold/5 text-gold font-bold' : ''
                  }`}
                >
                  Solo Packs
                </button>
                <button
                  onClick={() => scrollToSection('about-section', 'about')}
                  className={`w-full text-left block py-2.5 px-3 rounded hover:bg-gold/5 hover:text-gold cursor-pointer ${
                    activeTab === 'about' ? 'bg-gold/5 text-gold font-bold' : ''
                  }`}
                >
                  Meet Akshay
                </button>
                <button
                  onClick={() => scrollToSection('contact-section', 'contact')}
                  className={`w-full text-left block py-2.5 px-3 rounded hover:bg-gold/5 hover:text-gold cursor-pointer ${
                    activeTab === 'contact' ? 'bg-gold/5 text-gold font-bold' : ''
                  }`}
                >
                  Contact
                </button>

                {currentUser?.email === 'akshayyoga1@gmail.com' && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsMyBookingsOpen(true);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded text-gold hover:bg-gold/5 cursor-pointer font-bold uppercase tracking-widest text-[11px] flex items-center space-x-1.5"
                  >
                    <CalendarDays size={11} className="shrink-0 text-gold" />
                    <span>My Bookings</span>
                    {bookings.length > 0 && (
                      <span className="bg-gold text-white font-sans text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                        {bookings.length}
                      </span>
                    )}
                  </button>
                )}

                {currentUser?.email === 'akshayyoga1@gmail.com' && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAdminPortalOpen(true);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded text-gold hover:bg-gold/5 cursor-pointer font-bold uppercase tracking-widest text-[11px] flex items-center space-x-1.5"
                  >
                    <Shield size={11} className="shrink-0" />
                    <span>Admin Panel</span>
                  </button>
                )}

                <div className="border-t border-gold/10 pt-3 my-1" />
                {currentUser ? (
                  <div className="mt-2 p-3 bg-cream border border-gold/10 rounded-xl space-y-2.5 shadow-inner">
                    <div className="flex items-center space-x-2.5 px-1">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold font-bold">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-bold text-charcoal leading-tight truncate">
                            {currentUser.displayName || 'Blees Yoga Member'}
                          </span>
                          {currentUser.email === 'akshayyoga1@gmail.com' && (
                            <span className="bg-gold text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-charcoal-light leading-none truncate block mt-0.5">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut(auth);
                      }}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-600 border border-red-500/10 transition-colors cursor-pointer font-bold uppercase tracking-widest text-[9px]"
                    >
                      <LogOut size={11} className="shrink-0" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleBookTrialSession();
                    }}
                    className="w-full text-left py-2.5 px-3 rounded text-gold hover:bg-gold/5 cursor-pointer font-bold uppercase tracking-widest text-[11px]"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content body */}
      <main className="flex-grow">
        {/* Intro/Brand Hero Hero Banner to capture studio essence */}
        <section id="hero-section" className="bg-cream-dark/40 pt-12 pb-20 md:pt-16 md:pb-24 border-b border-gold/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-charcoal font-bold tracking-tight max-w-2xl mx-auto leading-tight">
                Connect to Your True <span className="font-serif italic text-gold font-normal">Inner Essence</span>
              </h1>
              <p className="text-base text-charcoal-light max-w-xl mx-auto leading-relaxed">
                Welcome to Blees Yoga. Explore private, highly-focused yoga instruction designed meticulously around your body's specific range, objectives, and progression.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleBookTrialSession}
                className="bg-charcoal hover:bg-gold text-white text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer"
              >
                <span>Book Trial Session</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => scrollToSection('session-packs-section', 'packs')}
                className="bg-white hover:bg-cream-dark text-charcoal-light hover:text-charcoal border border-gold/15 text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Choose Session Pack
              </button>
            </div>
          </div>
        </section>

        {/* 1. Trial Session Section - Exactly Page 1 Layout */}
        <section id="trial-section" className="pt-8 pb-20 md:pt-12 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 border-b border-gold/5">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold tracking-[0.25em] text-gold uppercase block">FIRST STEP</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal font-semibold tracking-tight">
              Book Your <span className="italic font-normal text-gold">Trial Session</span>
            </h2>
            <p className="text-sm sm:text-base text-charcoal-light leading-relaxed max-w-xl mx-auto font-light">
              A focused one-to-one session to understand your goals, identify what is holding you back, and bring complete clarity on what to do next. The perfect starting point on your yoga journey.
            </p>
            
            <div className="pt-2">
              <button
                onClick={handleBookTrialSession}
                className="group border-b-2 border-gold text-gold hover:text-gold-dark hover:border-gold-dark transition-all duration-300 font-sans text-xs tracking-[0.2em] font-semibold uppercase pb-1 flex items-center space-x-1.5 mx-auto cursor-pointer"
              >
                <span>BOOK TRIAL SESSION — FREE</span>
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Featured Trial Card precisely modeled after pg 1 */}
          <div className="flex justify-center">
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gold/15 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden"
            >
              {/* Decorative side color accent line as luxury card touches */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />

              {/* Floating starting yoga emoji icon representing the beginning of the journey */}
              <div className="pt-2 flex justify-center">
                <motion.div 
                  animate={{ 
                    y: [0, -6, 0],
                    rotate: [0, 2, -2, 0] 
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-3xl shadow-sm border border-gold/25 cursor-default"
                >
                  🧘‍♀️
                </motion.div>
              </div>

              <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-gold uppercase block">
                SINGLE SESSION ✦ START HERE
              </span>

              <div className="space-y-1">
                <h3 className="text-2xl font-serif text-charcoal font-bold flex items-center justify-center gap-1.5">
                  Trial Session <span className="text-gold text-lg">✨</span>
                </h3>
                <div className="flex items-start justify-center text-charcoal py-2">
                  <span className="text-4xl font-serif font-bold tracking-tight uppercase text-gold animate-pulse">FREE</span>
                </div>
                <p className="text-xs text-charcoal-light font-medium tracking-wide">
                  60 min · Private · Personalised assessment
                </p>
                <p className="text-xs text-gold font-medium font-serif italic">
                  One-to-one with Akshay Chotara
                </p>
              </div>

              <button
                onClick={handleBookTrialSession}
                className="w-full bg-transparent hover:bg-charcoal text-gold hover:text-white border-2 border-gold/40 hover:border-charcoal font-semibold py-3 px-6 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                id="book-trial-session-card-btn"
              >
                BOOK NOW
              </button>
            </motion.div>
          </div>
        </section>

        {/* Choose Your Session Pack Section */}
        <section id="session-packs-section" className="py-20 md:py-28 bg-white border-b border-gold/5 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold tracking-[0.25em] text-gold uppercase block">SESSION PLANS</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal font-bold tracking-tight">
                Our Private <span className="italic font-normal text-gold">Solo Packs</span>
              </h2>
              <p className="text-sm sm:text-base text-charcoal leading-relaxed max-w-xl mx-auto font-medium">
                Select the private session pack that feels right for your goals. The 12 and 20-session packs come with special value discounts for dedicated yoga practitioners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {SOLO_PACKS.map((pack) => {
                const isBestValue = pack.badge?.includes('BEST VALUE');
                const isMaxDiscount = pack.badge?.includes('MAX DISCOUNT');
                
                return (
                  <motion.div
                    key={pack.id}
                    whileHover={{ y: -6 }}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between min-h-[380px] shadow-sm transition-all duration-300 border ${
                      isBestValue 
                        ? 'border-gold ring-2 ring-gold/15 bg-white' 
                        : isMaxDiscount 
                          ? 'border-gold-light bg-cream/5'
                          : 'border-gold/10 bg-white'
                    }`}
                  >
                    {pack.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[8px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                        {pack.badge}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="text-center border-b border-gold/5 pb-3">
                        <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-gold uppercase block">
                          {pack.sessions} {pack.sessions === 1 ? 'SESSION' : 'SESSIONS'}
                        </span>
                      </div>

                      <div className="text-center py-1 font-bold">
                        <div className="flex items-center justify-center space-x-1">
                          {pack.originalPrice && (
                            <span className="text-xs font-sans font-bold text-charcoal-light/50 line-through">
                              ₹{pack.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-xs font-sans font-bold text-charcoal align-top mt-0.5">₹</span>
                          <span className="text-3xl font-serif font-black tracking-tight text-charcoal">
                            {pack.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <span className="text-xs font-sans font-bold text-gold block mt-1">
                          ₹{pack.sessionPrice.toLocaleString('en-IN')} / session
                        </span>

                        {pack.saving && (
                          <span className="inline-flex items-center gap-1 mt-1 bg-gold/10 border border-gold/25 text-gold text-[9px] font-sans font-black tracking-wider uppercase px-2 py-0.5 rounded">
                            ✦ Save ₹{pack.saving.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-charcoal font-medium text-center leading-relaxed tracking-wide min-h-[40px]">
                        {pack.description}
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => openBookingForPack(pack)}
                        className={`w-full font-bold py-3 px-6 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                          isBestValue
                            ? 'bg-charcoal text-white hover:bg-gold border-charcoal hover:border-gold'
                            : 'bg-transparent text-charcoal border-charcoal/30 hover:bg-charcoal hover:text-white'
                        }`}
                      >
                        CHOOSE PLAN
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Why choose private plans list */}
            <div className="bg-cream-dark/10 p-8 sm:p-10 rounded-2xl border border-gold/10 grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gold">
                  <span>✦</span>
                  <h4 className="font-serif text-sm font-bold text-charcoal">Undivided Direct Focus</h4>
                </div>
                <p className="text-xs text-charcoal font-semibold leading-relaxed">
                  Akshay evaluates your form, joint rotation, and breathing on a continuous, real-time basis, preventing injuries and accelerating alignment progress.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gold">
                  <span>✦</span>
                  <h4 className="font-serif text-sm font-bold text-charcoal">Custom Progress Cadence</h4>
                </div>
                <p className="text-xs text-charcoal font-semibold leading-relaxed">
                  Increase stamina or flexibility at your customized pace. Plans are adjusted to account for any prior physical restrictions or medical considerations.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gold">
                  <span>✦</span>
                  <h4 className="font-serif text-sm font-bold text-charcoal">Flexible Schedule Options</h4>
                </div>
                <p className="text-xs text-charcoal font-semibold leading-relaxed">
                  Coordinate flexible slots that seamlessly fit into complex calendar grids. Book, pause, or reschedule classes with zero penalty fees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Lead Instructor Akshay Chotara */}
        <section id="about-section" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold tracking-[0.25em] text-gold uppercase block">LEAD TEACHER</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal font-semibold tracking-tight">
                Meet <span className="italic font-normal text-gold">{instructorProfile.name}</span>
              </h2>
              <p className="text-sm sm:text-base text-charcoal-light leading-relaxed max-w-xl mx-auto font-light">
                Learn the philosophy, intention, and path guiding physical alignment and breath transformation.
              </p>
            </div>

            {/* Banner Block with Yogi representing Instructor */}
            <div className="flex justify-center">
  <div className="w-75 h-99 flex justify-end">
  <img
    src={akshayPhoto}
    alt="Akshay"
    className="w-99 object-cover rounded-xl"
  />
</div>
</div>

            {/* Detailed Philosophy Copy */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-4xl mx-auto pt-6 border-t border-gold/10">
              <div className="lg:col-span-5 space-y-3.5">
                <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-gold uppercase block">
                  PHILOSOPHY ON PRACTICE
                </span>
                <h2 className="text-3xl font-serif text-charcoal font-semibold tracking-tight leading-tight">
                  Practice with <span className="italic font-normal text-gold">intention</span>
                </h2>
              </div>

              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4 text-sm sm:text-base text-charcoal-light leading-relaxed font-light">
                  <p>
                    {instructorProfile.bio1}
                  </p>
                  <p>
                    {instructorProfile.bio2}
                  </p>
                  <p>
                    {instructorProfile.bio3}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    'Personalised one-to-one instruction every session',
                    'Structured, goal-oriented progression plan',
                    'Breath, alignment & mindfulness integrated',
                    'Flexible scheduling that fits your lifestyle',
                    'Suitable for all levels — beginners welcome'
                  ].map((bullet, i) => (
                    <div key={i} className="flex items-start space-x-2.5 text-xs text-charcoal">
                      <span className="text-gold mt-1 font-semibold">✦</span>
                      <span className="font-medium">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Inquiry forms & maps wrapper */}
        <section id="contact-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-[0.25em] text-gold uppercase block">GET IN TOUCH</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal font-semibold tracking-tight">
              Connect with <span className="italic font-normal text-gold">Akshay</span>
            </h2>
            <p className="text-sm sm:text-base text-charcoal-light leading-relaxed max-w-xl mx-auto font-light">
              Have questions about private yoga sessions or scheduling? Send a direct message or reach out via Instagram, WhatsApp, or Email.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Card Contacts */}
            <div className="bg-white border border-gold/15 p-8 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg text-charcoal font-semibold border-b border-gold/10 pb-2 mb-4">Direct channels</h3>
                <div className="space-y-5 text-sm text-charcoal">
                  <a 
                    href="https://wa.me/917043474379" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center space-x-3 hover:text-gold transition-colors block cursor-pointer group"
                  >
                    <span className="p-3 bg-gold/5 text-gold rounded-full flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors"><MessageSquare size={16} /></span>
                    <div>
                      <p className="font-semibold text-[10px] text-charcoal uppercase tracking-wider font-sans">WhatsApp Helpline</p>
                      <p className="font-bold text-xs text-gold underline">+91 70434 74379</p>
                    </div>
                  </a>
                  <a 
                    href="mailto:akshayahir0001@gmail.com" 
                    className="flex items-center space-x-3 hover:text-gold transition-colors block cursor-pointer group"
                  >
                    <span className="p-3 bg-gold/5 text-gold rounded-full flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors"><Mail size={16} /></span>
                    <div>
                      <p className="font-semibold text-[10px] text-charcoal uppercase tracking-wider font-sans">Email Address</p>
                      <p className="font-bold text-xs text-gold underline font-mono">akshayahir0001@gmail.com</p>
                    </div>
                  </a>
                  <div className="flex items-start space-x-3">
                    <span className="p-3 bg-gold/5 text-gold rounded-full flex items-center justify-center shrink-0"><Instagram size={16} /></span>
                    <div className="space-y-1">
                      <p className="font-semibold text-[10px] text-charcoal uppercase tracking-wider font-sans">Instagram Feeds</p>
                      <div className="flex flex-col space-y-1">
                        <a 
                          href="https://instagram.com/Bleesyoga" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-gold transition-colors text-xs text-gold underline font-bold block"
                        >
                          @Bleesyoga
                        </a>
                        <a 
                          href="https://instagram.com/akshayyoga1" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-gold transition-colors text-xs text-gold underline font-bold block"
                        >
                          @akshayyoga1
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card Operating Hours & Location */}
            <div className="bg-white border border-gold/15 p-8 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg text-charcoal font-semibold border-b border-gold/10 pb-2 mb-4">Hours & Location</h3>
                <div className="text-charcoal leading-relaxed font-semibold space-y-2 bg-cream-dark/10 p-4.5 rounded-xl border border-gold/10">
                  <div className="flex justify-between items-center text-xs">
                    <span>Mon — Sat:</span>
                    <span className="text-gold">06:30 AM — 08:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Sunday:</span>
                    <span className="text-charcoal/50">Closed</span>
                  </div>
                  <div className="pt-3.5 border-t border-gold/10 text-xs">
                    <span className="block font-bold text-gold uppercase text-[9px] mb-1 font-sans">Address Venue</span>
                    <p className="font-sans leading-relaxed text-charcoal">
                      356, Rabindranath Tagore Rd, Gandhidham, Gujarat 370201 (K.D.B.A)
                    </p>
                    <p className="mt-2 text-[10px] text-gold italic">
                      ✦ Strictly by appointment only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer Layout - Page 5 Exactly */}
      <footer className="bg-brown-deep border-t border-gold/20 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Footer Summary Col + Nav Col precisely modeled after pg 5 logo/links */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            
            {/* Logo/Description Left stack */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-2.5">
                <Logo size={48} showCircleBg={true} />
                <div>
                  <h3 className="font-serif text-2xl font-bold tracking-wide text-white">Blees Yoga</h3>
                  <span className="text-[9px] font-sans font-semibold text-gold-light tracking-widest uppercase">Yoga with Akshay Chotara</span>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-cream/75 leading-relaxed font-light max-w-sm">
                Private yoga sessions with Akshay Chotara — personalised, purposeful, and transformative.
              </p>
            </div>

            {/* SESSIONS list */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.25em] text-gold uppercase block">SESSIONS</h4>
              <ul className="text-xs space-y-2.5 text-cream/70">
                <li>
                  <button onClick={() => scrollToSection('trial-section', 'trial')} className="hover:text-gold transition-colors block text-left cursor-pointer">Trial Session</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('session-packs-section', 'packs')} className="hover:text-gold transition-colors block text-left cursor-pointer">Solo Packs</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('session-packs-section', 'packs')} className="hover:text-gold transition-colors block text-left cursor-pointer">Pricing Plans</button>
                </li>
              </ul>
            </div>

            {/* CONTACT list */}
            <div className="md:col-span-4 space-y-3.5 font-semibold">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.25em] text-gold uppercase block">CONTACT</h4>
              <ul className="text-xs space-y-2.5 text-cream">
                <li>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[9px] font-sans font-bold tracking-wider text-gold-light uppercase block">Instagram Feeds</span>
                    <div className="flex items-center gap-3">
                      <a 
                        href="https://instagram.com/Bleesyoga" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:text-gold transition-colors flex items-center space-x-1.5 text-cream/90"
                      >
                        <Instagram size={13} className="text-gold" />
                        <span>@Bleesyoga</span>
                      </a>
                      <a 
                        href="https://instagram.com/akshayyoga1" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:text-gold transition-colors flex items-center space-x-1.5 text-cream/90"
                      >
                        <Instagram size={13} className="text-gold" />
                        <span>@akshayyoga1</span>
                      </a>
                    </div>
                  </div>
                </li>
                <li>
                  <a 
                    href="https://wa.me/917043474379" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-gold transition-colors flex items-center space-x-1.5 text-cream/90"
                  >
                    <MessageSquare size={13} className="text-gold" />
                    <span>WhatsApp: +91 70434 74379</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:akshayahir0001@gmail.com" 
                    className="hover:text-gold transition-colors flex items-center space-x-1.5 text-cream/90"
                  >
                    <Mail size={13} className="text-gold" />
                    <span>Email: akshayahir0001@gmail.com</span>
                  </a>
                </li>
                <li className="flex items-start space-x-1.5 text-cream/90 font-sans">
                  <MapPin size={13} className="text-gold mt-0.5 shrink-0" />
                  <span className="leading-relaxed font-medium">Location: 356, Rabindranath Tagore Rd, Gandhidham, Gujarat 370201 (K.D.B.A) [By appointment]</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom attribution rules matching baseline exactly */}
          <div className="border-t border-gold/15 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-cream/50 font-sans">
            <p className="font-light">
              © 2026 Blees Yoga Studio · Yoga with Akshay Chotara
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAdminPortalOpen(true)}
                className="text-cream/50 hover:text-gold transition-colors font-semibold border-0 cursor-pointer focus:outline-none flex items-center space-x-1"
                title="Staff Portal Login"
              >
                <Shield size={11} className="text-gold/75" />
                <span>Admin Entrance</span>
              </button>
              <span className="text-gold/20 font-light">|</span>
              <p className="font-serif italic text-gold-light">
                Crafted with intention
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 2 Interactive Modals Panels */}
      
      {/* 1. Quick Booking Entry system */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedPackForBooking(null);
        }}
        selectedPack={selectedPackForBooking}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* 2. My Bookings wallet drawer */}
      <MyBookings
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={bookings}
        onCancelBooking={handleCancelBooking}
      />

      {/* 3. Secure Admin Portal drawer */}
      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        currentUser={currentUser}
        allBookings={bookings}
      />
    </div>
  );
}

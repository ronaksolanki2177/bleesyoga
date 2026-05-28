import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Save, 
  TrendingUp, 
  BookOpen, 
  XCircle,
  Clock3,
  Loader2,
  Lock,
  Upload
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  serverTimestamp, 
  collection, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Booking, TIME_SLOTS } from '../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  allBookings: Booking[]; // Can accept globally synced real-time bookings
}

export default function AdminPortal({
  isOpen,
  onClose,
  currentUser,
  allBookings
}: AdminPortalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Edit schedule states
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  // Multi-confirmation for deletions
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status mutation loading tracking
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Checks is currently logged in user the actual admin
  const isUserAdmin = currentUser?.email === 'akshayyoga1@gmail.com';

  // Admin section navigation
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'profile'>('bookings');

  // Instructor profile form states
  const [profName, setProfName] = useState('Akshay Chotara');
  const [profRole, setProfRole] = useState('LEAD INSTRUCTOR · BLEES YOGA');
  const [profPhotoUrl, setProfPhotoUrl] = useState('');
  const [profBio1, setProfBio1] = useState('');
  const [profBio2, setProfBio2] = useState('');
  const [profBio3, setProfBio3] = useState('');
  const [usePhotoUrlAsDefault, setUsePhotoUrlAsDefault] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sync instructor profile form states from database
  useEffect(() => {
    if (!isUserAdmin) return;

    const unsub = onSnapshot(doc(db, 'settings', 'instructor'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfName(data.name || 'Akshay Chotara');
        setProfRole(data.role || 'LEAD INSTRUCTOR · BLEES YOGA');
        setProfPhotoUrl(data.photoUrl || '');
        setProfBio1(data.bio1 || 'Akshay brings a calm, grounded approach to every session — meeting each student exactly where they are, and guiding them toward where they want to be.');
        setProfBio2(data.bio2 || 'At Blees Yoga, sessions are never one-size-fits-all. Every class is crafted around your unique body, goals, and pace of growth — so you always feel seen and supported.');
        setProfBio3(data.bio3 || 'Combining precise biological alignment markers with ancient deep pranayama breath synchronization, my program establishes a stable foundation that serves you both on the mat and in your daily active pursuits.');
        setUsePhotoUrlAsDefault(data.usePhotoUrlAsDefault !== undefined ? data.usePhotoUrlAsDefault : (data.photoUrl ? true : false));
      }
    });

    return () => unsub();
  }, [isUserAdmin]);

  // Handle Drag & Drop events for local image uploads
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files (JPEG, PNG, WEBP, etc.) are permitted.');
      return;
    }
    if (file.size > 800000) {
      alert('Image size exceeds 800KB. To ensure quick loading and clean cloud synchronization, please compress or downscale the image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Save updated instructor details to Firestore settings
  const handleSaveInstructorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccess(false);

    try {
      await setDoc(doc(db, 'settings', 'instructor'), {
        name: profName.trim(),
        role: profRole.trim(),
        photoUrl: profPhotoUrl.trim(),
        bio1: profBio1.trim(),
        bio2: profBio2.trim(),
        bio3: profBio3.trim(),
        usePhotoUrlAsDefault: usePhotoUrlAsDefault,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update instructor settings:', err);
      alert('Unable to save settings. Please verify database connectivity.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Admin Authorization Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const normalEmail = email.trim().toLowerCase();

    // Verify it is the user-specified admin credentials
    if (normalEmail !== 'akshayyoga1@gmail.com') {
      setLoginError('Unauthorized access: Only the specified Blees Yoga administrator is permitted.');
      setIsLoggingIn(false);
      return;
    }

    if (password !== 'akshay@123') {
      setLoginError('Incorrect password. Please verify the administrator credentials.');
      setIsLoggingIn(false);
      return;
    }

    try {
      // 1. Attempt login with provided credentials
      await signInWithEmailAndPassword(auth, normalEmail, password);
    } catch (err: any) {
      // 2. If user doesn't exist, auto-create to seamlessly bootstrap testing
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, normalEmail, password);
          await updateProfile(cred.user, { displayName: 'Akshay Chotara' });
        } catch (createErr: any) {
          console.error('Error auto-creating admin bootstrap user:', createErr);
          setLoginError('Authentication service error. Please try again.');
        }
      } else {
        setLoginError(err.message || 'Authentication error.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Modify Booking Status (e.g. Confirm, Cancel, Pend)
  const handleChangeStatus = async (bookingId: string, newStatus: 'confirmed' | 'pending' | 'cancelled') => {
    setLoadingActionId(bookingId);
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Reschedule Booking Date/Time
  const handleSaveReschedule = async (bookingId: string) => {
    if (!editDate || !editTime) return;
    setLoadingActionId(bookingId);
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        selectedDate: editDate,
        selectedTime: editTime,
        updatedAt: serverTimestamp()
      });
      setEditingBookingId(null);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Permanently Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    setLoadingActionId(bookingId);
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await deleteDoc(docRef);
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `bookings/${bookingId}`);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Start Rescheduling Flow
  const startReschedule = (booking: Booking) => {
    setEditingBookingId(booking.id);
    setEditDate(booking.selectedDate);
    setEditTime(booking.selectedTime);
  };

  // Filter and Search Bookings Client-Side
  const filteredBookings = useMemo(() => {
    return allBookings.filter(booking => {
      // 1. Filter by status
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }
      // 2. Search query match
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        return (
          booking.clientName.toLowerCase().includes(queryLower) ||
          booking.clientEmail.toLowerCase().includes(queryLower) ||
          booking.clientPhone.includes(queryLower) ||
          booking.packageName.toLowerCase().includes(queryLower) ||
          booking.id.toLowerCase().includes(queryLower)
        );
      }
      return true;
    });
  }, [allBookings, statusFilter, searchQuery]);

  // Derived Dashboard Statistics
  const stats = useMemo(() => {
    let totalCount = allBookings.length;
    let confirmedCount = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    let activeRevenue = 0;

    allBookings.forEach(b => {
      if (b.status === 'confirmed') {
        confirmedCount++;
        activeRevenue += b.price;
      } else if (b.status === 'cancelled') {
        cancelledCount++;
      } else {
        pendingCount++;
        activeRevenue += b.price; // Include pending bookings in total revenue if unpaid initially or trial
      }
    });

    return {
      totalCount,
      confirmedCount,
      cancelledCount,
      pendingCount,
      revenue: activeRevenue
    };
  }, [allBookings]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/40 backdrop-blur-xs"
        />

        {/* Drawer slide-out panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="bg-cream border-l border-gold/15 shadow-2xl max-w-2xl w-full h-full relative z-10 flex flex-col font-sans"
        >
          {/* Header */}
          <div className="p-5 border-b border-gold/10 flex justify-between items-center bg-cream-dark">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-gold/10 text-gold rounded-lg">
                {isUserAdmin ? <ShieldCheck size={20} /> : <Shield size={20} />}
              </span>
              <div>
                <h3 className="text-xl font-serif text-charcoal font-semibold">
                  {isUserAdmin ? 'Blees Yoga Administrative Portal' : 'Administrator Entrance'}
                </h3>
                <p className="text-xs text-charcoal-light mt-0.5">
                  {isUserAdmin ? 'Real-time studio management and scheduler control center' : 'Secure authentication requested'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-1.5 rounded-full hover:bg-gold/10 transition-colors text-charcoal-light hover:text-charcoal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Inner Content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {!isUserAdmin ? (
              // LOGIN SECURE FORM
              <div className="flex-1 flex items-center justify-center p-6 bg-cream/50">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm bg-white border border-gold/15 rounded-2xl p-6 shadow-sm space-y-5"
                >
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 bg-gold/5 text-gold border border-gold/10 rounded-full flex items-center justify-center shrink-0">
                      <Lock size={16} />
                    </div>
                    <h4 className="font-serif text-lg font-bold text-charcoal">Sign In is Requested</h4>
                    <p className="text-[11px] text-charcoal-light max-w-xs mx-auto">
                      Please sign in with your administrative account to manage all active appointments and package sales.
                    </p>
                  </div>

                  {loginError && (
                    <div className="bg-red-50 border border-red-200/50 rounded-xl p-3 text-xs text-red-700 flex items-start space-x-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="akshayyoga1@gmail.com"
                        className="w-full bg-cream/10 border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                        Secure Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter the password"
                        autoComplete="current-password"
                        className="w-full bg-cream/10 border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-charcoal hover:bg-gold hover:shadow-md text-white text-xs font-bold tracking-wider uppercase py-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-charcoal/50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Authorizing...</span>
                        </>
                      ) : (
                        <span>Verify Credentials</span>
                      )}
                    </button>
                  </form>
                  
                  <div className="border-t border-gold/5 pt-4 text-center">
                    <p className="text-[10px] text-charcoal-light font-medium italic">
                      Blees Yoga Management System
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              // ADMIN CONTROL DASHBOARD VIEW
              <div className="flex-1 flex flex-col min-h-0">
                {/* Admin Sub Navigation Tabs */}
                <div className="px-5 pt-3.5 border-b border-gold/10 flex space-x-6 bg-cream-dark/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('bookings')}
                    className={`pb-2.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                      activeAdminTab === 'bookings'
                        ? 'border-gold text-gold font-bold'
                        : 'border-transparent text-charcoal-light hover:text-charcoal'
                    }`}
                  >
                    <Clock3 size={11} className={activeAdminTab === 'bookings' ? 'text-gold' : 'text-charcoal-light'} />
                    <span>Client Reservations</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('profile')}
                    className={`pb-2.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                      activeAdminTab === 'profile'
                        ? 'border-gold text-gold font-bold'
                        : 'border-transparent text-charcoal-light hover:text-charcoal'
                    }`}
                  >
                    <User size={11} className={activeAdminTab === 'profile' ? 'text-gold' : 'text-charcoal-light'} />
                    <span>Instructor Profile Settings</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {activeAdminTab === 'profile' ? (
                    /* The dynamic form panel */
                    <form onSubmit={handleSaveInstructorProfile} className="space-y-6 max-w-xl mx-auto w-full pb-10">
                      {saveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center space-x-2">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>Instructor profile and custom graphics saved successfully! Real-time syncing completed.</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Instructor Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          placeholder="Akshay Chotara"
                          className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Role Title / Subtitle
                        </label>
                        <input
                          type="text"
                          required
                          value={profRole}
                          onChange={(e) => setProfRole(e.target.value)}
                          placeholder="LEAD INSTRUCTOR · BLEES YOGA"
                          className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>

                      {/* Instructor Photo Upload Drag-and-Drop Area */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Instructor Portrait (Photo URL or choose file below)
                        </label>
                        
                        {/* URL input alternative */}
                        <div className="space-y-1">
                          <input
                            type="url"
                            value={profPhotoUrl}
                            onChange={(e) => setProfPhotoUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/... or upload below"
                            className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                        </div>

                        {/* Drag and Drop Box */}
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                            dragActive 
                              ? 'border-gold bg-gold/5' 
                              : 'border-gold/15 bg-white hover:border-gold/30 hover:bg-cream-dark/10'
                          }`}
                        >
                          <input
                            type="file"
                            id="photo-file-upload"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <label htmlFor="photo-file-upload" className="cursor-pointer inset-0 absolute flex flex-col items-center justify-center p-4">
                            <Upload size={20} className="text-gold/80 mb-1 mx-auto" />
                            <span className="text-[11px] font-semibold text-charcoal">
                              Drag and Drop file, or <span className="text-gold underline">Browse local photo</span>
                            </span>
                            <span className="text-[9px] text-charcoal-light/60 mt-1">
                              JPEG, PNG or WEBP formats up to 800 KB
                            </span>
                          </label>
                          <div className="h-10" />
                        </div>

                        {profPhotoUrl && (
                          <div className="bg-cream-dark/50 border border-gold/10 rounded-xl p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 truncate">
                              <img 
                                src={profPhotoUrl} 
                                alt="Preview" 
                                className="w-10 h-10 object-cover rounded-lg border border-gold/15 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate text-left">
                                <p className="text-[10px] font-bold text-charcoal truncate">Active Image Loaded</p>
                                <p className="text-[9px] text-charcoal-light/60 truncate italic">
                                  {profPhotoUrl.startsWith('data:') ? 'Base64 Local Data Resource' : profPhotoUrl}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfPhotoUrl('')}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {profPhotoUrl && (
                        <div className="bg-white border border-gold/15 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-charcoal select-none">Use photo as page default</span>
                            <span className="text-[9px] text-charcoal-light/60 select-none">If turned on, visitors see this photograph instead of the vector illustration by default.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={usePhotoUrlAsDefault}
                            onChange={(e) => setUsePhotoUrlAsDefault(e.target.checked)}
                            className="w-4 h-4 text-gold border-gray-350 rounded focus:ring-gold accent-gold shrink-0 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Biography Paragraph 1
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={profBio1}
                          onChange={(e) => setProfBio1(e.target.value)}
                          placeholder="Akshay brings a calm, grounded approach..."
                          className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Biography Paragraph 2
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={profBio2}
                          onChange={(e) => setProfBio2(e.target.value)}
                          placeholder="At Blees Yoga, sessions are never..."
                          className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-charcoal-light uppercase block">
                          Biography Paragraph 3
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={profBio3}
                          onChange={(e) => setProfBio3(e.target.value)}
                          placeholder="Combining precise biological alignment..."
                          className="w-full bg-white border border-gold/25 rounded-lg p-2.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full bg-charcoal hover:bg-gold hover:shadow-md text-white text-xs font-bold tracking-wider uppercase py-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-charcoal/50"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            <span>Save Instructor Profile</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Stats Grid Widget */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-gold/15 p-3.5 rounded-xl text-center space-y-0.5 shadow-xs">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Registrations</span>
                    <span className="text-2xl font-bold text-charcoal block">{stats.totalCount}</span>
                  </div>
                  
                  <div className="bg-white border border-gold/15 p-3.5 rounded-xl text-center space-y-0.5 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Confirmed</span>
                    <span className="text-2xl font-bold text-emerald-700 block">{stats.confirmedCount}</span>
                  </div>

                  <div className="bg-white border border-gold/15 p-3.5 rounded-xl text-center space-y-0.5 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Pending</span>
                    <span className="text-2xl font-bold text-amber-600 block">{stats.pendingCount}</span>
                  </div>

                  <div className="bg-white border border-gold/15 p-3.5 rounded-xl text-center space-y-0.5 shadow-xs">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Revenue</span>
                    <span className="text-xl font-bold text-indigo-600 block">₹{stats.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Search & Filter Section */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gold/60 pointer-events-none">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by client name, email, phone or pack..."
                      className="w-full bg-white border border-gold/20 rounded-lg py-2.5 pl-9 pr-4 text-xs font-medium focus:border-gold focus:outline-none text-charcoal placeholder-charcoal-light/60 transition-all shadow-2xs"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-3 flex items-center text-charcoal-light hover:text-charcoal"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Status Filter tab selectors */}
                  <div className="flex bg-cream-dark border border-gold/15 p-1 rounded-lg shrink-0 overflow-x-auto text-[10px] font-bold uppercase tracking-wider">
                    {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          statusFilter === st 
                            ? 'bg-charcoal text-cream shadow-xs' 
                            : 'text-charcoal-light hover:text-charcoal'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bookings Scroll List */}
                <div className="space-y-4 flex-1">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-10 bg-white border border-gold/10 rounded-xl px-4 space-y-2">
                      <div className="w-12 h-12 bg-cream-dark border border-gold/5 rounded-full flex items-center justify-center mx-auto text-gold">
                        <BookOpen size={18} />
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-charcoal">No bookings match the search criteria</h4>
                      <p className="text-[11px] text-charcoal-light max-w-sm mx-auto">
                        Try clearing or modifying the search filter query to view other reservations.
                      </p>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => {
                      const isEditing = editingBookingId === booking.id;
                      const isLoading = loadingActionId === booking.id;

                      return (
                        <div
                          key={booking.id}
                          className="border border-gold/15 bg-white rounded-xl shadow-xs overflow-hidden block"
                        >
                          {/* Card ID Header bar */}
                          <div className="bg-cream-dark/50 p-3 px-4 border-b border-gold/10 flex flex-wrap justify-between items-center gap-2 text-xs">
                            <span className="font-mono bg-white border border-gold/10 px-1.5 py-0.5 rounded text-charcoal font-semibold">
                              REF: {booking.id}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {/* Loading action spinner */}
                              {isLoading && <Loader2 size={12} className="animate-spin text-gold" />}
                              
                              <span className={`flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full border ${
                                booking.status === 'cancelled'
                                  ? 'text-red-600 bg-red-50 border-red-200'
                                  : booking.status === 'pending'
                                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              }`}>
                                ● {booking.status}
                              </span>
                            </div>
                          </div>

                          {/* Customer Details Content */}
                          <div className="p-4 space-y-4">
                            {/* Head metadata */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <h4 className="font-serif text-base text-charcoal font-bold">
                                  {booking.packageName}
                                </h4>
                                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gold">
                                  {booking.sessions} Sessions Package · ₹{booking.price.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {/* Action controls header level */}
                              {!isEditing && (
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={() => startReschedule(booking)}
                                    className="p-1 px-2 border border-gold/20 hover:border-gold rounded-md text-[10px] font-bold text-charcoal hover:bg-cream-dark/40 transition-colors flex items-center space-x-1 cursor-pointer"
                                    title="Reschedule Class"
                                  >
                                    <Clock3 size={11} className="text-gold" />
                                    <span>Reschedule</span>
                                  </button>

                                  {booking.status !== 'confirmed' && (
                                    <button
                                      onClick={() => handleChangeStatus(booking.id, 'confirmed')}
                                      className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-[10px] font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                                      title="Mark Confirmed"
                                    >
                                      <CheckCircle2 size={11} />
                                      <span>Confirm</span>
                                    </button>
                                  )}

                                  {booking.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleChangeStatus(booking.id, 'cancelled')}
                                      className="p-1 px-2 bg-amber-500 hover:bg-amber-600 rounded-md text-[10px] font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                                      title="Cancel Booking"
                                    >
                                      <XCircle size={11} />
                                      <span>Cancel</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Scheduling timetable row */}
                            {isEditing ? (
                              <div className="bg-cream-dark/40 p-3 rounded-lg border border-gold/10 space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal block">
                                  Modify Appointment Timetable
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Date picker */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-charcoal-light block">
                                      Select Date
                                    </label>
                                    <input
                                      type="date"
                                      required
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="w-full bg-white border border-gold/20 rounded-lg p-2 text-xs focus:outline-none"
                                    />
                                  </div>

                                  {/* Custom select slot list */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-charcoal-light block">
                                      Select Slot Time
                                    </label>
                                    <select
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      className="w-full bg-white border border-gold/20 rounded-lg p-2 text-xs focus:outline-none"
                                    >
                                      {TIME_SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>
                                          {slot}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setEditingBookingId(null)}
                                    className="px-3 py-1.5 text-[10px] font-bold bg-white border border-gold/15 hover:bg-cream-dark text-charcoal rounded-md cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveReschedule(booking.id)}
                                    className="px-3 py-1.5 text-[10px] font-bold bg-gold hover:bg-charcoal text-cream rounded-md flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Save size={11} />
                                    <span>Save Reschedule</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Normal non-editing mode slot view
                              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-dashed border-gold/10 bg-cream/30 px-3 rounded-lg">
                                <div className="flex items-center gap-1.5 text-charcoal">
                                  <Calendar size={13} className="text-gold" />
                                  <span className="font-semibold">{booking.selectedDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-charcoal">
                                  <Clock size={13} className="text-gold" />
                                  <span className="font-semibold">{booking.selectedTime}</span>
                                </div>
                              </div>
                            )}

                            {/* Client Contact Details Box */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-charcoal-light">
                              <div className="flex items-center space-x-2">
                                <span className="p-1 px-1.5 rounded bg-cream-dark text-gold shrink-0">
                                  <User size={11} />
                                </span>
                                <span className="font-semibold text-charcoal truncate">{booking.clientName}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="p-1 px-1.5 rounded bg-cream-dark text-gold shrink-0">
                                  <Mail size={11} />
                                </span>
                                <span className="truncate select-all text-charcoal">{booking.clientEmail}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="p-1 px-1.5 rounded bg-cream-dark text-gold shrink-0">
                                  <Phone size={11} />
                                </span>
                                <span className="truncate select-all text-charcoal">{booking.clientPhone}</span>
                              </div>
                            </div>

                            {/* Friend / partner bookings attribute if present */}
                            {booking.friendName && (
                              <div className="p-2 border border-gold/10 bg-cream-dark/30 rounded-lg text-xs flex justify-between">
                                <span className="text-gold/80 font-medium">Friend/Partner:</span>
                                <span className="italic text-charcoal font-semibold">{booking.friendName}</span>
                              </div>
                            )}

                            {/* Physical Deletion Row with double-lock safety */}
                            <div className="pt-2 border-t border-gold/5 flex justify-between items-center text-[10px]">
                              <span className="text-charcoal-light/60 font-light">
                                Created at: {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : 'Unknown'}
                              </span>

                              {confirmDeleteId === booking.id ? (
                                <div className="bg-red-50 border border-red-200 rounded p-1 px-2 flex items-center space-x-2">
                                  <span className="font-semibold text-red-700">Delete booking?</span>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-0.5 px-1.5 bg-white border border-gray-200 text-charcoal rounded cursor-pointer hover:bg-gray-50 shrink-0 font-bold"
                                  >
                                    No
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="p-0.5 px-2 bg-red-600 border border-transparent text-white rounded cursor-pointer hover:bg-red-700 font-bold flex items-center space-x-0.5 shrink-0"
                                  >
                                    <Trash2 size={10} />
                                    <span>Yes</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(booking.id)}
                                  className="text-red-500 hover:text-red-700 font-bold transition-all flex items-center space-x-1 hover:underline cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  <span>Permanently Delete Reservation</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

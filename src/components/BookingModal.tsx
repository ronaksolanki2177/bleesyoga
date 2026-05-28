import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Mail, Phone, Sparkles, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { SessionPack, TIME_SLOTS } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPack: SessionPack | null;
  onBookingSuccess: (booking: any) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedPack,
  onBookingSuccess,
}: BookingModalProps) {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Registration / Contact info on booking screen
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('last_used_email') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState('');
  
  // Default to tomorrow
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getTomorrowDate());
  const [time, setTime] = useState(TIME_SLOTS[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

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

  useEffect(() => {
    if (!isOpen) {
      setJustRegistered(false);
    }
  }, [isOpen]);

  // Authentication Interface States
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState(() => {
    try {
      return localStorage.getItem('last_used_email') || '';
    } catch {
      return '';
    }
  });
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Sync session and initial details
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userEmail = user.email || '';
        setEmail(userEmail);
        setAuthEmail(userEmail);
        try {
          if (userEmail) {
            localStorage.setItem('last_used_email', userEmail);
          }
        } catch (e) {
          console.warn('Failed to access localStorage', e);
        }
        setName(user.displayName || '');
        // Load additional attributes from Firestore profile
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.name) setName(data.name);
            if (data.phone) setPhone(data.phone);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setEmail('');
        setAuthEmail('');
        try {
          localStorage.removeItem('last_used_email');
        } catch (e) {
          console.warn('Failed to clear localStorage', e);
        }
      }
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen || !selectedPack) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    const normalEmail = authEmail.trim().toLowerCase();
    const normalPassword = authPassword ?? '';
    try {
      if (!normalEmail || !normalPassword) {
        setAuthError('Email and password are required.');
        setIsAuthLoading(false);
        return;
      }

      if (normalEmail === 'akshayyoga1@gmail.com') {
        if (normalPassword !== 'akshay@123') {
          setAuthError('Incorrect password. Please verify the administrator credentials.');
          setIsAuthLoading(false);
          return;
        }
        try {
          await signInWithEmailAndPassword(auth, normalEmail, normalPassword);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            try {
              const cred = await createUserWithEmailAndPassword(auth, normalEmail, normalPassword);
              await updateProfile(cred.user, { displayName: 'Akshay Chotara' });
            } catch (createErr: any) {
              console.error('Error auto-creating admin bootstrap user in modal:', createErr);
              throw createErr;
            }
          } else {
            throw err;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, normalEmail, normalPassword);
      }

      // Clean states
      setAuthEmail('');
      setAuthPassword('');
      handleReset();
    } catch (err: any) {
      if (err.code?.startsWith('auth/')) {
        console.warn('Firebase Auth user exception:', err.code, err.message);
      } else {
        console.error(err);
      }
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password sign-in is not enabled in this Firebase console yet. Please enable it in the console, or use Google Login.";
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      if (!authName || !authEmail || !authPassword || !authPhone) {
        setAuthError('Please fill out all required profile registration fields.');
        setIsAuthLoading(false);
        return;
      }
      
      setJustRegistered(true);

      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: authName });

      // Save user profile securely to /users/{uid}
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: authName,
        email: authEmail,
        phone: authPhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Populate local modal input states
      setName(authName);
      setEmail(authEmail);
      setPhone(authPhone);
      
      // Clear inputs
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthPhone('');
    } catch (err: any) {
      setJustRegistered(false);
      if (err.code?.startsWith('auth/')) {
        console.warn('Firebase Auth user exception during register:', err.code, err.message);
      } else {
        console.error(err);
      }
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
      }
      let msg = err.message || 'An error occurred during account creation.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password must be at least 6 characters.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password registration is not enabled in this Firebase console yet. Please enable it under Auth Sign-in-method, or use Google Login.";
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create defaults
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Blees Yoga Practitioner',
          email: user.email || '',
          phone: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      handleReset();
    } catch (err: any) {
      if (err.code?.startsWith('auth/')) {
        console.warn('Firebase Google Auth exception:', err.code, err.message);
      } else {
        console.error(err);
      }
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
      }
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google login failed.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setResetSent(false);
    setIsAuthLoading(true);
    try {
      const emailToUse = (authEmail || email || '').trim();
      if (!emailToUse) {
        setAuthError('Please enter your email address to receive a secure reset link.');
        setIsAuthLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, emailToUse);
      setResetSent(true);
    } catch (err: any) {
      if (err.code?.startsWith('auth/')) {
        console.warn('Firebase Auth reset exception:', err.code, err.message);
      } else {
        console.error(err);
      }
      let msg = 'Failed to send password reset email. Please ensure the email is correct.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No practitioner account associated with this email matches our records.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'The email address format is invalid.';
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert('Please fill out all primary contact fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookingId = 'BL-' + Math.floor(100000 + Math.random() * 900000);
      
      const newBooking = {
        id: bookingId,
        userId: currentUser!.uid,
        packageName: selectedPack.sessions === 1 && selectedPack.id.includes('trial') 
          ? 'Trial Session' 
          : `${selectedPack.sessions} Sessions Pack`,
        sessions: selectedPack.sessions,
        price: selectedPack.price,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        selectedDate: date,
        selectedTime: time,
        status: 'confirmed' as const,
        bookingType: 'solo' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = doc(db, 'bookings', bookingId);
      await setDoc(docRef, newBooking);
      
      const localResult = {
        ...newBooking,
        createdAt: new Date().toISOString()
      };
      
      setConfirmedBooking(localResult);
      setIsSuccess(true);
      onBookingSuccess(localResult);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `bookings`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!confirmedBooking) return;
    const text = `Blees Yoga Booking Confirmation
ID: ${confirmedBooking.id}
Instructor: Akshay Chotara
Session: ${confirmedBooking.packageName} (Solo Private)
Date: ${confirmedBooking.selectedDate}
Time: ${confirmedBooking.selectedTime}
Name: ${confirmedBooking.clientName}
Price Paid: ${confirmedBooking.price === 0 ? 'FREE' : `₹${confirmedBooking.price.toLocaleString('en-IN')}`}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setConfirmedBooking(null);
    setAuthError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleReset}
          className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-cream border border-gold/20 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-gold/10 flex justify-between items-center bg-cream-dark">
            <div>
              <span className="text-[10px] font-sans font-semibold tracking-widest text-gold uppercase">
                {!currentUser || justRegistered ? 'Secure Portal Verification' : 'Solo Private Booking'}
              </span>
              <h3 className="text-xl font-serif text-charcoal font-medium mt-0.5">
                {justRegistered ? 'Success!' : (!currentUser 
                  ? (authMode === 'forgot' ? 'Reset Password' : authMode === 'signin' ? 'Sign In required' : 'Practitioner Register') 
                  : (isSuccess ? 'Booking Confirmed' : `Book ${selectedPack.sessions === 1 ? 'Trial Session' : `${selectedPack.sessions}-Session Pack`}`)
                )}
              </h3>
            </div>
            <button
              onClick={handleReset}
              className="p-1 px-1.5 rounded-full hover:bg-gold/10 transition-colors text-charcoal-light hover:text-charcoal"
              id="close-booking-modal-btn"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {justRegistered ? (
              /* BEAUTIFUL REGISTRATION SUCCESS VIEW */
              <div className="space-y-6 py-6 text-center">
                <div className="w-16 h-16 bg-gold/15 rounded-full flex items-center justify-center mx-auto text-gold animate-pulse">
                  <Sparkles size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-serif text-charcoal font-semibold">Welcome to Blees Yoga!</h4>
                  <p className="text-sm text-charcoal-light leading-relaxed max-w-sm mx-auto">
                    Your practitioner account has been successfully created. You are now logged in and can search, schedule, and sync your personalized yoga practice.
                  </p>
                </div>
                <div className="pt-4 max-w-md mx-auto">
                  <button
                    onClick={handleReset}
                    className="w-full bg-charcoal hover:bg-gold text-white font-bold py-3 px-6 rounded-xl transition-all font-sans text-xs uppercase tracking-widest cursor-pointer select-none shadow-sm"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ) : !currentUser ? (
              /* REQUIRED AUTH SCREEN PRIOR TO BOOKING */
              <div className="space-y-5">
                <div className="bg-gold/5 border border-gold/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-charcoal font-medium">
                    Please sign up or sign in to secure scheduling privileges and synchronize your sessions dashboard under a central practitioner profile.
                  </p>
                </div>

                {authError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 font-semibold leading-relaxed">
                    ⚠️ {authError}
                  </div>
                )}

                {resetSent && (
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-lg border border-emerald-200 font-medium leading-relaxed text-center">
                    ✨ A secure password reset link has been dispatched to <strong className="break-all">{authEmail}</strong>. Please check your spam/promotions folder if it doesn't arrive in a few moments.
                  </div>
                )}

                <form onSubmit={authMode === 'forgot' ? handleForgotPassword : (authMode === 'signin' ? handleSignIn : handleSignUp)} className="space-y-4">
                  {authMode === 'signup' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light block mb-1">Your Full Name *</label>
                          <input
                            type="text"
                            required
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Akshay Sharma"
                            className="w-full bg-white border border-gold/20 rounded-lg p-2.5 text-xs focus:border-gold focus:outline-none text-charcoal font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light block mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="+91 70434 74379"
                            className="w-full bg-white border border-gold/20 rounded-lg p-2.5 text-xs focus:border-gold focus:outline-none text-charcoal font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => {
                        setAuthEmail(e.target.value);
                        try {
                          localStorage.setItem('last_used_email', e.target.value);
                        } catch {}
                      }}
                      placeholder="john@gmail.com"
                      className="w-full bg-white border border-gold/20 rounded-lg p-2.5 text-xs focus:border-gold focus:outline-none text-charcoal font-medium"
                    />
                  </div>

                  {authMode !== 'forgot' && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light block">Password *</label>
                        {authMode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setAuthError(null);
                              setResetSent(false);
                              if (!authEmail && email) {
                                setAuthEmail(email);
                                try {
                                  localStorage.setItem('last_used_email', email);
                                } catch {}
                              }
                            }}
                            className="text-[10px] font-bold text-gold hover:underline focus:outline-none cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Enter the password"
                          autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                          className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pr-10 text-xs focus:border-gold focus:outline-none text-charcoal font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-charcoal-light hover:text-gold transition-colors focus:outline-none h-full flex items-center justify-center cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-charcoal hover:bg-gold text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 tracking-wider shadow-sm flex items-center justify-center space-x-2 text-xs uppercase disabled:opacity-50 cursor-pointer"
                  >
                    {isAuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{authMode === 'forgot' ? 'Sending Reset Link...' : 'Verifying Gateways...'}</span>
                      </>
                    ) : (
                      <span>
                        {authMode === 'forgot' 
                          ? 'SEND PASSWORD RESET EMAIL' 
                          : authMode === 'signin' 
                            ? 'AUTHENTICATE SIGN IN' 
                            : 'REGISTER PRACTITIONER'}
                      </span>
                    )}
                  </button>
                </form>

                {authMode !== 'forgot' && (
                  <>
                    <div className="flex items-center space-x-2 justify-between py-1">
                      <span className="h-px bg-gold/10 flex-1"></span>
                      <span className="text-[9px] font-bold tracking-wider text-gold/60 uppercase">EASY ALTERNATIVE</span>
                      <span className="h-px bg-gold/10 flex-1"></span>
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      type="button"
                      className="w-full bg-white hover:bg-cream-dark text-charcoal border border-gold/20 hover:border-gold py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.7 0 3.2.58 4.4 1.7l3.28-3.28A11.96 11.96 0 0 0 12 0C7.3 0 3.2 2.7 1.2 6.66l3.87 3A7.16 7.16 0 0 1 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.52 12.27c0-.82-.07-1.6-.2-2.37H12v4.48h6.47a5.53 5.53 0 0 1-2.4 3.63l3.73 2.9a11.95 11.95 0 0 0 3.72-8.64z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.07 14.66a7.12 7.12 0 0 1 0-5.32l-3.87-3A11.95 11.95 0 0 0 0 12c0 2.22.61 4.3 1.68 6.08l3.39-3.42z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.73-2.9c-1.12.75-2.56 1.2-4.22 1.2a7.16 7.16 0 0 1-6.93-4.63l-3.88 3A11.96 11.96 0 0 0 12 24z"
                        />
                      </svg>
                      <span>Quick Sign in with Google</span>
                    </button>
                  </>
                )}

                <div className="text-center font-sans text-xs">
                  {authMode === 'forgot' ? (
                    <p className="text-charcoal-light">
                      Remember your password?{' '}
                      <button onClick={() => { setAuthMode('signin'); setAuthError(null); setResetSent(false); }} className="text-gold underline font-bold cursor-pointer">
                        Sign in instead
                      </button>
                    </p>
                  ) : authMode === 'signin' ? (
                    <p className="text-charcoal-light">
                      New practitioner?{' '}
                      <button onClick={() => { setAuthMode('signup'); setAuthError(null); }} className="text-gold underline font-bold cursor-pointer">
                        Create user account
                      </button>
                    </p>
                  ) : (
                    <p className="text-charcoal-light">
                      Already registered?{' '}
                      <button onClick={() => { setAuthMode('signin'); setAuthError(null); }} className="text-gold underline font-bold cursor-pointer">
                        Sign in here
                      </button>
                    </p>
                  )}
                </div>
                
                <div className="text-center font-mono text-[9px] text-charcoal-light/40 leading-normal">
                  * Note: Please make sure 'Email/Password' authentication is enabled under Auth inside your Firebase console if using credentials.
                </div>
              </div>
            ) : !isSuccess ? (
              /* REAL SCHEDULE SELECTOR */
              <form onSubmit={handleSubmitBooking} className="space-y-5">
                {/* Package summary info banner */}
                <div className="bg-cream-dark/50 border border-gold/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-serif text-lg text-charcoal">
                      {selectedPack.sessions === 1 ? 'Single Trial Session' : `${selectedPack.sessions} Private Sessions`}
                    </h4>
                    <p className="text-xs text-charcoal-light mt-0.5">
                      Personalised one-to-one instruction with Akshay Chotara
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-serif font-semibold text-charcoal">
                      {selectedPack.price === 0 ? 'FREE' : `₹${selectedPack.price.toLocaleString('en-IN')}`}
                    </span>
                    <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                      {selectedPack.price === 0 ? 'Intro Assessment' : `₹${selectedPack.sessionPrice}/session`}
                    </p>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-light block mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-charcoal-light/60">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Akshay Sharma"
                        className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all text-charcoal font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-light block mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-charcoal-light/60">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            try {
                              localStorage.setItem('last_used_email', e.target.value);
                            } catch {}
                          }}
                          placeholder="john@gmail.com"
                          className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all text-charcoal font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-light block mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-charcoal-light/60">
                          <Phone size={16} />
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 70434 74379"
                          className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all text-charcoal font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gold/10 pt-3.5 my-2" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-light block mb-1">
                        Preferred Date *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-charcoal-light/60">
                          <Calendar size={16} />
                        </span>
                        <input
                          type="date"
                          required
                          min={getTomorrowDate()}
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all text-charcoal font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-light block mb-1">
                        Preferred Time Slot *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-charcoal-light/60">
                          <Clock size={16} />
                        </span>
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-white border border-gold/20 rounded-lg p-2.5 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all text-charcoal font-medium appearance-none"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-charcoal-light/70 bg-gold/5 py-2 rounded">
                  🛡️ Complete secure, no-obligation booking. We will coordinate details over call/email.
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-charcoal hover:bg-gold text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 tracking-wider shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                  id="confirm-booking-btn"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Securing Your Spot...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>CONFIRM & SCHEDULE BOOKING</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Success confirmation view */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                {/* Nice success icon */}
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <Check size={32} />
                </div>

                <div>
                  <h4 className="text-2xl font-serif text-charcoal font-semibold">Namaste, {name}!</h4>
                  <p className="text-sm text-charcoal-light mt-1.5 max-w-sm mx-auto">
                    Your request for private sessions has been scheduled. Akshay Chotara will connect with you shortly to finalize your custom progression layout.
                  </p>
                </div>

                {/* Ticket / receipt container */}
                <div className="border border-gold/15 bg-white rounded-xl shadow-sm text-left max-w-md mx-auto overflow-hidden">
                  <div className="bg-cream-dark p-3 px-4 flex justify-between items-center border-b border-gold/10">
                    <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">
                      OFFICIAL CONFIRMATION
                    </span>
                    <span className="font-mono text-xs font-semibold text-charcoal bg-white px-2 py-0.5 rounded border border-gold/10">
                      ID: {confirmedBooking?.id}
                    </span>
                  </div>

                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div>
                        <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">INSTRUCTOR</span>
                        <span className="font-medium text-charcoal">Akshay Chotara</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">SESSION</span>
                        <span className="font-medium text-charcoal">{confirmedBooking?.packageName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">DATE</span>
                        <span className="font-medium text-charcoal flex items-center gap-1">
                          <Calendar size={12} className="text-gold" /> {confirmedBooking?.selectedDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">TIME</span>
                        <span className="font-medium text-charcoal flex items-center gap-1">
                          <Clock size={12} className="text-gold" /> {confirmedBooking?.selectedTime}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gold/10 pt-3.5 mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">CLIENT</span>
                          <span className="font-medium text-charcoal">{confirmedBooking?.clientName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-charcoal-light uppercase tracking-wider block">TOTAL PRICE</span>
                          <span className="text-base font-serif font-semibold text-charcoal">
                            {confirmedBooking?.price === 0 ? 'FREE' : `₹${confirmedBooking?.price.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-sm mx-auto">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 bg-white border border-gold/20 hover:border-gold text-charcoal text-xs font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Booking Details</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex-1 bg-charcoal hover:bg-gold text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-all cursor-pointer"
                  >
                    Return to Studio Home
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

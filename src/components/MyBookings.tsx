import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Trash2, X, AlertCircle, ShoppingBag, Eye, CreditCard } from 'lucide-react';
import { Booking } from '../types';

interface MyBookingsProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
}

export default function MyBookings({
  isOpen,
  onClose,
  bookings,
  onCancelBooking,
}: MyBookingsProps) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

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

        {/* Drawer slide panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="bg-cream border-l border-gold/15 shadow-2xl max-w-md w-full h-full relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-gold/10 flex justify-between items-center bg-cream-dark">
            <div>
              <h3 className="text-xl font-serif text-charcoal font-semibold">Your Private Bookings</h3>
              <p className="text-xs text-charcoal-light mt-0.5">Manage your scheduled sessions</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-1.5 rounded-full hover:bg-gold/10 transition-colors text-charcoal-light hover:text-charcoal"
              id="close-my-bookings-btn"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core scrollable booking list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 bg-cream-dark border border-gold/10 rounded-full flex items-center justify-center mx-auto text-gold animate-pulse">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="font-serif text-lg text-charcoal font-medium">No bookings yet</p>
                  <p className="text-xs text-charcoal-light max-w-xs mx-auto mt-1">
                    Book a trial session or pick a session pack below to start your yoga practice with Akshay!
                  </p>
                </div>
              </div>
            ) : (
              bookings.map((booking) => {
                return (
                  <motion.div
                    key={booking.id}
                    layoutId={`booking-${booking.id}`}
                    className="border border-gold/15 bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <div className="bg-cream-dark/50 p-3 px-4 border-b border-gold/5 flex justify-between items-center text-xs">
                      <span className="font-mono font-semibold text-charcoal bg-white border border-gold/10 px-1.5 py-0.5 rounded">
                        ID: {booking.id}
                      </span>
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

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-serif text-base text-charcoal font-medium">
                          {booking.packageName}
                        </h4>
                        <p className="text-[11px] text-charcoal-light mt-0.5">
                          Solo Private Session with Akshay Chotara
                        </p>
                      </div>

                      {/* Date details */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-dashed border-gold/10 bg-cream/30 px-2 rounded-lg">
                        <div className="flex items-center gap-1.5 text-charcoal">
                          <Calendar size={13} className="text-gold" />
                          <span className="font-medium">{booking.selectedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-charcoal">
                          <Clock size={13} className="text-gold" />
                          <span className="font-medium">{booking.selectedTime}</span>
                        </div>
                      </div>

                      {/* Info lines (client/friend) */}
                      <div className="text-[11px] space-y-1 text-charcoal-light">
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-medium text-charcoal">{booking.clientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span className="text-charcoal">{booking.clientPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="text-charcoal select-all">{booking.clientEmail}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gold/5 mt-1 font-medium text-charcoal">
                          <span className="flex items-center gap-1"><CreditCard size={11} className="text-gold" /> Amount Paid:</span>
                          <span>{booking.price === 0 ? 'FREE' : `₹${booking.price.toLocaleString('en-IN')}`}</span>
                        </div>
                      </div>

                      {/* Cancel btn or Confirmation segment */}
                      {booking.status !== 'cancelled' && (
                        <div className="pt-2">
                          {confirmCancelId === booking.id ? (
                            <div className="bg-red-50/70 border border-red-200/50 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                              <span className="text-[11px] text-red-700 font-medium">Cancel this session registration?</span>
                              <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => setConfirmCancelId(null)}
                                  className="px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded text-charcoal hover:bg-cream transition-colors font-semibold cursor-pointer"
                                >
                                  No, Keep
                                </button>
                                <button
                                  onClick={() => {
                                    onCancelBooking(booking.id);
                                    setConfirmCancelId(null);
                                  }}
                                  className="px-2.5 py-1 text-[11px] bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-semibold cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 size={11} />
                                  Yes, Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  setConfirmCancelId(booking.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1 transition-all font-sans cursor-pointer animate-fade-in"
                                title="Cancel Registration"
                              >
                                <Trash2 size={13} />
                                <span>Cancel Registration</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="p-5 bg-cream px-6 border-t border-gold/10">
            <button
              onClick={onClose}
              className="w-full bg-charcoal hover:bg-gold text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm cursor-pointer"
            >
              Close Menu
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

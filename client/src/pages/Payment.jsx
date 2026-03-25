import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreditCard, Landmark, Receipt, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

function formatDuration(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return '1 hour';
  if (h < 1) return `${Math.round(h * 60)} minutes`;
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'}`;
  const days = Math.round((h / 24) * 100) / 100;
  return `${days} day${days === 1 ? '' : 's'}`;
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [rememberPayment, setRememberPayment] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bookingDraft = useMemo(() => {
    if (!state) return null;
    if (state.engineerId !== id) return null;
    if (!state.datetime || !state.durationHours) return null;
    return {
      engineerId: state.engineerId,
      engineerName: state.engineerName || 'Engineer',
      profession: state.profession || '',
      datetime: state.datetime,
      durationHours: Number(state.durationHours) || 1,
      hourlyRate: state.hourlyRate != null ? Number(state.hourlyRate) : null,
      avatarUrl: state.avatarUrl || '',
    };
  }, [id, state]);

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || profile?.role !== 'client') {
    return <Navigate to={`/engineers/${id}`} replace />;
  }

  if (!bookingDraft) {
    return <Navigate to={`/engineers/${id}`} replace />;
  }

  const totalAmount =
    bookingDraft.hourlyRate != null
      ? Math.round(bookingDraft.durationHours * bookingDraft.hourlyRate * 100) / 100
      : 0;

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'card') {
      if (!cardName.trim()) return setError('Enter the cardholder name.');
      if (cardNumber.replace(/\s/g, '').length < 16) return setError('Enter a valid 16-digit card number.');
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return setError('Enter expiry as MM/YY.');
      if (cvc.trim().length < 3) return setError('Enter a valid CVC.');
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          engineer_id: bookingDraft.engineerId,
          datetime: new Date(bookingDraft.datetime).toISOString(),
          duration_hours: bookingDraft.durationHours,
        }),
      });

      navigate('/bookings', {
        replace: true,
        state: {
          paymentSuccess: true,
          bookingId: res.booking?.id,
          engineerName: bookingDraft.engineerName,
          amount: totalAmount,
          paymentMethod,
          rememberPayment,
        },
      });
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Demo checkout</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pay and confirm consultation</h1>
          </div>
          <Link
            to={`/engineers/${id}`}
            state={state}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to engineer
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-xl">
          <div className="grid lg:grid-cols-[1.05fr_1.35fr]">
            <section className="bg-[#eef2ff] px-6 py-8 sm:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-lg font-bold text-white shadow-md">
                  B
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-900">Buildwise</p>
                  <p className="text-sm text-indigo-700/80">Consultation checkout</p>
                </div>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 text-sm text-indigo-700">
                <Receipt className="h-4 w-4" />
                Demo payment summary
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{bookingDraft.engineerName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {bookingDraft.profession || 'Engineering consultation'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {new Date(bookingDraft.datetime).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {bookingDraft.avatarUrl ? (
                    <img
                      src={bookingDraft.avatarUrl}
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-bold text-indigo-500 ring-2 ring-white">
                      {bookingDraft.engineerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-y border-indigo-100 py-6">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Duration</span>
                    <span>{formatDuration(bookingDraft.durationHours)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Rate</span>
                    <span>
                      {bookingDraft.hourlyRate != null ? `$${bookingDraft.hourlyRate.toFixed(2)}/hr` : 'Set by engineer'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Payment method</span>
                    <span>{paymentMethod === 'card' ? 'Credit or debit card' : 'Cash / bank transfer'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-4xl font-bold tracking-tight text-indigo-950">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 text-sm text-slate-600">
                  The payment is demo-only. Completing it will immediately create the consultation request for this engineer.
                </div>
              </div>
            </section>

            <section className="px-6 py-8 sm:px-10">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                    paymentMethod === 'card'
                      ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  Credit or Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                    paymentMethod === 'cash'
                      ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200'
                  }`}
                >
                  <Landmark className="h-5 w-5" />
                  Cash / Bank Transfer
                </button>
              </div>

              <form onSubmit={handlePay} className="mt-8 space-y-5">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {paymentMethod === 'card' ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Cardholder&apos;s Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="PAULINA CHIMAROKE"
                        className="w-full rounded-2xl border border-violet-100 bg-slate-50 px-5 py-4 text-base uppercase tracking-wide text-violet-700 outline-none transition focus:border-violet-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Card Number</label>
                      <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-slate-50 px-5 py-4 transition focus-within:border-violet-400 focus-within:bg-white">
                        <div className="flex items-center gap-1">
                          <span className="h-6 w-6 rounded-full bg-red-500" />
                          <span className="-ml-2 h-6 w-6 rounded-full bg-amber-400 opacity-90" />
                        </div>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="9870 3456 7890 6473"
                          className="w-full bg-transparent text-base tracking-[0.18em] text-violet-700 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Expiry</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="03/25"
                          className="w-full rounded-2xl border border-violet-100 bg-slate-50 px-5 py-4 text-base text-violet-700 outline-none transition focus:border-violet-400 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">CVC</label>
                        <input
                          type="text"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="654"
                          className="w-full rounded-2xl border border-violet-100 bg-slate-50 px-5 py-4 text-base text-violet-700 outline-none transition focus:border-violet-400 focus:bg-white"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={rememberPayment}
                        onChange={(e) => setRememberPayment(e.target.checked)}
                        className="h-4 w-4 rounded border-violet-200 text-violet-600 focus:ring-violet-500"
                      />
                      Remember card for demo checkout
                    </label>
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/60 p-6">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-violet-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Cash or transfer demo mode</h2>
                        <p className="mt-2 text-sm text-gray-600">
                          This option simulates a manual payment. When you confirm, Buildwise will immediately create the consultation request and mark this demo checkout as complete.
                        </p>
                        <p className="mt-3 text-sm text-gray-500">
                          Bring payment proof or settle directly with the engineer during the consultation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Processing payment…' : paymentMethod === 'card' ? 'Pay Now' : 'Confirm and book'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

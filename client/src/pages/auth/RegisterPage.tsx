import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, Hash, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'seller'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hostelRoom, setHostelRoom] = useState('');
  const [storeSlug, setStoreSlug] = useState('college-canteen');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const user = await register({
        name,
        email,
        password,
        role,
        phone,
        studentId: role === 'student' ? studentId : undefined,
        hostelRoom: role === 'student' ? hostelRoom : undefined,
        storeSlug: role === 'seller' ? storeSlug : undefined
      });

      if (user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6 pb-16">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-emerald-600/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 brand-font">Join VenderSetu</h1>
          <p className="text-xs text-slate-500">Register as a Student or Store Merchant</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Role toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              role === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🎓 College Student
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              role === 'seller' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🏪 Store Merchant
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@campus.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {role === 'student' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Student Roll / ID Number</label>
                <input
                  type="text"
                  placeholder="CS2023-048"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Hostel & Room Number</label>
                <input
                  type="text"
                  placeholder="Aryabhatta Hostel, Room B-312"
                  value={hostelRoom}
                  onChange={(e) => setHostelRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Assign to Campus Store</label>
              <select
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="college-canteen">College Canteen</option>
                <option value="durga-fast-food">Durga Fast Food</option>
                <option value="monal-fast-food">Monal Fast Food</option>
                <option value="bhandari-general-store">Bhandari General Store</option>
                <option value="devbhoomi-general-store">Devbhoomi General Store</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-emerald-600/20"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

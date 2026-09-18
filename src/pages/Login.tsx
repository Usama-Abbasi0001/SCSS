import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required')
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setLoading(true);
        await login(values.email, values.password);
        navigate('/dashboard');
      } catch (err: any) {
        setError('Failed to login. Please check your credentials.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4 backdrop-blur-sm border border-blue-500/30">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-white mb-2">Smart Campus Safety System</h1>
          <p className="text-gray-400">Secure Login Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  {...formik.getFieldProps('email')}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-400">{formik.errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  {...formik.getFieldProps('password')}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter your password"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-400">{formik.errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-t-white border-slate-700 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center mb-4">Demo Accounts for Reviewers</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue('email', 'admin@demo.com');
                  formik.setFieldValue('password', 'admin123');
                }}
                className="py-2 px-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 border border-white/10 hover:border-blue-500/30 rounded-lg text-xs text-gray-300 transition-all"
              >
                <div className="font-semibold">Admin</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue('email', 'student@demo.com');
                  formik.setFieldValue('password', 'student123');
                }}
                className="py-2 px-2 bg-white/5 hover:bg-green-500/20 hover:text-green-400 border border-white/10 hover:border-green-500/30 rounded-lg text-xs text-gray-300 transition-all"
              >
                <div className="font-semibold">Student</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue('email', 'parent@demo.com');
                  formik.setFieldValue('password', 'parent123');
                }}
                className="py-2 px-2 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 border border-white/10 hover:border-purple-500/30 rounded-lg text-xs text-gray-300 transition-all"
              >
                <div className="font-semibold">Parent</div>
              </button>
            </div>
            <div className="mt-3 text-[11px] text-gray-500 text-center">
              Click a role above to auto-fill dummy credentials
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-8">
          Protected by Smart Campus Safety System
        </p>
      </div>
    </div>
  );
}

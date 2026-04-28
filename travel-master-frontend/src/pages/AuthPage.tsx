import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { login, register, setAccessToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isLogin 
        ? await login({ account: email, password })
        : await register({ email, password, nickname });
      
      setAccessToken(res.accessToken);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || '身份验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-100/50 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass card-shadow-lg rounded-3xl p-8 z-10 relative"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl premium-gradient text-white mb-4 shadow-lg shadow-indigo-200"
          >
            <Sparkles size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isLogin ? '欢迎回来' : '开启旅程'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {isLogin ? '使用您的账号登录 TravelMaster Pro' : '加入全球最智能的旅游规划社交平台'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="您的昵称"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              placeholder="邮箱地址"
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              required
              placeholder="您的密码"
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-500 text-xs font-medium px-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full premium-gradient text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? '处理中...' : (isLogin ? '立即登录' : '立即注册')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">
            {isLogin ? '还没有账号？' : '已经有账号？'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-indigo-600 font-semibold hover:underline"
            >
              {isLogin ? '立即创建' : '点击登录'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Floating Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-slate-400">
        <div className="flex items-center gap-2 text-xs font-medium">
          <MapPin size={14} /> Amap MCP 支持
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Sparkles size={14} /> 阿里云百炼驱动
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

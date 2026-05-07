import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, MapPin } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-main)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-sm w-full apple-card p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--primary)' }}>
            <MapPin size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            {isLogin ? '欢迎回来' : '创建账号'}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? '登录以继续使用 TravelMaster' : '开始您的智能旅行规划'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="昵称"
                  className="w-full pl-10 pr-4 py-3 text-sm"
                  style={{ background: 'var(--border-light)', border: '1px solid transparent', borderRadius: 12, outline: 'none' }}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <Mail size={16} />
            </div>
            <input
              type="email"
              required
              placeholder="邮箱地址"
              className="w-full pl-10 pr-4 py-3 text-sm"
              style={{ background: 'var(--border-light)', border: '1px solid transparent', borderRadius: 12, outline: 'none' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <Lock size={16} />
            </div>
            <input
              type="password"
              required
              placeholder="密码"
              className="w-full pl-10 pr-4 py-3 text-sm"
              style={{ background: 'var(--border-light)', border: '1px solid transparent', borderRadius: 12, outline: 'none' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium px-1"
              style={{ color: '#FF3B30' }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 apple-btn-primary text-sm flex items-center justify-center gap-2 mt-4"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? '没有账号？' : '已有账号？'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium"
              style={{ color: 'var(--primary)' }}
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

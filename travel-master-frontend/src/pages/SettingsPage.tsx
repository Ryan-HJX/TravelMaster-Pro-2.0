import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, FileText, Tag, Save, ArrowLeft, Camera } from 'lucide-react';
import { getMe, updateProfile, type UserProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then(data => {
      setUser(data);
      setNickname(data.nickname);
      setPhone(data.phone || '');
      setBio(data.bio || '');
      setTags(data.preferenceTags || []);
      setLoading(false);
    }).catch(() => navigate('/auth'));
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updated = await updateProfile({
        nickname,
        phone,
        bio,
        preferenceTags: tags
      });
      setUser(updated);
      setMessage({ type: 'success', text: '个人资料已更新成功！' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败，请检查网络后再试。' });
    } finally {
      setSaving(false);
    }
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.button 
          whileHover={{ x: -4 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-medium transition-colors"
        >
          <ArrowLeft size={20} /> 返回工作台
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="bg-indigo-600 px-8 py-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <User size={120} />
            </div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 relative">
                <User size={48} />
                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.nickname}</h2>
                <p className="text-indigo-100 mt-1">{user?.email}</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white backdrop-blur-sm">
                  {user?.membershipTier} / Lv.{user?.level}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User size={20} className="text-indigo-600" /> 基本信息
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">昵称</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">手机号码</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="绑定手机号以获得更好的服务"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" /> 个人简介
                </h3>
                <textarea 
                  rows={4}
                  placeholder="向世界介绍一下你自己..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Tag size={20} className="text-indigo-600" /> 旅行偏好标签
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-indigo-100">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">×</button>
                    </span>
                  ))}
                </div>
                <form onSubmit={addTag} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="添加标签（如：自驾游、摄影）"
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium">添加</button>
                </form>
              </section>
            </div>

            {message.text && (
              <div className={`mt-8 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {message.text}
              </div>
            )}

            <div className="mt-12 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3 premium-gradient text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? '正在保存...' : <><Save size={20} /> 保存更改</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;

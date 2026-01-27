import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, ClipboardList, User, Plus, MapPin, X, Construction, Car, Trees, 
  FileText, LogOut, Camera, Loader2, Building2, Trash2, ChevronRight, 
  ArrowLeft, Globe, BarChart2 // <-- DÜZELTİLDİ: BarChart3 yerine BarChart2
} from 'lucide-react';
import { UserRole, View, Complaint, Category } from './types';

// --- Yardımcı Bileşenler ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: any = {
    'Beklemede': 'bg-gray-100 text-gray-700 border-gray-200',
    'İnceleniyor': 'bg-blue-100 text-blue-700 border-blue-200',
    'İşlemde': 'bg-amber-100 text-amber-700 border-amber-200',
    'Çözüldü': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Reddedildi': 'bg-red-100 text-red-700 border-red-200',
  };
  const style = styles[status] || styles['Beklemede'];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>{status ? status.toUpperCase() : 'BELİRSİZ'}</span>;
};

// --- LOGIN EKRANI ---
const LoginScreen: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm z-10 text-center border border-zinc-100">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner"><img src="/logo.png" className="w-16 h-16 object-contain" alt="Logo" /></div>
        <h1 className="text-2xl font-black text-blue-900 mb-2">KentSesi</h1>
        <p className="text-zinc-500 text-sm mb-8">Şehrin yönetimine katıl, sesini duyur.</p>
        <div className="space-y-3">
          <button onClick={() => onLogin('VATANDAS')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"><User size={20} /> Vatandaş Girişi</button>
          <button onClick={() => onLogin('BELEDIYE_YETKILISI')} className="w-full py-4 bg-white border-2 border-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-3"><Building2 size={20} /> Yetkili Girişi</button>
        </div>
      </div>
    </div>
  );
};

// --- RAPOR MODALI ---
const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState<Category | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState<any>({ title: '', description: '', plate: '', location: '' });

  const handleGetLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setFormData((prev: any) => ({ ...prev, location: 'Caddebostan, Bağdat Cd. No:342, 34728 Kadıköy/İstanbul' }));
      setIsLocating(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const categories: { id: Category; icon: any; label: string }[] = [
    { id: 'Trafik', icon: Car, label: 'Trafik' }, { id: 'İnşaat', icon: Construction, label: 'İnşaat' },
    { id: 'Belediye Hizmetleri', icon: Trees, label: 'Belediye' }, { id: 'Diğer', icon: FileText, label: 'Diğer' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 bg-white z-50">
        <button onClick={onClose} className="p-2 text-zinc-400"><X /></button><h2 className="font-bold text-lg text-blue-900">Şikayet Girişi</h2><div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2"><label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><MapPin size={14} /> Konum</label>{!formData.location && (<button onClick={handleGetLocation} disabled={isLocating} className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">{isLocating ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />} Bul</button>)}</div>
          <textarea value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Adres..." className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm h-16 resize-none" />
        </div>
        <div className="grid grid-cols-4 gap-2">{categories.map(cat => (<button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${category === cat.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400'}`}><cat.icon size={20} /><span className="text-[10px] font-bold text-center leading-tight">{cat.label}</span></button>))}</div>
        {category && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-4"><div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden relative">{selectedFile ? <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" /> : <Camera size={20} />}</div><div className="flex-1 min-w-0"><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fotoğraf</label><input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" /></div></div>
            {category === 'Trafik' && (<div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Plaka No</label><input className="w-full h-12 bg-zinc-100 border border-zinc-200 rounded-xl px-4 text-sm font-mono outline-none" onChange={e => setFormData({...formData, plate: e.target.value})} /></div>)}
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Başlık</label><input className="w-full h-12 bg-zinc-100 border border-zinc-200 rounded-xl px-4 text-sm outline-none" onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Açıklama</label><textarea className="w-full h-32 bg-zinc-100 border border-zinc-200 rounded-2xl p-4 text-sm outline-none resize-none" onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-zinc-100 mb-safe"><button disabled={!category || !formData.title || !formData.location} onClick={() => onSubmit({ ...formData, category, file: selectedFile })} className="w-full h-14 bg-blue-700 text-white font-bold rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 transition-all">Kaydet</button></div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<string>('HOME'); 
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState("https://i.pravatar.cc/150?u=user");

  // Veri Çekme
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/complaints/');
      if(!response.ok) throw new Error("Backend hatası");
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        image: item.image_url, 
        userName: item.user_name || 'Anonim Kullanıcı',
        userAvatar: 'https://i.pravatar.cc/150',
        createdAt: new Date(item.created_at).toLocaleDateString('tr-TR'),
        isMyReport: (item.user_name || 'Anonim Kullanıcı') === 'Anonim Kullanıcı' 
      }));
      setComplaints(formattedData);
    } catch (error) { console.log("Hata:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if(role) fetchComplaints(); }, [role]);

  // Rapor Ekleme
  const handleAddReport = async (data: any) => {
    let finalImageUrl = "https://images.unsplash.com/photo-1518173946687-a4c8a9b749f5"; 
    try {
        if(data.file) {
            const formData = new FormData(); formData.append('file', data.file);
            const upRes = await fetch('http://127.0.0.1:8000/upload/', { method: 'POST', body: formData });
            if(upRes.ok) { const json = await upRes.json(); finalImageUrl = json.url; }
        }
        const payload = { ...data, image_url: finalImageUrl };
        await fetch('http://127.0.0.1:8000/complaints/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        
        setIsReportModalOpen(false);
        fetchComplaints(); 
        alert("Rapor başarıyla oluşturuldu!");
    } catch (e) { alert("Hata oluştu."); }
  };

  // SİLME İŞLEMİ
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    if(!confirm("Bu şikayeti silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/complaints/${id}`, { method: 'DELETE' });
      if(res.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id));
        if(selectedComplaint?.id === id) setSelectedComplaint(null);
        alert("Şikayet silindi.");
      } else {
        alert("Silinemedi.");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  // İstatistikler
  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Çözüldü').length;
    const plateCounts: Record<string, number> = {};
    complaints.forEach(c => { if(c.plate) plateCounts[c.plate] = (plateCounts[c.plate] || 0) + 1; });
    const topPlates = Object.entries(plateCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    return { total, resolved, topPlates };
  }, [complaints]);

  if (!role) return <LoginScreen onLogin={(r) => { setRole(r); setView(r === 'VATANDAS' ? 'AKIS' : 'DASHBOARD'); }} />;

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-zinc-400">Yükleniyor...</div>;

    // VATANDAŞ EKRANLARI
    if (role === 'VATANDAS') {
        if (view === 'AKIS') return (
            <div className="p-4 space-y-6">
                <button onClick={() => setIsReportModalOpen(true)} className="w-full h-16 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold active:scale-[0.98] transition-transform"><Plus size={24} /> Yeni Sorun Bildir</button>
                {complaints.map(c => (
                    <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm mb-4">
                         <div className="relative aspect-video">
                            <img src={c.image} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Resim+Yok'; }} />
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] font-bold flex items-center gap-1"><MapPin size={10} /> {c.location || 'Konum Yok'}</div>
                        </div>
                        <div className="p-3"><div className="flex justify-between items-start"><h4 className="font-bold text-sm text-zinc-900">{c.title}</h4><StatusBadge status={c.status} /></div></div>
                    </div>
                ))}
            </div>
        );
        if (view === 'LISTE') return (
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">Şikayetlerim</h2>
                {complaints.filter(c => c.isMyReport).length === 0 ? <div className="text-center text-zinc-400">Kaydınız yok.</div> :
                 complaints.filter(c => c.isMyReport).map(c => (
                    <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white p-4 rounded-2xl border border-zinc-200 flex gap-4 shadow-sm relative group">
                        <img src={c.image} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100'; }} />
                        <div className="flex-1"><div className="flex justify-between mb-1"><StatusBadge status={c.status} /><span className="text-[10px] text-zinc-400">#{c.id.slice(0,4)}</span></div><h4 className="font-bold text-sm truncate">{c.title}</h4></div>
                        <button onClick={(e) => handleDelete(c.id, e)} className="absolute bottom-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"><Trash2 size={16} /></button>
                    </div>
                 ))}
            </div>
        );
    }
    
    // YETKİLİ EKRANLARI
    if (role === 'BELEDIYE_YETKILISI' && view === 'DASHBOARD') return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-zinc-900">Genel Bakış</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm"><div className="text-zinc-400 text-xs font-bold uppercase">Bu Ay</div><div className="text-3xl font-black text-blue-600">{stats.total}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm"><div className="text-zinc-400 text-xs font-bold uppercase">Çözülen</div><div className="text-3xl font-black text-emerald-500">{stats.resolved}</div></div>
            </div>
        </div>
    );
    if (role === 'BELEDIYE_YETKILISI' && view === 'LISTE') return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Liste</h2>
            {complaints.map(c => (
                <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white p-4 rounded-2xl border border-zinc-200 flex gap-4 shadow-sm relative"><div className="flex-1"><div className="flex justify-between mb-1"><StatusBadge status={c.status} /></div><h4 className="font-bold text-sm truncate">{c.title}</h4></div><ChevronRight className="text-zinc-300 self-center" /></div>
            ))}
        </div>
    );

    if (view === 'PROFIL') return (
        <div className="p-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 flex flex-col items-center text-center shadow-sm">
                <div className="relative w-24 h-24 mb-4"><div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden ring-2 ring-blue-500"><img src={userAvatar} className="w-full h-full object-cover" /></div><label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg"><Camera size={16} /></label><input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setUserAvatar(URL.createObjectURL(e.target.files[0]))} /></div>
                <h2 className="text-xl font-bold text-zinc-900">{role === 'VATANDAS' ? 'Ahmet Yılmaz' : 'Kadıköy Belediyesi'}</h2>
            </div>
            <button onClick={() => { setRole(null); setView('HOME'); }} className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50"><div className="flex items-center gap-3"><LogOut size={18} /> Çıkış Yap</div></button>
        </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col shadow-2xl relative">
      <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10"><div className="flex items-center gap-2"><img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" /><span className="font-bold text-blue-900 tracking-tight">KentSesi</span></div>{role && (<div className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 flex items-center gap-1"><Globe size={10} /> {role === 'VATANDAS' ? 'İSTANBUL' : 'YÖNETİM'}</div>)}</header>
      <main className="flex-1 overflow-y-auto pb-24">{renderContent()}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 pb-safe max-w-md mx-auto flex h-16">
        {role === 'VATANDAS' ? (
            <>
                <button onClick={() => setView('AKIS')} className={`flex-1 flex flex-col items-center justify-center ${view === 'AKIS' ? 'text-blue-700' : 'text-zinc-400'}`}><Home size={20} /><span className="text-[10px] font-bold mt-1">Akış</span></button>
                <button onClick={() => setView('LISTE')} className={`flex-1 flex flex-col items-center justify-center ${view === 'LISTE' ? 'text-blue-700' : 'text-zinc-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold mt-1">Şikayetlerim</span></button>
                <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center ${view === 'PROFIL' ? 'text-blue-700' : 'text-zinc-400'}`}><User size={20} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
            </>
        ) : (
            <>
             <button onClick={() => setView('DASHBOARD')} className={`flex-1 flex flex-col items-center justify-center ${view === 'DASHBOARD' ? 'text-blue-700' : 'text-zinc-400'}`}><BarChart2 size={20} /><span className="text-[10px] font-bold mt-1">Panel</span></button>
             <button onClick={() => setView('LISTE')} className={`flex-1 flex flex-col items-center justify-center ${view === 'LISTE' ? 'text-blue-700' : 'text-zinc-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold mt-1">Liste</span></button>
             <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center ${view === 'PROFIL' ? 'text-blue-700' : 'text-zinc-400'}`}><User size={20} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
            </>
        )}
      </nav>
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleAddReport} />
      
      {selectedComplaint && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right duration-300">
             <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 bg-white shadow-sm"><button onClick={() => setSelectedComplaint(null)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full"><ArrowLeft /></button><span className="text-xs font-bold text-zinc-500">DETAY #{selectedComplaint.id.slice(0,4)}</span>
             {selectedComplaint.isMyReport && <button onClick={() => handleDelete(selectedComplaint.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>}
             </div>
            <div className="flex-1 overflow-y-auto"><img src={selectedComplaint.image} className="w-full aspect-video object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Resim+Yok'; }} /><div className="p-5 space-y-4"><h1 className="text-2xl font-bold text-zinc-900">{selectedComplaint.title}</h1><p className="text-zinc-600">{selectedComplaint.description}</p></div></div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, ClipboardList, User, Plus, MapPin, X, Car, 
  FileText, LogOut, Camera, Loader2, Building2, Trash2, ChevronRight, 
  ArrowLeft, Globe, BarChart2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { UserRole, Complaint } from './types';

// --- TİP TANIMLARI ---
interface Vehicle {
    id: number;
    plate: string;
    serial_no: string;
}

// --- LOGO BİLEŞENİ (DİREKT BURAYA EKLENDİ) ---
const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="32" width="448" height="448" rx="128" fill="url(#grad1)" />
      <path d="M256 128C202.9 128 160 170.9 160 224C160 296 256 384 256 384C256 384 352 296 352 224C352 170.9 309.1 128 256 128Z" fill="white" />
      <circle cx="256" cy="224" r="48" fill="#DC2626" />
      <path d="M384 128C401.7 145.7 416 182 416 224C416 266 401.7 302.3 384 320" stroke="white" strokeWidth="24" strokeLinecap="round" strokeOpacity="0.6"/>
      <path d="M128 128C110.3 145.7 96 182 96 224C96 266 110.3 302.3 128 320" stroke="white" strokeWidth="24" strokeLinecap="round" strokeOpacity="0.6"/>
      <defs>
        <linearGradient id="grad1" x1="32" y1="32" x2="480" y2="480" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E40AF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// --- YARDIMCI FONKSİYONLAR ---

// 1. PLAKA KONTROLÜ
const formatAndValidatePlate = (text: string) => {
  let clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 8) clean = clean.slice(0, 8);
  const regex2Letter = /^[0-9]{2}[A-Z]{2}[0-9]{4}$/; 
  const regex3Letter = /^[0-9]{2}[A-Z]{3}[0-9]{3}$/; 
  const isValid = regex2Letter.test(clean) || regex3Letter.test(clean);
  return { value: clean, isValid };
};

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
        <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner"><Logo className="w-16 h-16" /></div>
        <h1 className="text-2xl font-black text-blue-900 mb-2">KentSesi</h1>
        <p className="text-zinc-500 text-sm mb-8">Trafik ihlallerini anında bildir.</p>
        <div className="space-y-3">
          <button onClick={() => onLogin('VATANDAS')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"><User size={20} /> Vatandaş Girişi</button>
          <button onClick={() => onLogin('BELEDIYE_YETKILISI')} className="w-full py-4 bg-white border-2 border-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-3"><Building2 size={20} /> Kurumsal Giriş</button>
        </div>
      </div>
    </div>
  );
};

// --- ARAÇ KAYIT MODALI (BACKEND BAĞLANTILI) ---
const VehicleModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({ isOpen, onClose, onRefresh }) => {
  const [plate, setPlate] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [serialNo, setSerialNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = formatAndValidatePlate(e.target.value);
    setPlate(result.value);
    setIsValid(result.isValid);
  };

  const handleSubmit = async () => {
    if(!isValid || serialNo.length < 5) return alert("Bilgileri kontrol ediniz.");
    setLoading(true);
    try {
        const response = await fetch('https://kentinsesi.onrender.com/vehicles/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plate, serial_no: serialNo })
        });
        if (response.ok) {
            alert("Araç Başarıyla Kaydedildi!");
            setPlate(''); setSerialNo('');
            onRefresh(); 
            onClose();
        } else {
            const err = await response.json();
            alert("Hata: " + (err.detail || "Kaydedilemedi"));
        }
    } catch (e) { alert("Sunucu hatası."); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg">Kurumsal Araç Kaydı</h2><button onClick={onClose}><X /></button></div>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Plaka</label>
                <input value={plate} onChange={handlePlateChange} placeholder="34AB1234" className={`w-full h-12 border-2 rounded-xl px-4 font-mono text-lg uppercase ${isValid ? 'border-green-500 bg-green-50' : 'border-zinc-200'}`} />
                {!isValid && plate.length > 0 && <p className="text-[10px] text-red-500 mt-1">Geçersiz Plaka Formatı</p>}
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Ruhsat Seri / No</label>
                <input value={serialNo} onChange={e => setSerialNo(e.target.value)} placeholder="AB123456" className="w-full h-12 border border-zinc-200 rounded-xl px-4" />
            </div>
            <button disabled={!isValid || !serialNo || loading} onClick={handleSubmit} className="w-full h-12 bg-blue-900 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : "Kaydet"}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- RAPOR MODALI ---
const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState<any>({ title: '', description: '', plate: '', location: '' });
  const [isPlateValid, setIsPlateValid] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) { alert("Tarayıcı desteklemiyor."); setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                setFormData((prev: any) => ({ ...prev, location: data.display_name || `${latitude}, ${longitude}` }));
            } catch (error) { setFormData((prev: any) => ({ ...prev, location: `${latitude}, ${longitude}` })); }
            setIsLocating(false);
        },
        () => { alert("Konum alınamadı."); setIsLocating(false); }
    );
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = formatAndValidatePlate(e.target.value);
    setFormData({ ...formData, plate: result.value });
    setIsPlateValid(result.isValid);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 bg-white z-50">
        <button onClick={onClose} className="p-2 text-zinc-400"><X /></button><h2 className="font-bold text-lg text-blue-900">Trafik İhlal Bildirimi</h2><div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
             <div className="w-16 h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden relative">
               {selectedFile ? <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" /> : <Camera size={24} />}
             </div>
             <div className="flex-1 min-w-0">
               <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Kanıt Fotoğrafı</label>
               <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-100 file:text-blue-700 cursor-pointer" />
             </div>
           </div>
           <div className="space-y-1">
             <label className="text-xs font-bold text-zinc-500 uppercase">Araç Plakası</label>
             <input value={formData.plate} onChange={handlePlateChange} placeholder="34AB1234" className={`w-full h-14 bg-zinc-50 border-2 rounded-xl px-4 text-xl font-mono uppercase tracking-widest outline-none transition-all ${isPlateValid ? 'border-green-500 text-green-700' : 'border-zinc-200'}`} />
             {!isPlateValid && formData.plate.length > 0 && <p className="text-[10px] text-red-500 font-bold">Hatalı Format!</p>}
           </div>
           <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
             <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><MapPin size={14} /> Konum</label>
                <button onClick={handleGetLocation} disabled={isLocating} className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95">{isLocating ? <Loader2 size={10} className="animate-spin" /> : "Bul"}</button>
             </div>
             <textarea value={formData.location} readOnly placeholder="Konum bekleniyor..." className="w-full bg-white border border-blue-100 rounded-xl p-3 text-xs h-16 resize-none text-zinc-600" />
           </div>
           <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Başlık</label><input className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm outline-none" placeholder="Örn: Kaldırım Parkı" onChange={e => setFormData({...formData, title: e.target.value})} /></div>
           <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Açıklama</label><textarea className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm outline-none resize-none" onChange={e => setFormData({...formData, description: e.target.value})} /></div>
        </div>
      </div>
      <div className="p-4 bg-white border-t border-zinc-100 mb-safe">
          <button disabled={!isPlateValid || !formData.location || !selectedFile} onClick={() => onSubmit({ ...formData, category: 'Trafik', file: selectedFile })} className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"><ShieldCheck size={20} /> İhbarı Tamamla</button>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<string>('HOME'); 
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState("https://i.pravatar.cc/150?u=user");

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://kentinsesi.onrender.com/complaints/');
      if(!response.ok) throw new Error("Backend hatası");
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        image: item.image_url, 
        userName: item.user_name || 'Anonim Kullanıcı',
        isMyReport: (item.user_name || 'Anonim Kullanıcı') === 'Anonim Kullanıcı' 
      }));
      setComplaints(formattedData);
    } catch (error) { console.log("Hata:", error); } 
    finally { setLoading(false); }
  };

  const fetchVehicles = async () => {
      try {
          const res = await fetch('https://kentinsesi.onrender.com/vehicles/');
          if(res.ok) {
              const data = await res.json();
              setVehicles(data);
          }
      } catch(e) { console.log("Araçlar çekilemedi", e); }
  };

  useEffect(() => { 
      if(role) {
          fetchComplaints(); 
          if(role === 'BELEDIYE_YETKILISI') fetchVehicles(); 
      }
  }, [role]);

  const handleAddReport = async (data: any) => {
    let finalImageUrl = "https://images.unsplash.com/photo-1518173946687-a4c8a9b749f5"; 
    try {
        if(data.file) {
            const formData = new FormData(); formData.append('file', data.file);
            const upRes = await fetch('https://kentinsesi.onrender.com/upload/', { method: 'POST', body: formData });
            if(upRes.ok) { const json = await upRes.json(); finalImageUrl = json.url; }
        }
        const payload = { ...data, image_url: finalImageUrl };
        await fetch('https://kentinsesi.onrender.com/complaints/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        
        setIsReportModalOpen(false);
        fetchComplaints(); 
        alert("İhbar başarıyla oluşturuldu!");
    } catch (e) { alert("Hata oluştu."); }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    if(!confirm("Bu şikayeti silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`https://kentinsesi.onrender.com/complaints/${id}`, { method: 'DELETE' });
      if(res.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id));
        if(selectedComplaint?.id === id) setSelectedComplaint(null);
        alert("Şikayet silindi.");
      }
    } catch (error) { console.error("Silme hatası:", error); }
  };

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Çözüldü').length;
    return { total, resolved };
  }, [complaints]);

  const handleDeleteVehicle = async (id: number) => {
      if(!confirm("Aracı silmek istediğine emin misin?")) return;
      await fetch(`https://kentinsesi.onrender.com/vehicles/${id}`, { method: 'DELETE' });
      fetchVehicles();
  };

  if (!role) return <LoginScreen onLogin={(r) => { setRole(r); setView(r === 'VATANDAS' ? 'HOME' : 'DASHBOARD'); }} />;

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-zinc-400 flex flex-col items-center"><Loader2 className="animate-spin mb-2" />Yükleniyor...</div>;

    if (role === 'VATANDAS') {
        if (view === 'HOME') return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4 animate-pulse"><Camera size={40} /></div>
                    <h2 className="text-2xl font-black text-zinc-900">Trafik İhlal Bildirimi</h2>
                    <p className="text-zinc-500">Hatalı park veya trafik kuralı ihlallerini bildir.</p>
                </div>
                <button onClick={() => setIsReportModalOpen(true)} className="w-full max-w-xs h-20 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center gap-3 font-bold text-xl active:scale-[0.98] transition-transform"><Plus size={32} /> Şikayet Oluştur</button>
            </div>
        );
        if (view === 'LISTE') return (
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold text-zinc-900">Geçmiş Bildirimlerim</h2>
                {complaints.filter(c => c.isMyReport).length === 0 ? <div className="text-center text-zinc-400 py-10">Henüz bildiriminiz yok.</div> :
                 complaints.filter(c => c.isMyReport).map(c => (
                    <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white p-4 rounded-2xl border border-zinc-200 flex gap-4 shadow-sm relative group">
                        <img src={c.image} className="w-20 h-20 rounded-xl object-cover bg-zinc-100" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100?text=Resim'; }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1"><StatusBadge status={c.status} /><span className="text-[10px] text-zinc-400 font-mono">#{c.id.slice(0,4)}</span></div>
                            <h4 className="font-bold text-zinc-900 truncate">{c.title}</h4>
                            <p className="text-xs text-zinc-500 truncate mt-1">{c.plate || 'Plaka Yok'}</p>
                        </div>
                        <button onClick={(e) => handleDelete(c.id, e)} className="absolute bottom-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"><Trash2 size={16} /></button>
                    </div>
                 ))}
            </div>
        );
    }
    
    if (role === 'BELEDIYE_YETKILISI' && view === 'DASHBOARD') return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-zinc-900">Yönetim Paneli</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm"><div className="text-zinc-400 text-xs font-bold uppercase">Bekleyen</div><div className="text-3xl font-black text-blue-600">{stats.total}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm"><div className="text-zinc-400 text-xs font-bold uppercase">Çözülen</div><div className="text-3xl font-black text-emerald-500">{stats.resolved}</div></div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Kurumsal Filo</h3>
                    <button onClick={() => setIsVehicleModalOpen(true)} className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 active:scale-95"><Plus size={14} /> Ekle</button>
                </div>
                
                {vehicles.length === 0 ? <div className="text-center text-zinc-400 text-sm py-4 border border-dashed rounded-xl">Kayıtlı araç yok.</div> : (
                    <div className="grid gap-3">
                        {vehicles.map(v => {
                            const complaintCount = complaints.filter(c => c.plate === v.plate).length;
                            return (
                                <div key={v.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center"><Car size={20} /></div>
                                        <div>
                                            <p className="font-black font-mono text-lg text-zinc-800">{v.plate}</p>
                                            <p className="text-[10px] text-zinc-400">Ruhsat: {v.serial_no}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex flex-col items-center px-3 py-1 rounded-lg ${complaintCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            <span className="text-xs font-bold">{complaintCount}</span>
                                            <span className="text-[8px] uppercase font-bold">İhlal</span>
                                        </div>
                                        <button onClick={() => handleDeleteVehicle(v.id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    if (role === 'BELEDIYE_YETKILISI' && view === 'LISTE') return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Tüm İhbarlar</h2>
            {complaints.map(c => (
                <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white p-4 rounded-2xl border border-zinc-200 flex gap-4 shadow-sm relative"><div className="flex-1"><div className="flex justify-between mb-1"><StatusBadge status={c.status} /></div><h4 className="font-bold text-sm truncate">{c.title}</h4></div><ChevronRight className="text-zinc-300 self-center" /></div>
            ))}
        </div>
    );

    if (view === 'PROFIL') return (
        <div className="p-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 flex flex-col items-center text-center shadow-sm">
                <div className="relative w-24 h-24 mb-4"><div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden ring-2 ring-blue-500"><img src={userAvatar} className="w-full h-full object-cover" /></div><label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg"><Camera size={16} /></label><input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setUserAvatar(URL.createObjectURL(e.target.files[0]))} /></div>
                <h2 className="text-xl font-bold text-zinc-900">{role === 'VATANDAS' ? 'Vatandaş Hesabı' : 'Yönetici Hesabı'}</h2>
            </div>
            <button onClick={() => { setRole(null); setView('HOME'); }} className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50"><div className="flex items-center gap-3"><LogOut size={18} /> Çıkış Yap</div></button>
        </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col shadow-2xl relative">
      <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10"><div className="flex items-center gap-2"><Logo className="w-10 h-10 shadow-sm rounded-lg" /><span className="font-bold text-blue-900 tracking-tight">KentSesi</span></div>{role && (<div className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 flex items-center gap-1"><Globe size={10} /> {role === 'VATANDAS' ? 'İSTANBUL' : 'YÖNETİM'}</div>)}</header>
      <main className="flex-1 overflow-y-auto pb-24">{renderContent()}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 pb-safe max-w-md mx-auto flex h-16">
        {role === 'VATANDAS' ? (
            <>
                <button onClick={() => setView('HOME')} className={`flex-1 flex flex-col items-center justify-center ${view === 'HOME' ? 'text-red-600' : 'text-zinc-400'}`}><Home size={20} /><span className="text-[10px] font-bold mt-1">Bildir</span></button>
                <button onClick={() => setView('LISTE')} className={`flex-1 flex flex-col items-center justify-center ${view === 'LISTE' ? 'text-red-600' : 'text-zinc-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold mt-1">Geçmişim</span></button>
                <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center ${view === 'PROFIL' ? 'text-red-600' : 'text-zinc-400'}`}><User size={20} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
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
      <VehicleModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} onRefresh={fetchVehicles} />
      
      {selectedComplaint && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right duration-300">
             <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 bg-white shadow-sm"><button onClick={() => setSelectedComplaint(null)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full"><ArrowLeft /></button><span className="text-xs font-bold text-zinc-500">DETAY #{selectedComplaint.id.slice(0,4)}</span>
             {selectedComplaint.isMyReport && <button onClick={() => handleDelete(selectedComplaint.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>}
             </div>
            <div className="flex-1 overflow-y-auto"><img src={selectedComplaint.image} className="w-full aspect-video object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Resim+Yok'; }} /><div className="p-5 space-y-4"><h1 className="text-2xl font-bold text-zinc-900">{selectedComplaint.title}</h1><p className="text-zinc-600">{selectedComplaint.description}</p>
            <div className="bg-zinc-100 p-3 rounded-xl"><p className="text-xs font-bold text-zinc-400 uppercase">PLAKA</p><p className="font-mono text-lg font-bold">{selectedComplaint.plate || '-'}</p></div>
            <div className="bg-zinc-100 p-3 rounded-xl"><p className="text-xs font-bold text-zinc-400 uppercase">KONUM</p><p className="text-sm">{selectedComplaint.location}</p></div>
            </div></div>
        </div>
      )}
    </div>
  );
}
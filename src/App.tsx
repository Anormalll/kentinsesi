import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, ClipboardList, User, Plus, MapPin, X, Car, 
  Loader2, Building2, Trash2, ChevronRight, 
  ArrowLeft, Globe, BarChart2, ShieldCheck, 
  Moon, Sun, Mic, MicOff, Map as MapIcon,
  Camera, LogOut, Navigation, Award, TrendingUp,
  AlertTriangle, CheckCircle2 // <-- BUNLARI EKLE
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { UserRole, Complaint } from './types';

// --- LEAFLET İKON FIX ---
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- TİP TANIMLARI ---
interface Vehicle { id: number; plate: string; serial_no: string; }

// --- MAP CLICK COMPONENT ---
const LocationPickerMap: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
    useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); }, });
    return null;
};

// --- YARDIMCI: UUID ÜRETİCİ (KİMLİK) ---
const getOrCreateUserId = () => {
    let uid = localStorage.getItem("kentinsesi_uid");
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem("kentinsesi_uid", uid);
    }
    return uid;
};

// --- RÜTBE SİSTEMİ ---
const getRankInfo = (count: number) => {
    if (count >= 10) return { title: "BAŞKOMİSER", color: "text-purple-600", bg: "bg-purple-100", next: 100, progress: 100 };
    if (count >= 5) return { title: "KIDEMLİ MÜFETTİŞ", color: "text-orange-600", bg: "bg-orange-100", next: 10, progress: ((count-5)/5)*100 };
    if (count >= 1) return { title: "GÖNÜLLÜ DEDEKTİF", color: "text-blue-600", bg: "bg-blue-100", next: 5, progress: ((count-1)/4)*100 };
    return { title: "ACEMİ GÖZLEMCİ", color: "text-zinc-500", bg: "bg-zinc-100", next: 1, progress: 0 }; // Başlangıç
};

// --- YARDIMCI FONKSİYONLAR ---
const formatAndValidatePlate = (text: string) => {
  let clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 8) clean = clean.slice(0, 8);
  
  // Gelişmiş Türkiye Plaka Formatı Kuralı:
  // (01-81 arası il kodu) + (1-3 Harf) + (EN AZ 3, EN FAZLA 4 Rakam)
  const plateRegex = /^(0[1-9]|[1-7][0-9]|8[0-1])[A-Z]{1,3}[0-9]{3,4}$/; 
  const isValid = plateRegex.test(clean);
  
  return { value: clean, isValid };
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let displayStatus = 'FİRMAYA İLETİLDİ';
  let style = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

  if (status === 'İnceleniyor' || status === 'İşlemde' || status === 'İşleniyor') {
      displayStatus = 'İŞLENİYOR'; style = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  } else if (status === 'Çözüldü' || status === 'Çözdük') {
      displayStatus = 'ÇÖZÜLDÜ'; style = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>{displayStatus}</span>;
};

// --- LOGIN EKRANI ---
const LoginScreen: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl w-full max-w-sm z-10 text-center border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner p-4"><img src="/logo.png" className="w-full h-full object-contain" /></div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Hatalısın</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Hatalı park ve ihlalleri anında bildir.</p>
        <div className="space-y-3">
          <button onClick={() => onLogin('VATANDAS')} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"><User size={20} /> Vatandaş Girişi</button>
          <button onClick={() => onLogin('BELEDIYE_YETKILISI')} className="w-full py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-3"><Building2 size={20} /> Kurumsal Giriş</button>
        </div>
      </div>
    </div>
  );
};

// --- MODALLAR ---
const VehicleModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({ isOpen, onClose, onRefresh }) => {
  const [plate, setPlate] = useState(''); const [serialNo, setSerialNo] = useState(''); const [loading, setLoading] = useState(false); const [isValid, setIsValid] = useState(false);
  const handlePlateChange = (e: any) => { const r = formatAndValidatePlate(e.target.value); setPlate(r.value); setIsValid(r.isValid); };
  const handleSubmit = async () => {
    setLoading(true);
    try { const r = await fetch('https://kentinsesi.onrender.com/vehicles/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate, serial_no: serialNo }) }); if(r.ok) { onRefresh(); onClose(); alert("Kaydedildi"); } } catch(e) {alert("Hata");} finally {setLoading(false);}
  };
  if(!isOpen) return null;
  return (<div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6"><div className="flex justify-between mb-4"><h2 className="font-bold dark:text-white">Araç Ekle</h2><button onClick={onClose}><X className="dark:text-white"/></button></div><input value={plate} onChange={handlePlateChange} placeholder="PLAKA" className="w-full border p-3 rounded-xl mb-3 dark:bg-zinc-800 dark:text-white"/><input value={serialNo} onChange={e=>setSerialNo(e.target.value)} placeholder="RUHSAT NO" className="w-full border p-3 rounded-xl mb-3 dark:bg-zinc-800 dark:text-white"/><button onClick={handleSubmit} className="w-full bg-black text-white p-3 rounded-xl font-bold">KAYDET</button></div></div>);
};

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState<any>({ title: '', description: '', plate: '', location: '', lat: null, lng: null });
  const [isPlateValid, setIsPlateValid] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const fetchAddress = async (lat: number, lng: number) => {
      setFormData((prev: any) => ({ ...prev, lat, lng }));
      try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`); const data = await res.json(); setFormData((prev: any) => ({ ...prev, location: data.display_name })); } catch (e) { setFormData((prev: any) => ({ ...prev, location: `${lat}, ${lng}` })); }
  };
  const handleGetLocation = () => { setIsLocating(true); navigator.geolocation.getCurrentPosition((p) => { fetchAddress(p.coords.latitude, p.coords.longitude); setIsLocating(false); }, () => { alert("Konum alınamadı."); setIsLocating(false); }); };
  const handleManualSelect = (lat: number, lng: number) => { fetchAddress(lat, lng); setIsMapPickerOpen(false); };
  const toggleListening = () => { if(isListening){setIsListening(false);return;} const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if(!SR){alert("Desteklenmiyor");return;} const r = new SR(); r.lang='tr-TR'; r.onstart=()=>setIsListening(true); r.onend=()=>setIsListening(false); r.onresult=(e:any)=>setFormData((p:any)=>({...p, description: (p.description||"")+" "+e.results[0][0].transcript})); r.start(); };

  // --- PLAKA DEĞİŞİMİ İÇİN FONKSİYON ---
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = formatAndValidatePlate(e.target.value);
    setFormData({ ...formData, plate: result.value });
    setIsPlateValid(result.isValid);
  };

  if (!isOpen) return null;
  return (
    <>
    <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-bottom">
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-white dark:bg-zinc-900 z-50"><button onClick={onClose}><X className="dark:text-white"/></button><h2 className="font-bold text-lg dark:text-white">Bildirim Oluştur</h2><div className="w-6"/></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-700"><div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden">{selectedFile ? <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover"/> : <Camera className="text-zinc-400"/>}</div><input type="file" onChange={e=>e.target.files && setSelectedFile(e.target.files[0])} className="text-sm dark:text-white"/></div>
           
           {/* --- YENİ EKLENEN PLAKA KONTROLÜ --- */}
           <div className="space-y-1">
             <div className="flex items-center justify-between">
                 <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Araç Plakası</label>
                 {formData.plate.length > 0 && !isPlateValid && (
                     <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-pulse">
                         <AlertTriangle size={12} /> Geçersiz Plaka
                     </span>
                 )}
                 {isPlateValid && (
                     <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                         <CheckCircle2 size={12} /> Format Uygun
                     </span>
                 )}
             </div>
             <input 
                value={formData.plate} 
                onChange={handlePlateChange} 
                placeholder="Örn: 34ABC123" 
                maxLength={8}
                className={`w-full h-14 bg-zinc-50 dark:bg-zinc-950 border-2 rounded-xl px-4 text-xl font-mono uppercase tracking-widest outline-none transition-all dark:text-white
                ${formData.plate.length === 0 ? 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500' : 
                  isPlateValid ? 'border-green-500 text-green-700 dark:text-green-400 focus:ring-4 focus:ring-green-500/20' : 
                  'border-red-500 text-red-700 dark:text-red-400 focus:ring-4 focus:ring-red-500/20'}`} 
             />
           </div>
           {/* --------------------------------- */}

           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800"><div className="flex justify-between mb-2"><label className="text-blue-800 dark:text-blue-300 font-bold text-xs flex gap-2"><MapPin size={14}/> KONUM</label><div className="flex gap-2"><button onClick={()=>setIsMapPickerOpen(true)} className="text-[10px] bg-white text-blue-600 px-3 py-1 rounded-full border border-blue-200 font-bold">Harita</button><button onClick={handleGetLocation} className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold">{isLocating?<Loader2 className="animate-spin" size={12}/>:"Bul"}</button></div></div><textarea value={formData.location} readOnly className="w-full bg-transparent text-xs h-12 resize-none dark:text-zinc-300"/></div>
           <input onChange={e=>setFormData({...formData, title:e.target.value})} placeholder="Başlık" className="w-full h-12 border dark:border-zinc-700 rounded-xl px-4 dark:bg-zinc-800 dark:text-white"/>
           <div className="relative"><textarea value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} placeholder="Açıklama..." className="w-full h-24 border dark:border-zinc-700 rounded-xl p-4 dark:bg-zinc-800 dark:text-white"/><button onClick={toggleListening} className={`absolute right-2 bottom-2 p-2 rounded-full ${isListening?'bg-red-500 text-white animate-pulse':'bg-zinc-200 text-zinc-500'}`}><Mic size={16}/></button></div>
      </div>
      <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 mb-safe"><button disabled={!isPlateValid || !formData.location || !selectedFile} onClick={() => onSubmit({ ...formData, category: 'Trafik', file: selectedFile })} className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"><ShieldCheck size={20} /> Gönder</button></div>
    </div>
    {isMapPickerOpen && (<div className="fixed inset-0 z-[150] bg-zinc-900 flex flex-col"><div className="h-16 flex justify-between px-4 items-center bg-zinc-900 text-white"><span className="font-bold">Konum Seç</span><button onClick={()=>setIsMapPickerOpen(false)}><X/></button></div><div className="flex-1"><MapContainer center={[41.0082, 28.9784]} zoom={12} className="h-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><LocationPickerMap onLocationSelect={handleManualSelect}/></MapContainer></div></div>)}
    </>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<string>('HOME'); 
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [inspectingPlate, setInspectingPlate] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // --- STATE'LER (UserAvatar EKLENDİ) ---
  const [userId, setUserId] = useState<string>("");
  const [userRank, setUserRank] = useState<number>(0); 
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userAvatar, setUserAvatar] = useState("https://i.pravatar.cc/150?u=user"); // <-- İŞTE BU EKSİKTİ

  useEffect(() => { 
      if (darkMode) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } 
      setUserId(getOrCreateUserId());
  }, [darkMode]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://kentinsesi.onrender.com/complaints/');
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        image: item.image_url, 
        isMyReport: item.user_identifier === userId,
        userName: item.user_identifier === userId ? 'Siz' : 'Gizli Vatandaş'
      }));
      setComplaints(formattedData);
    } catch (error) { console.log("Hata:", error); } 
    finally { setLoading(false); }
  };

  const fetchRank = async () => {
      try {
          const res = await fetch(`https://kentinsesi.onrender.com/rank/${userId}`);
          if(res.ok) {
              const data = await res.json();
              setUserRank(data.rank);
              setTotalUsers(data.total_users);
          }
      } catch(e) { console.log("Sıralama hatası", e); }
  };

  const fetchVehicles = async () => { try { const res = await fetch('https://kentinsesi.onrender.com/vehicles/'); if(res.ok) setVehicles(await res.json()); } catch(e){} };

  useEffect(() => { 
      if(role) { 
          fetchComplaints(); 
          if(role === 'BELEDIYE_YETKILISI') fetchVehicles();
          if(role === 'VATANDAS') fetchRank();
      } 
  }, [role, userId]); 

  const handleAddReport = async (data: any) => {
    let finalImageUrl = "https://images.unsplash.com/photo-1518173946687-a4c8a9b749f5"; 
    try {
        if(data.file) {
            const fd = new FormData(); fd.append('file', data.file);
            const upRes = await fetch('https://kentinsesi.onrender.com/upload/', { method: 'POST', body: fd });
            if(upRes.ok) { const json = await upRes.json(); finalImageUrl = json.url; }
        }
        const payload = { ...data, image_url: finalImageUrl, user_identifier: userId };
        await fetch('https://kentinsesi.onrender.com/complaints/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        setIsReportModalOpen(false); fetchComplaints(); fetchRank(); alert("Bildirim başarıyla oluşturuldu! Puan kazandın.");
    } catch (e) { alert("Hata oluştu."); }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); if(!confirm("Silinsin mi?")) return; await fetch(`https://kentinsesi.onrender.com/complaints/${id}`, { method: 'DELETE' }); setComplaints(prev=>prev.filter(c=>c.id!==id)); if(selectedComplaint?.id===id) setSelectedComplaint(null); };
  const handleUpdateStatus = async (id: string, newStatus: string) => { await fetch(`https://kentinsesi.onrender.com/complaints/${id}/status`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:newStatus})}); setComplaints(prev=>prev.map(c=>c.id===id?{...c, status:newStatus}:c)); if(selectedComplaint) setSelectedComplaint({...selectedComplaint, status:newStatus}); };
  const handleDeleteVehicle = async (id: number, e: React.MouseEvent) => { e.stopPropagation(); if(!confirm("Sil?")) return; await fetch(`https://kentinsesi.onrender.com/vehicles/${id}`, { method: 'DELETE' }); fetchVehicles(); };

  const stats = useMemo(() => {
    const myComplaints = complaints.filter(c => c.isMyReport);
    return { 
        total: myComplaints.length, 
        resolved: myComplaints.filter(c => c.status === 'Çözüldü' || c.status === 'Çözdük').length,
        processing: myComplaints.filter(c => c.status.includes('İş')).length,
        allTotal: complaints.length, 
        allResolved: complaints.filter(c => c.status === 'Çözüldü').length 
    };
  }, [complaints]);

  const rankInfo = useMemo(() => getRankInfo(stats.total), [stats.total]);

  if (!role) return <LoginScreen onLogin={(r) => { setRole(r); setView(r === 'VATANDAS' ? 'HOME' : 'DASHBOARD'); }} />;

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-zinc-400 flex flex-col items-center"><Loader2 className="animate-spin mb-2" />Yükleniyor...</div>;

    if (view === 'HARITA') return (
        <div className="h-[80vh] w-full relative">
            <MapContainer center={[41.0082, 28.9784]} zoom={11} className="h-full w-full z-0"><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {complaints.map(c => ((c.lat && c.lng) ? (<Marker key={c.id} position={[c.lat, c.lng]}><Popup><div className="text-center" onClick={() => setSelectedComplaint(c)}><b className="text-zinc-900">{c.title}</b><br/><span className="text-xs text-zinc-500">Gizli Vatandaş</span><br/><button className="text-blue-500 text-xs font-bold mt-1">Detay</button></div></Popup></Marker>) : null))}
            </MapContainer>
        </div>
    );

    if (role === 'VATANDAS') {
        if (view === 'HOME') return (
            <div className="p-6 flex flex-col min-h-[80vh]">
                <div className="mb-8"><button onClick={() => setIsReportModalOpen(true)} className="w-full h-24 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-xl flex items-center justify-center gap-4 font-black text-2xl active:scale-95"><Plus size={32} /> BİLDİRİM OLUŞTUR</button></div>
                <div><h3 className="text-zinc-400 text-xs font-bold uppercase mb-4 tracking-wider">Son Bildirimlerim</h3><div className="space-y-3">{complaints.filter(c => c.isMyReport).slice(0, 5).map(c => (<div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3 shadow-sm"><img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0" /><div className="flex-1 min-w-0"><h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate">{c.title}</h4><div className="flex items-center gap-2 mt-0.5"><StatusBadge status={c.status} /></div></div><ChevronRight size={16} className="text-zinc-300" /></div>))}</div></div>
            </div>
        );
        if (view === 'LISTE') return ( <div className="p-4 space-y-4"><h2 className="text-xl font-bold dark:text-white">Geçmişim</h2>{complaints.filter(c => c.isMyReport).map(c => (<div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 flex gap-4 shadow-sm relative"><img src={c.image} className="w-16 h-16 rounded-xl object-cover" /><div className="flex-1"><div className="flex justify-between mb-1"><StatusBadge status={c.status} /></div><h4 className="font-bold dark:text-white truncate">{c.title}</h4></div></div>))}</div> );
        
        if (view === 'PROFIL') return (
            <div className="p-4 space-y-6">
                <div className={`p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm relative overflow-hidden ${rankInfo.bg}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200"><div className="h-full bg-green-500 transition-all duration-1000" style={{width: `${rankInfo.progress}%`}}></div></div>
                    <div className="relative w-24 h-24 mb-4"><div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden ring-2 ring-red-500"><img src={userAvatar} className="w-full h-full object-cover" /></div><label htmlFor="avt" className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full"><Camera size={16}/></label><input id="avt" type="file" className="hidden" onChange={e=>e.target.files&&setUserAvatar(URL.createObjectURL(e.target.files[0]))}/></div>
                    <h2 className={`text-xl font-black tracking-tighter ${rankInfo.color}`}>{rankInfo.title}</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase mt-1">Sonraki rütbeye: {rankInfo.next - stats.total} bildirim</p>
                </div>
                
                <div className="bg-zinc-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3"><div className="bg-yellow-500 text-black p-2 rounded-lg"><Award size={24}/></div><div><p className="text-xs text-zinc-400 font-bold uppercase">Şehir Sıralaması</p><p className="font-bold text-lg">#{userRank} / {totalUsers}</p></div></div><TrendingUp className="text-green-400"/>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border dark:border-zinc-800 text-center"><div className="text-red-600 font-black text-xl">{stats.total}</div><div className="text-[10px] font-bold text-zinc-400 uppercase">Toplam</div></div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border dark:border-zinc-800 text-center"><div className="text-blue-600 font-black text-xl">{stats.processing}</div><div className="text-[10px] font-bold text-zinc-400 uppercase">İşleniyor</div></div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border dark:border-zinc-800 text-center"><div className="text-emerald-500 font-black text-xl">{stats.resolved}</div><div className="text-[10px] font-bold text-zinc-400 uppercase">Çözüldü</div></div>
                </div>
                <button onClick={() => { setRole(null); setView('HOME'); }} className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border rounded-xl text-sm font-bold text-red-500"><div className="flex items-center gap-3"><LogOut size={18} /> Çıkış Yap</div></button>
            </div>
        );
    }
    
    if (role === 'BELEDIYE_YETKILISI') {
        if(view==='DASHBOARD') return (<div className="p-4 space-y-6"><h2 className="text-xl font-bold dark:text-white">Yönetim</h2><div className="grid grid-cols-2 gap-4"><div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800"><div className="text-zinc-400 text-xs font-bold uppercase">Bekleyen</div><div className="text-3xl font-black text-red-600">{stats.allTotal - stats.allResolved}</div></div><div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800"><div className="text-zinc-400 text-xs font-bold uppercase">Çözülen</div><div className="text-3xl font-black text-emerald-500">{stats.allResolved}</div></div></div><div className="space-y-4"><div className="flex justify-between"><h3 className="font-bold dark:text-white">Filo</h3><button onClick={()=>setIsVehicleModalOpen(true)} className="bg-black text-white px-3 py-1 rounded text-xs font-bold">Ekle</button></div>{vehicles.map(v=>(<div key={v.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border flex justify-between dark:border-zinc-800"><div className="flex gap-4 items-center"><Car/><span className="font-black font-mono dark:text-white">{v.plate}</span></div><button onClick={e=>handleDeleteVehicle(v.id,e)}><Trash2 size={16}/></button></div>))}</div></div>);
        if(view==='LISTE') return (<div className="p-4 space-y-4"><h2 className="text-xl font-bold dark:text-white">Tüm İhlaller</h2>{complaints.map(c=>(<div key={c.id} onClick={()=>setSelectedComplaint(c)} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 flex gap-4 shadow-sm relative"><div className="flex-1"><StatusBadge status={c.status}/><h4 className="font-bold text-sm mt-1 dark:text-white">{c.title}</h4></div></div>))}</div>);
        if(view==='PROFIL') return (<div className="p-4"><div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border text-center"><h2 className="font-bold dark:text-white">Firma Yetkilisi</h2></div><button onClick={()=>{setRole(null);setView('HOME')}} className="w-full mt-4 p-4 bg-white border rounded-xl text-red-500 font-bold">Çıkış</button></div>);
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col shadow-2xl relative transition-colors duration-300">
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="flex items-center gap-2"><img src="/logo.png" className="w-8 h-8 object-contain rounded-lg" /><span className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg">Hatalısın</span></div>
        <div className="flex items-center gap-2">{role && (<div className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-1"><Globe size={10} /> {role === 'VATANDAS' ? 'İSTANBUL' : 'YÖNETİM'}</div>)}<button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24">{renderContent()}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-safe max-w-md mx-auto flex h-16 transition-colors duration-300">
        {role === 'VATANDAS' ? (
            <>
                <button onClick={() => setView('HOME')} className={`flex-1 flex flex-col items-center justify-center ${view === 'HOME' ? 'text-red-600' : 'text-zinc-400'}`}><Home size={20} /><span className="text-[10px] font-bold mt-1">Ana Sayfa</span></button>
                <button onClick={() => setView('HARITA')} className={`flex-1 flex flex-col items-center justify-center ${view === 'HARITA' ? 'text-red-600' : 'text-zinc-400'}`}><MapIcon size={20} /><span className="text-[10px] font-bold mt-1">Harita</span></button>
                <button onClick={() => setView('LISTE')} className={`flex-1 flex flex-col items-center justify-center ${view === 'LISTE' ? 'text-red-600' : 'text-zinc-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold mt-1">Geçmiş</span></button>
                <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center ${view === 'PROFIL' ? 'text-red-600' : 'text-zinc-400'}`}><User size={20} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
            </>
        ) : (
            <>
             <button onClick={() => setView('DASHBOARD')} className={`flex-1 flex flex-col items-center justify-center ${view === 'DASHBOARD' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}><BarChart2 size={20} /><span className="text-[10px] font-bold mt-1">Panel</span></button>
             <button onClick={() => setView('HARITA')} className={`flex-1 flex flex-col items-center justify-center ${view === 'HARITA' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}><MapIcon size={20} /><span className="text-[10px] font-bold mt-1">Harita</span></button>
             <button onClick={() => setView('LISTE')} className={`flex-1 flex flex-col items-center justify-center ${view === 'LISTE' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold mt-1">Liste</span></button>
             <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center ${view === 'PROFIL' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}><User size={20} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
            </>
        )}
      </nav>
      {/* ... MODALLAR VE DETAY AYNI ... */}
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleAddReport} />
      <VehicleModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} onRefresh={fetchVehicles} />
      {selectedComplaint && (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-white dark:bg-zinc-900 shadow-sm"><button onClick={() => setSelectedComplaint(null)} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><ArrowLeft /></button><span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">DETAY #{selectedComplaint.id.slice(0,4)}</span>{selectedComplaint.isMyReport && <button onClick={() => handleDelete(selectedComplaint.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><Trash2 size={18}/></button>}</div>
            <div className="flex-1 overflow-y-auto"><div className="bg-zinc-100 dark:bg-zinc-950 w-full flex justify-center py-4"><img src={selectedComplaint.image} className="max-h-[40vh] max-w-full object-contain shadow-lg rounded-lg" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Resim+Yok'; }} /></div><div className="p-5 space-y-4"><div className="flex items-center justify-between"><h1 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedComplaint.title}</h1><StatusBadge status={selectedComplaint.status} /></div><p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{selectedComplaint.description}</p><div className="grid grid-cols-2 gap-3"><div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">PLAKA</p><p className="font-mono text-lg font-bold text-zinc-800 dark:text-zinc-100">{selectedComplaint.plate || '-'}</p></div><div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">KONUM</p><p className="text-xs text-zinc-800 dark:text-zinc-100 line-clamp-2">{selectedComplaint.location}</p></div></div>{role === 'BELEDIYE_YETKILISI' && (<div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800"><p className="text-xs font-bold text-zinc-400 uppercase mb-3 text-center">Durumu Güncelle</p><div className="grid grid-cols-3 gap-2"><button onClick={() => handleUpdateStatus(selectedComplaint.id, 'Aldık')} className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${selectedComplaint.status === 'Aldık' ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 hover:border-zinc-400'}`}>FİRMAYA İLETİLDİ</button><button onClick={() => handleUpdateStatus(selectedComplaint.id, 'İşleniyor')} className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${selectedComplaint.status === 'İşleniyor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 hover:border-blue-300'}`}>İŞLENİYOR</button><button onClick={() => handleUpdateStatus(selectedComplaint.id, 'Çözüldü')} className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${selectedComplaint.status === 'Çözüldü' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900 hover:border-emerald-300'}`}>ÇÖZÜLDÜ</button></div></div>)}</div></div>
        </div>
      )}
    </div>
  );
}
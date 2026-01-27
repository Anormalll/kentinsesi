import React, { useState, useEffect } from 'react';
import { 
  Home, ClipboardList, Bell, User, Plus, MapPin, ThumbsUp, MessageSquare, 
  ChevronRight, ArrowLeft, X, Construction, Car, Trees, CheckCircle2, 
  Clock, ShieldCheck, FileText, Filter, LogOut, Settings, Star, Moon, Globe,
  Camera, Loader2 // Loader ikonu eklendi
} from 'lucide-react';
import { UserRole, View, Complaint, Status, Category, TimelineEvent } from './types';

// --- Yardımcı Fonksiyonlar ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: any = {
    'Beklemede': 'bg-gray-100 text-gray-700 border-gray-200',
    'İnceleniyor': 'bg-blue-100 text-blue-700 border-blue-200',
    'İşlemde': 'bg-amber-100 text-amber-700 border-amber-200',
    'Çözüldü': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Reddedildi': 'bg-red-100 text-red-700 border-red-200',
  };
  const style = styles[status] || styles['Beklemede'];
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
      {status ? status.toUpperCase() : 'BELİRSİZ'}
    </span>
  );
};

// --- Akıllı Rapor Modalı ---
const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState<Category | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false); // Konum aranıyor mu?
  
  const [formData, setFormData] = useState<any>({
    title: '', description: '', plate: '', transportCompany: '', 
    firmName: 'Mega Yapı', municipality: 'Kadıköy', 
    location: '' // Başlangıçta boş
  });

  // Konum Bulma Simülasyonu
  const handleGetLocation = () => {
    setIsLocating(true);
    // Gerçek GPS yerine simülasyon yapıyoruz
    setTimeout(() => {
      setFormData((prev: any) => ({ ...prev, location: 'Caddebostan, Bağdat Cd. No:342, 34728 Kadıköy/İstanbul' }));
      setIsLocating(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const categories: { id: Category; icon: any; label: string }[] = [
    { id: 'Trafik', icon: Car, label: 'Trafik' },
    { id: 'İnşaat', icon: Construction, label: 'İnşaat' },
    { id: 'Belediye Hizmetleri', icon: Trees, label: 'Belediye' },
    { id: 'Diğer', icon: FileText, label: 'Diğer' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 bg-white z-50">
        <button onClick={onClose} className="p-2 text-zinc-400"><X /></button>
        <h2 className="font-bold text-lg text-blue-900">Yeni Sorun Bildir</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* --- 1. KONUM SEÇİMİ (EN ÜSTTE OLUR) --- */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2">
              <MapPin size={14} /> Konum Bilgisi
            </label>
            {!formData.location && (
              <button 
                onClick={handleGetLocation} 
                disabled={isLocating}
                className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
              >
                {isLocating ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
                {isLocating ? 'Bulunuyor...' : 'Konumumu Bul'}
              </button>
            )}
          </div>
          
          <textarea 
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder={isLocating ? "Konum alınıyor..." : "Veya adresi buraya elle yazın..."}
            className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-blue-200 h-20 resize-none font-medium"
          />
          {formData.location && <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1"><CheckCircle2 size={10} /> Konum doğrulandı</div>}
        </div>

        <section className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Kategori Seçin</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${category === cat.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400'}`}
              >
                <cat.icon size={20} />
                <span className="text-[10px] font-bold text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {category && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* --- RESİM YÜKLEME ALANI --- */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden relative">
                {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
                ) : <Camera size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fotoğraf Kanıtı</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>
            </div>

            {category === 'Trafik' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Plaka No</label><input className="w-full h-12 bg-zinc-100 border border-zinc-200 rounded-xl px-4 text-sm font-mono outline-none" onChange={e => setFormData({...formData, plate: e.target.value})} /></div>
              </div>
            )}
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Başlık</label><input className="w-full h-12 bg-zinc-100 border border-zinc-200 rounded-xl px-4 text-sm outline-none" onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-400">Açıklama</label><textarea className="w-full h-32 bg-zinc-100 border border-zinc-200 rounded-2xl p-4 text-sm outline-none resize-none" onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-zinc-100 mb-safe">
        <button 
          disabled={!category || !formData.title || !formData.location} 
          onClick={() => onSubmit({ ...formData, category, file: selectedFile })} 
          className="w-full h-14 bg-blue-700 text-white font-bold rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
        >
          {formData.location ? 'Raporu Gönder' : 'Önce Konum Belirtin'}
        </button>
      </div>
    </div>
  );
};

// --- Ana Uygulama ---
export default function App() {
  const [role, setRole] = useState<UserRole>('VATANDAS');
  const [view, setView] = useState<View>('AKIS');
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // VERİ ÇEKME (GET)
  const fetchComplaints = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/complaints/');
      const data = await response.json();
      
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        image: item.image_url || 'https://images.unsplash.com/photo-1542382156-65697df05e60', 
        userName: 'Anonim Kullanıcı',
        userAvatar: 'https://i.pravatar.cc/150',
        createdAt: new Date(item.created_at).toLocaleDateString('tr-TR'),
        timeline: [],
        isMyReport: false
      }));
      
      setComplaints(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Veri çekilemedi:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // YENİ RAPOR EKLEME
  const handleAddReport = async (data: any) => {
    try {
      let finalImageUrl = "https://images.unsplash.com/photo-1518173946687-a4c8a9b749f5"; // Varsayılan

      // 1. ADIM: RESİM YÜKLEME
      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file); 
        try {
          const uploadResponse = await fetch('http://127.0.0.1:8000/upload/', { method: 'POST', body: formData });
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            finalImageUrl = uploadResult.url; 
          }
        } catch (uploadError) { console.error("Upload hatası:", uploadError); }
      }

      // 2. ADIM: RAPORU KAYDETME
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location || "İstanbul", // Artık formdan gelen konumu kullanıyoruz
        image_url: finalImageUrl,
        plate: data.plate,
        firm_name: data.firmName,
        municipality: data.municipality
      };

      const response = await fetch('http://127.0.0.1:8000/complaints/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsReportModalOpen(false);
        fetchComplaints(); 
        alert("Raporunuz başarıyla oluşturuldu!");
      } else {
        alert("Rapor gönderilemedi!");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir bağlantı hatası oluştu.");
    }
  };

  // --- EKRANLAR ---
  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-zinc-500">Yükleniyor...</div>;

    if (view === 'AKIS') {
      return (
        <div className="p-4 space-y-6">
           <button onClick={() => setIsReportModalOpen(true)} className="w-full h-16 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 font-bold active:scale-[0.98] transition-transform">
            <Plus size={24} /> Yeni Sorun Bildir
          </button>
          
          {complaints.length === 0 ? (
            <div className="text-center text-zinc-400 py-10">Henüz şikayet yok. İlk sen ol!</div>
          ) : (
            complaints.map(c => (
              <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm mb-4 active:scale-[0.99] transition-transform">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={c.userAvatar} className="w-8 h-8 rounded-full" />
                    <div><div className="text-xs font-bold">{c.userName}</div><div className="text-[10px] text-zinc-400">{c.createdAt}</div></div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="relative aspect-video">
                    <img src={c.image} className="w-full h-full object-cover" alt="Sorun Resmi" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Resim+Yok'; }} />
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] font-bold flex items-center gap-1">
                      <MapPin size={10} /> {c.location}
                    </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm text-zinc-900 mb-1">{c.title}</h4>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }
    return <div className="p-10 text-center text-zinc-400">Bu ekran yapım aşamasında.</div>;
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col shadow-2xl relative">
      <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10">
         <div className="flex items-center gap-2">
           <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
           <span className="font-bold text-blue-900 tracking-tight">KentSesi</span>
         </div>
         <div className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 flex items-center gap-1">
          <Globe size={10} /> İSTANBUL
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 pb-safe max-w-md mx-auto flex h-16">
        <button onClick={() => setView('AKIS')} className={`flex-1 flex flex-col items-center justify-center transition-colors ${view === 'AKIS' ? 'text-blue-700' : 'text-zinc-400'}`}><Home size={22} /><span className="text-[10px] font-bold mt-1">Akış</span></button>
        <button onClick={() => setView('PROFIL')} className={`flex-1 flex flex-col items-center justify-center transition-colors ${view === 'PROFIL' ? 'text-blue-700' : 'text-zinc-400'}`}><User size={22} /><span className="text-[10px] font-bold mt-1">Profil</span></button>
      </nav>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleAddReport} />
    </div>
  );
}
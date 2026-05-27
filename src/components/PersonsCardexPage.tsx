import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  Phone, 
  MapPin, 
  User, 
  Award, 
  FileText, 
  X, 
  Loader2, 
  ArrowLeft,
  Smartphone,
  Notebook,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';

interface Contact {
  _id?: string;
  fullName: string;
  specialty: string;
  landline: string;
  phone1: string;
  phone2: string;
  address: string;
  notes: string;
}

interface ImportResult {
  insertedCount: number;
  failedCount: number;
  inserted: any[];
  failedList: any[];
}

export const PersonsCardexPage = () => {
  const navigate = useNavigate();

  // Search fields
  const [searchName, setSearchName] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');

  // Contacts lists & status
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected contact for detail popup
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Manage individual status (Add / Edit Form state)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // New / Editing form values
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [landline, setLandline] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Clipboard copy state mapping for user feedback
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // --- Batch Import States ---
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileError, setImportFileError] = useState('');
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [importTab, setImportTab] = useState<'success' | 'failed'>('success');
  const [dragActive, setDragActive] = useState(false);
  const [parsedContactsCount, setParsedContactsCount] = useState<number>(0);
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('searchName', searchName);
      if (searchSpecialty) params.append('searchSpecialty', searchSpecialty);
      
      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) {
        throw new Error('خطا در دریافت اطلاعات کاردکس اشخاص');
      }
      const data = await res.json();
      setContacts(data || []);
    } catch (err: any) {
      console.error(err);
      setError('امکان بارگذاری کاردکس اشخاص در حال حاضر وجود ندارد. مجدداً تلاش فرمایید.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 450);
    return () => clearTimeout(timer);
  }, [searchName, searchSpecialty]);

  const handleCopy = (e: React.MouseEvent, val: string) => {
    e.stopPropagation(); // prevent opening details popup
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 1500);
  };

  const resetForm = () => {
    setEditingContact(null);
    setFullName('');
    setSpecialty('');
    setLandline('');
    setPhone1('');
    setPhone2('');
    setAddress('');
    setNotes('');
    setIsFormOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent, item: Contact) => {
    e.stopPropagation(); // prevent opening details popup
    setEditingContact(item);
    setFullName(item.fullName || '');
    setSpecialty(item.specialty || '');
    setLandline(item.landline || '');
    setPhone1(item.phone1 || '');
    setPhone2(item.phone2 || '');
    setAddress(item.address || '');
    setNotes(item.notes || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('آیا از حذف اطلاعات این شخص اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchContacts();
        if (selectedContact?._id === id) {
          setSelectedContact(null);
        }
      } else {
        alert('خطا در حذف آیتم');
      }
    } catch (err) {
      console.error(err);
      alert('خطا در ارسال درخواست حذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('نام و نام خانوادگی الزامی است');
      return;
    }

    const payload = { fullName, specialty, landline, phone1, phone2, address, notes };
    try {
      const url = editingContact ? `/api/contacts/${editingContact._id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        resetForm();
        fetchContacts();
      } else {
        const errData = await res.json();
        alert(errData.error || 'خطا در ذخیره‌سازی اطلاعات');
      }
    } catch (err) {
      console.error(err);
      alert('خطا در برقراری ارتباط با سرور');
    }
  };

  // --- CSV / TSV Parsing & Batch Actions ---

  const downloadSampleCSV = () => {
    const headers = [
      'نام و نام خانوادگی',
      'تخصص اصلی',
      'تلفن ثابت',
      'شماره همراه ۱',
      'شماره همراه ۲',
      'نشانی و آدرس',
      'یادداشت‌ها و توضیحات تکمیلی'
    ];
    
    const sampleRows = [
      ['امیرحسین رضایی', 'متخصص تراش سرسیلندر و هیدرولیک', '021-55428990', '09121234567', '09351234567', 'تهران، خیابان قزوین، گاراژ بزرگ تراشکاران، پلاک ۴', 'سوابق عالی در جکهای کوماتسو و ماشین‌آلات راهسازی سنگین.'],
      ['علیرضا سلیمی', 'تامین‌کننده کاسه‌نمد و پکینگ', '021-33948822', '09129876543', '', 'تهران، لاله زار جنوبی، پاساژ صدرا، پلاک ۱۸', 'نمایندگی رسمی برندهای مطرح ایتالیایی و آلمانی. خوش‌حساب.']
    ];

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', 'contacts_sample_cardex.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVOrTSVText = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) {
      setParsedContactsCount(0);
      setParsedItems([]);
      return;
    }

    // Determine delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    }

    // Helper to split line respecting double quotes
    const splitLine = (line: string, delim: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(val => val.replace(/^["']|["']$/g, '').trim());
    };

    const headers = splitLine(firstLine, delimiter);
    const items: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowValues = splitLine(lines[i], delimiter);
      if (rowValues.length === 0 || rowValues.every(v => v === '')) continue;
      
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = rowValues[index] || '';
      });
      items.push(rowObj);
    }

    // Map headers to contact
    const mapped = items.map(row => {
      const contactObj: any = {
        fullName: '',
        specialty: '',
        landline: '',
        phone1: '',
        phone2: '',
        address: '',
        notes: ''
      };

      Object.keys(row).forEach(key => {
        const normKey = key.trim().toLowerCase();
        const val = row[key].trim();
        if (!val) return;

        if (
          normKey === 'name' || 
          normKey === 'fullname' || 
          normKey.includes('نام و نام خانوادگی') || 
          normKey === 'نام' || 
          normKey === 'نام خانوادگی'
        ) {
          contactObj.fullName = val;
        } else if (
          normKey === 'specialty' || 
          normKey === 'job' || 
          normKey.includes('تخصص')
        ) {
          contactObj.specialty = val;
        } else if (
          normKey === 'landline' || 
          normKey === 'phone' || 
          normKey.includes('تلفن ثابت') || 
          normKey.includes('ثابت')
        ) {
          contactObj.landline = val;
        } else if (
          normKey === 'phone1' || 
          normKey === 'mobile1' || 
          normKey.includes('همراه ۱') || 
          normKey.includes('همراه اول') || 
          normKey.includes('موبایل ۱')
        ) {
          contactObj.phone1 = val;
        } else if (
          normKey === 'phone2' || 
          normKey === 'mobile2' || 
          normKey.includes('همراه ۲') || 
          normKey.includes('همراه دوم') || 
          normKey.includes('موبایل ۲')
        ) {
          contactObj.phone2 = val;
        } else if (
          normKey === 'address' || 
          normKey.includes('آدرس') || 
          normKey.includes('نشانی')
        ) {
          contactObj.address = val;
        } else if (
          normKey === 'notes' || 
          normKey === 'description' || 
          normKey.includes('یادداشت') || 
          normKey.includes('توضیحات')
        ) {
          contactObj.notes = val;
        }
      });

      return contactObj;
    });

    setParsedItems(mapped);
    setParsedContactsCount(mapped.length);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setImportText(text);
    parseCSVOrTSVText(text);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setImportFileError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFileError('');
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setImportFileError('فرمت فایل نامعتبر است! فقط فایل‌های CSV یا TXT قابل بارگذاری هستند.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      setImportText(text);
      parseCSVOrTSVText(text);
    };
    reader.onerror = () => {
      setImportFileError('خطا در خواندن اطلاعات فایل.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const executeBulkImport = async () => {
    if (parsedItems.length === 0) {
      alert('هیچ شخصی جهت درون‌ریزی شناسایی نشده است. لطفاً فایل نمونه را بارگذاری کرده یا اطلاعات را پیست کنید.');
      return;
    }

    setIsImporting(true);
    setImportFileError('');
    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedItems)
      });

      if (!res.ok) {
        throw new Error('خطا در ارسال اطلاعات به سرور');
      }

      const resultsData = await res.json();
      setImportResults(resultsData);
      setImportTab(resultsData.failedCount > 0 ? 'failed' : 'success');
      fetchContacts();
    } catch (err: any) {
      console.error(err);
      setImportFileError('خطا در پردازش دسته‌جمعی مخاطبین. وضعیت ارتباط با سرور را بررسی فرمایید.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSuccessCSV = () => {
    if (!importResults || importResults.inserted.length === 0) return;
    const headers = ['نام و نام خانوادگی', 'تخصص اصلی', 'تلفن ثابت', 'شماره همراه ۱', 'شماره همراه ۲', 'نشانی و آدرس', 'یادداشت‌ها'];
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...importResults.inserted.map(item => [
        item.fullName,
        item.specialty,
        item.landline,
        item.phone1,
        item.phone2,
        item.address,
        item.notes
      ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'successful_imports_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFailureCSV = () => {
    if (!importResults || importResults.failedList.length === 0) return;
    const headers = ['نام و نام خانوادگی', 'تخصص اصلی', 'تلفن ثابت', 'شماره همراه ۱', 'شماره همراه ۲', 'نشانی و آدرس', 'یادداشت‌ها', 'علت خطا'];
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...importResults.failedList.map(item => [
        item.fullName,
        item.specialty,
        item.landline,
        item.phone1,
        item.phone2,
        item.address,
        item.notes,
        item.reason
      ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'failed_imports_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeResetImportModal = () => {
    setIsImportOpen(false);
    setImportText('');
    setParsedContactsCount(0);
    setParsedItems([]);
    setImportResults(null);
    setImportFileError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Notebook size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">کاردکس هوشمند اشخاص</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">دفتر تلفن تخصصی، آدرس‌ها و اطلاعات فنی همکاران و پیمانکاران</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>تعریف شخص جدید</span>
          </button>

          <button
            onClick={() => {
              setImportResults(null);
              setIsImportOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black shadow-md cursor-pointer"
          >
            <Upload size={16} />
            <span>واردکردن دسته‌جمعی (Import)</span>
          </button>
          
          <button
            onClick={() => window.close()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>بستن پنجره</span>
          </button>
        </div>
      </div>

      {/* Two-Field Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 block border-b border-slate-100 pb-2">جستجو و فیلتر اطلاعات اشخاص</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Field 1: Person Name search */}
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="جستجو بر اساس نام و نام خانوادگی افراد..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl py-3 pr-10 pl-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all text-right"
            />
          </div>

          {/* Field 2: Specialty & Notes search */}
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Award size={16} />
            </span>
            <input
              type="text"
              placeholder="جستجو بر اساس تخصص اصلی، توضیحات یا یادداشت‌ها..."
              value={searchSpecialty}
              onChange={(e) => setSearchSpecialty(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl py-3 pr-10 pl-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all text-right"
            />
          </div>

        </div>
      </div>

      {/* Main Grid/Table list area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-24 flex flex-col items-center justify-center gap-4 shadow-sm">
          <Loader2 className="animate-spin text-amber-500" size={38} />
          <p className="text-sm font-bold text-slate-500">در حال دریافت و فیلترینگ کاردکس اشخاص...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            onClick={fetchContacts}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            تلاش مجدد بارگذاری کاردکس
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-extrabold text-sm text-slate-800">لیست اشخاص ثبت‌شده</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-bold">تعداد کل یافت‌شده: {contacts.length} مورد</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-black uppercase">
                  <th className="py-3 px-5 font-black">نام و نام خانوادگی</th>
                  <th className="py-3 px-5 font-black">تخصص اصلی</th>
                  <th className="py-3 px-5 font-black text-center">شماره ثابت</th>
                  <th className="py-3 px-5 font-black text-center">شماره همراه ۱ (تلفن اصلی)</th>
                  <th className="py-3 px-5 font-black text-center w-24">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 font-bold">
                      هیچ شخص یا همکار منطبق با معیارهای فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  contacts.map((item) => (
                    <tr 
                      key={item._id} 
                      onClick={() => setSelectedContact(item)}
                      className="hover:bg-amber-50/15 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-4.5 px-5 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                            <User size={13} />
                          </div>
                          <span>{item.fullName}</span>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="py-4.5 px-5 text-slate-600 font-medium">
                        {item.specialty || '-'}
                      </td>

                      {/* Landline */}
                      <td className="py-4.5 px-5 text-center font-mono text-xs hover:text-amber-600 transition-colors">
                        {item.landline ? (
                          <div 
                            onClick={(e) => handleCopy(e, item.landline)}
                            className="inline-flex items-center gap-1 bg-slate-100 group-hover:bg-white border border-slate-200/50 hover:border-amber-300 rounded-lg px-2.5 py-1.5 cursor-pointer max-w-max"
                            title="برای کپی کلیک کنید"
                          >
                            <span className="text-[10px] text-slate-400">
                              {copiedValue === item.landline ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </span>
                            <span>{item.landline}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Phone 1 */}
                      <td className="py-4.5 px-5 text-center font-mono text-xs hover:text-amber-600 transition-colors">
                        {item.phone1 ? (
                          <div 
                            onClick={(e) => handleCopy(e, item.phone1)}
                            className="inline-flex items-center gap-1 bg-slate-100 group-hover:bg-amber-50/50 border border-slate-200/50 hover:border-amber-400 rounded-lg px-2.5 py-1.5 cursor-pointer max-w-max"
                            title="برای کپی کلیک کنید"
                          >
                            <span className="text-[10px] text-slate-400">
                              {copiedValue === item.phone1 ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </span>
                            <span>{item.phone1}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Operations */}
                      <td className="py-4.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => handleEditClick(e, item)}
                            className="p-1.5 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="ویرایش اطلاعات شخص"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, item._id!)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="حذف اطلاعات شخص"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- POPUP 1: FULL DETAIL POPUP/MODAL --- */}
      {selectedContact && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right" 
          onClick={() => setSelectedContact(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">{selectedContact.fullName}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">شناسه‌کاردکس: {selectedContact._id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContact(null)}
                className="w-8 h-8 hover:bg-white/10 text-white hover:text-amber-500 rounded-lg transition-colors font-black text-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Specialty */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Award size={13} className="text-amber-500" />
                  تخصص اصلی و فنی
                </span>
                <p className="text-stone-800 text-xs font-bold leading-relaxed">
                  {selectedContact.specialty || 'ثبت نشده است.'}
                </p>
              </div>

              {/* Numbers grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Landline */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    شماره تلفن ثابت
                  </span>
                  {selectedContact.landline ? (
                    <button 
                      onClick={(e) => handleCopy(e, selectedContact.landline)}
                      className="w-full font-mono text-center font-bold text-slate-800 bg-white border border-slate-200/50 p-2.5 rounded-xl flex items-center justify-between hover:text-amber-500 hover:border-amber-300 transition-all cursor-pointer"
                      title="کلیک جهت کپی شماره"
                    >
                      <span className="text-[10px] text-slate-400">
                        {copiedValue === selectedContact.landline ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </span>
                      <span>{selectedContact.landline}</span>
                    </button>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-2">ثبت نشده</p>
                  )}
                </div>

                {/* Phone 1 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Smartphone size={13} className="text-amber-500" />
                    شماره همراه ۱
                  </span>
                  {selectedContact.phone1 ? (
                    <button 
                      onClick={(e) => handleCopy(e, selectedContact.phone1)}
                      className="w-full font-mono text-center font-bold text-amber-600 bg-white border border-amber-200/50 p-2.5 rounded-xl flex items-center justify-between hover:text-amber-600 hover:border-amber-400 transition-all cursor-pointer"
                      title="کلیک جهت کپی شماره"
                    >
                      <span className="text-[10px] text-slate-400">
                        {copiedValue === selectedContact.phone1 ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </span>
                      <span>{selectedContact.phone1}</span>
                    </button>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-2">ثبت نشده</p>
                  )}
                </div>

                {/* Phone 2 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Smartphone size={13} className="text-slate-400" />
                    شماره همراه ۲
                  </span>
                  {selectedContact.phone2 ? (
                    <button 
                      onClick={(e) => handleCopy(e, selectedContact.phone2)}
                      className="w-full font-mono text-center font-bold text-slate-800 bg-white border border-slate-200/50 p-2.5 rounded-xl flex items-center justify-between hover:text-amber-500 hover:border-amber-300 transition-all cursor-pointer"
                      title="کلیک جهت کپی شماره"
                    >
                      <span className="text-[10px] text-slate-400">
                        {copiedValue === selectedContact.phone2 ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </span>
                      <span>{selectedContact.phone2}</span>
                    </button>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-2">موبایل جایگزین ثبت نشده است</p>
                  )}
                </div>

              </div>

              {/* Address */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <MapPin size={13} className="text-rose-500" />
                  نشانی محل فعالیت یا منزل
                </span>
                <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                  {selectedContact.address || 'نشانی یا کارگاه برای این همکار ثبت نشده است.'}
                </p>
              </div>

              {/* Description / Notes */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <FileText size={13} className="text-blue-500" />
                  یادداشت‌ها و توضیحات تکمیلی
                </span>
                <p className="text-slate-700 text-xs font-semibold leading-relaxed whitespace-pre-line">
                  {selectedContact.notes || 'توضیحات بیشتری وجود ندارد.'}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4.5 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                بستن اطلاعات شخص
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- POPUP 2: ADD / EDIT DIALOG FORM --- */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right"
          onClick={resetForm}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Form Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <Notebook size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">
                    {editingContact ? 'ویرایش اطلاعات شخص' : 'ثبت شخص جدید'}
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ثبت یا مدیریت مشخصات پیمانکاران و مخاطبین</span>
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="w-8 h-8 hover:bg-white/10 text-white hover:text-amber-500 rounded-lg transition-colors font-black text-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow text-slate-700">
              
              {/* Full name (Required) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">نام و نام خانوادگی <b className="text-rose-500">*</b></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علیرضا سلیمی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">تخصص اصلی</label>
                <input
                  type="text"
                  placeholder="مثال: تامین‌کننده کاسه‌نمد پمپ راهسازی"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right"
                />
              </div>

              {/* Landline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">تلفن ثابت</label>
                <input
                  type="text"
                  placeholder="مثال: 021-33948822"
                  value={landline}
                  onChange={(e) => setLandline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right font-mono text-left"
                />
              </div>

              {/* Phones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">شماره همراه ۱ (اصلی)</label>
                  <input
                    type="text"
                    placeholder="مثال: 09129876543"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">شماره همراه ۲</label>
                  <input
                    type="text"
                    placeholder="مثال: 09191234567"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right font-mono text-left"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">نشانی و آدرس</label>
                <input
                  type="text"
                  placeholder="مثال: تهران، لاله زار جنوبی، پاساژ صدرا"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">یادداشت‌ها و توضیحات تکمیلی</label>
                <textarea
                  placeholder="یادداشت‌های فنی یا همکاری مخاطب..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 outline-none transition-all text-right resize-none animate-none"
                />
              </div>

              {/* Action Buttons inside Dialog */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {editingContact ? 'ثبت تغییرات شخص' : 'ایجاد اطلاعات جدید'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  انصراف
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- POPUP 3: BATCH IMPORT (EXCEL / CSV) DIALOG --- */}
      {isImportOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right overflow-y-auto"
          onClick={closeResetImportModal}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <Upload size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">درون‌ریزی دسته‌جمعی اشخاص به کاردکس</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">افزودن نامحدود همکار و پیمانکار از طریق فایل CSV یا کپی پیست مستقیم از اکسل</span>
                </div>
              </div>
              <button 
                onClick={closeResetImportModal}
                className="w-8 h-8 hover:bg-white/10 text-white hover:text-amber-500 rounded-lg transition-colors font-black text-lg flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow text-slate-700">
              
              {!importResults ? (
                // --- STAGE 1: Instructions & Input Options ---
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Instructions Sidebar */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
                        <FileText size={14} className="text-amber-500" />
                        راهنما و فیلدهای مورد نیاز
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        شما می‌توانید لیست اشخاص را به صورت دسته‌جمعی بارگذاری کنید. ستون‌های قابل شناسایی به همراه نام آنها در ذیل آمده است:
                      </p>
                    </div>

                    <ul className="space-y-2 text-[11px] leading-relaxed font-bold text-slate-600">
                      <li className="flex items-start gap-1 p-1 bg-white border border-slate-100 rounded-lg">
                        <span className="text-rose-500 font-extrabold ml-1">*</span>
                        <div>
                          <span className="text-slate-900">نام و نام خانوادگی (ضروری):</span> 
                          <span className="font-medium text-slate-500 block text-[10px]">شناساگر اصلی هویت شخص در نرم‌افزار.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-1 p-1 bg-white border border-slate-100 rounded-lg">
                        <span className="text-amber-500 font-bold ml-1">•</span>
                        <div>
                          <span className="text-slate-900">تخصص اصلی (اختیاری):</span> 
                          <span className="font-medium text-slate-500 block text-[10px]">زمینه کاری اصلی یا مهارت فنی.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-1 p-1 bg-white border border-slate-100 rounded-lg">
                        <span className="text-amber-500 font-bold ml-1">•</span>
                        <div>
                          <span className="text-slate-900">شماره تلفن‌ها (اختیاری):</span> 
                          <span className="font-medium text-slate-500 block text-[10px]">تلفن ثابت، همراه اول و همراه دوم.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-1 p-1 bg-white border border-slate-100 rounded-lg">
                        <span className="text-amber-500 font-bold ml-1">•</span>
                        <div>
                          <span className="text-slate-900">نشانی و آدرس (اختیاری):</span> 
                          <span className="font-medium text-slate-500 block text-[10px]">کارگاه، فروشگاه یا آدرس محل فعالیت.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-1 p-1 bg-white border border-slate-100 rounded-lg">
                        <span className="text-amber-500 font-bold ml-1">•</span>
                        <div>
                          <span className="text-slate-900">یادداشت‌ها و توضیحات:</span> 
                          <span className="font-medium text-slate-500 block text-[10px]">سایر توضیحات فنی یا توافقات مخاطب.</span>
                        </div>
                      </li>
                    </ul>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={downloadSampleCSV}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={14} />
                        <span>دانلود فایل اکسل نمونه (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Drag-Drop and Paste Areas */}
                  <div className="lg:col-span-8 space-y-4">
                    
                    {/* Option A: File upload drag and drop */}
                    <div 
                      onDragEnter={() => setDragActive(true)}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleFileDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 min-h-[140px] ${
                        dragActive ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Upload size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800">فایل کاردکس خود را با فرمت .csv آپلود کنید</span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">فایل را مستقیماً به اینجا بکشید یا دکمه زیر را کلیک کنید</p>
                      </div>
                      <label className="px-4 py-2 bg-white border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:text-amber-600">
                        <span>انتخاب فایل کاردکس</span>
                        <input 
                          type="file" 
                          accept=".csv,.txt" 
                          onChange={handleFileChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Option B: Copy Paste Area */}
                    <div className="space-y-1.5 text-right">
                      <label className="block text-[11px] font-bold text-slate-500">یا متن کپی شده را مستقیم در پایین کپی کنید (از اکسل یا فایل متنی):</label>
                      <textarea
                        value={importText}
                        onChange={handleTextareaChange}
                        rows={6}
                        placeholder={`نام و نام خانوادگی,تخصص اصلی,تلفن ثابت,شماره همراه ۱,شماره همراه ۲,نشانی و آدرس,یادداشت‌ها\nعلیرضا حمیدی,تراشکار سیلندر تخصص هیدرولیک,02111111111,09121111111,,تهران قزوین پلاک ۱۲,"ماهر و متعهد"\nمریم صادقی,واردات کفشک زنجیر,02188887766,09124445555,,تهران مطهری,واردکننده معتبر`}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-2xl py-3 px-4 text-xs font-semibold text-slate-800 outline-none transition-all text-left font-mono"
                      />
                    </div>

                    {/* Import Status Bar */}
                    {parsedContactsCount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-500" />
                          <span className="text-xs font-black">
                            تعداد رکورد آماده جهت ایمپورت: {parsedContactsCount} شخص
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-600/80 font-bold">پیش‌نمایش پس از زدن دکمه تایید پردازش خواهد شد.</p>
                      </div>
                    )}

                    {importFileError && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500" />
                        <span className="text-xs font-black">{importFileError}</span>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                // --- STAGE 2: View and Download Succeeded vs Failed ---
                <div className="space-y-6">
                  
                  {/* Success Banner */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-extrabold block mb-1">تعداد کل رکوردها</span>
                      <strong className="text-xl font-black text-slate-800">
                        {importResults.insertedCount + importResults.failedCount}
                      </strong>
                    </div>

                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 font-extrabold block mb-1">واردشده با موفقیت</span>
                      <strong className="text-xl font-black text-emerald-700">
                        {importResults.insertedCount} رکورد
                      </strong>
                      {importResults.insertedCount > 0 && (
                        <button
                          onClick={downloadSuccessCSV}
                          className="mt-1.5 mx-auto py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={10} />
                          <span>دانلود فایل موفق‌ها (CSV)</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-600 font-extrabold block mb-1">خطا / تکراری قبلی / ناموفق</span>
                      <strong className="text-xl font-black text-rose-700">
                        {importResults.failedCount} رکورد
                      </strong>
                      {importResults.failedCount > 0 && (
                        <button
                          onClick={downloadFailureCSV}
                          className="mt-1.5 mx-auto py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={10} />
                          <span>دانلود فایل ناموفق‌ها (CSV)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-slate-200 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImportTab('success')}
                        className={`py-3 px-4 text-xs font-black transition-all relative ${
                          importTab === 'success' 
                            ? 'text-emerald-600 border-b-2 border-emerald-500' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        ایمپورت‌های موفق ({importResults.inserted.length})
                      </button>
                      <button
                        onClick={() => setImportTab('failed')}
                        className={`py-3 px-4 text-xs font-black transition-all relative ${
                          importTab === 'failed' 
                            ? 'text-rose-600 border-b-2 border-rose-500' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        ایمپورت‌های ناموفق ({importResults.failedList.length})
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold">جهت بایگانی یا تصحیح می‌توانید گزارش‌ها را به صورت CSV دانلود کنید.</p>
                  </div>

                  {/* Results List */}
                  <div className="max-h-[300px] overflow-y-auto border border-slate-100/80 rounded-xl bg-slate-50">
                    
                    {importTab === 'success' ? (
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-black text-slate-500 sticky top-0">
                            <th className="py-2.5 px-4 font-black">نام و نام خانوادگی</th>
                            <th className="py-2.5 px-4 font-black">تخصص اصلی</th>
                            <th className="py-2.5 px-4 font-black text-center">همراه ۱</th>
                            <th className="py-2.5 px-4 font-black text-center">تلفن ثابت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-700 font-bold">
                          {importResults.inserted.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400">هیچ رکوردی ثبت نشده است.</td>
                            </tr>
                          ) : (
                            importResults.inserted.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-black text-slate-900">{row.fullName}</td>
                                <td className="py-3 px-4 text-slate-500 font-medium">{row.specialty || '-'}</td>
                                <td className="py-3 px-4 text-center font-mono text-[11px]">{row.phone1 || '-'}</td>
                                <td className="py-3 px-4 text-center font-mono text-[11px]">{row.landline || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-black text-slate-500 sticky top-0">
                            <th className="py-2.5 px-4 font-black text-slate-700">نام ورودی</th>
                            <th className="py-2.5 px-4 font-black">تخصص ورودی</th>
                            <th className="py-2.5 px-4 font-black text-center">همراه ۱</th>
                            <th className="py-2.5 px-4 font-black text-slate-800 text-rose-600">علت خطا و رد شدن</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white font-bold text-slate-600">
                          {importResults.failedList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400">خوشبختانه هیچ خطایی رخ نداده است.</td>
                            </tr>
                          ) : (
                            importResults.failedList.map((row, idx) => (
                              <tr key={idx} className="hover:bg-rose-50/10">
                                <td className="py-3 px-4 font-extrabold text-slate-800">{row.fullName || '(بدون نام)'}</td>
                                <td className="py-3 px-4 text-slate-400 font-medium">{row.specialty || '-'}</td>
                                <td className="py-3 px-4 text-center font-mono text-[11px]">{row.phone1 || '-'}</td>
                                <td className="py-3 px-4 font-black text-rose-600 text-[11px] bg-rose-500/5">{row.reason}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-100 border-t border-slate-200 p-4.5 flex gap-2">
              {!importResults ? (
                <>
                  <button
                    type="button"
                    onClick={executeBulkImport}
                    disabled={isImporting || parsedItems.length === 0}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>درست کردن پارت‌های جدید و درون‌ریزی...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>تایید و شروع درون‌ریزی به دیتابیس کاردکس</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeResetImportModal}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={closeResetImportModal}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={14} />
                  <span>پایان فرآیند درون‌ریزی و خروج</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

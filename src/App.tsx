import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  useLocation, 
  Navigate,
  useParams
} from 'react-router-dom';
import { ReportsPage } from './components/ReportsPage';
import { PersonsCardexPage } from './components/PersonsCardexPage';
import AdvancedProductsPage from './components/AdvancedProductsPage';
import { 
  ArrowLeft, 
  Search, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Truck,
  Loader2,
  Globe,
  X,
  Copy,
  Check,
  Banknote,
  TrendingUp,
  BarChart2,
  Home,
  MoreVertical,
  User,
  Users,
  Lock,
  Shield,
  Download,
  Upload,
  Info,
  Notebook,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

// Types
interface ProductInfo {
  PartName: string;
  OtherNames: string;
  PartID: string;
  Id?: string;
  PartCollection?: string;
}

interface ProductPrice {
  PartName: string;
  OtherNames?: string;
  PartID: string;
  ProductName: string;
  ProductInformation?: string;
  PartNumber?: string;
  PriceId: string;
  Id?: string;
  id?: string;
  priceId?: string;
  PriceID?: string;
  priceID?: string;
  ProductID?: string;
  SRTID?: string;
  From: string; 
  SupplierName: string;
  LastPriceUpdateDate: string;
  Price: string;
  Material: string;
  DailyDollarRate: string;
  PriceValidityDays: number;
  TargetName?: string;
  TargetModel?: string;
  EstimatedPrice?: string;
  Description?: string;
  Status?: string;
  SRTPriceID?: string;
  CRMID?: string;
  ShelfNumber?: string;
}

// --- Auth Context ---
export const AuthContext = createContext<{
  userName: string;
  userRole: string;
  userPermissions: string[];
  hasPermission: (perm: string) => boolean;
}>({
  userName: 'Admin',
  userRole: 'admin',
  userPermissions: [],
  hasPermission: () => true
});

// --- Components ---

// --- Utils ---

const formatCurrency = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getPersianDate = () => {
  const now = new Date();
  const option: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    calendar: 'persian', 
    numberingSystem: 'latn' 
  };
  const formatter = new Intl.DateTimeFormat('fa-IR', option);
  return formatter.format(now);
};

const mapToPascalCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapToPascalCase);
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    let pascalKey = key;
    if (key.length > 0) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'id') {
        pascalKey = 'Id';
      } else if (lowerKey === 'partid') {
        pascalKey = 'PartID';
      } else if (lowerKey === 'productid') {
        pascalKey = 'ProductID';
      } else if (lowerKey === 'priceid') {
        pascalKey = 'PriceId';
      } else if (lowerKey === 'srtid') {
        pascalKey = 'SRTID';
      } else if (lowerKey === 'srtpriceid') {
        pascalKey = 'SRTPriceID';
      } else if (lowerKey === 'crmid') {
        pascalKey = 'CRMID';
      } else {
        pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      }
    }
    result[pascalKey] = mapToPascalCase(obj[key]);
    if (pascalKey !== key) {
      result[key] = result[pascalKey];
    }
  }

  // Double-safeguarded cross-mappings to satisfy legacy camelCase and casing discrepancies
  if (result.hasOwnProperty('Id')) {
    result.id = result.Id;
    result.ID = result.Id;
  }
  if (result.hasOwnProperty('PartID')) {
    result.partId = result.PartID;
    result.partID = result.PartID;
    if (!result.hasOwnProperty('Id')) {
      result.Id = result.PartID;
      result.id = result.PartID;
      result.ID = result.PartID;
    }
  }
  if (result.hasOwnProperty('Id') && !result.hasOwnProperty('PartID')) {
    result.PartID = result.Id;
    result.partId = result.Id;
    result.partID = result.Id;
  }
  if (result.hasOwnProperty('ProductID')) {
    result.productId = result.ProductID;
    result.productID = result.ProductID;
    result.Id = result.ProductID;
    result.id = result.ProductID;
    result.ID = result.ProductID;
  }
  if (result.hasOwnProperty('Id') && !result.hasOwnProperty('ProductID')) {
    // If we have an Id and no ProductID (like for MachinePart item), map it too
    result.ProductID = result.Id;
    result.productId = result.Id;
    result.productID = result.Id;
  }
  if (result.hasOwnProperty('ProductName')) {
    result.productName = result.ProductName;
    result.name = result.ProductName;
  }
  if (result.hasOwnProperty('PriceId')) {
    result.priceId = result.PriceId;
    result.priceID = result.PriceId;
    result.Id = result.PriceId;
    result.id = result.PriceId;
    result.ID = result.PriceId;
  }
  if (result.hasOwnProperty('SRTPriceID')) {
    result.srtPriceId = result.SRTPriceID;
    result.srtPriceID = result.SRTPriceID;
  }
  if (result.hasOwnProperty('CRMID')) {
    result.crmId = result.CRMID;
    result.crmID = result.CRMID;
  }
  if (result.hasOwnProperty('SRTID')) {
    result.srtId = result.SRTID;
    result.srtID = result.SRTID;
  }

  return result;
};

// --- Components ---

const PriceActionModal = ({ 
  isOpen, 
  onClose, 
  onAction 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAction: (status: 'deleted' | 'نامعتبر') => Promise<void>; 
}) => {
  const [loading, setLoading] = useState<'deleted' | 'نامعتبر' | null>(null);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
      >
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">انتخاب نوع عملیات حذف</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          لطفا برای ادامه یکی از گزینه‌های زیر را انتخاب کنید:
          <br/>
          <span className="text-rose-500 font-bold">حذف کن:</span> اطلاعات کاملا اشتباه است.
          <br/>
          <span className="text-amber-600 font-bold">غیرفعال کن:</span> قیمت قدیمی شده یا نامعتبر است.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={async () => {
              setLoading('deleted');
              await onAction('deleted');
              setLoading(null);
              onClose();
            }}
            disabled={!!loading}
            className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'deleted' ? <Loader2 className="animate-spin" size={20} /> : 'بله، حذف کن'}
          </button>
          
          <button 
            onClick={async () => {
              setLoading('نامعتبر');
              await onAction('نامعتبر');
              setLoading(null);
              onClose();
            }}
            disabled={!!loading}
            className="w-full py-4 bg-amber-100 text-amber-700 font-black rounded-2xl hover:bg-amber-200 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'نامعتبر' ? <Loader2 className="animate-spin" size={20} /> : 'فقط غیرفعال کن'}
          </button>

          <button 
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all mt-2"
          >
            انصراف
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PriceModal = ({ 
  isOpen, 
  onClose, 
  productName, 
  productId,
  dollarRate, 
  userName,
  onSuccess,
  editData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  productName: string; 
  productId?: string | number;
  dollarRate: string;
  userName: string;
  onSuccess: () => void;
  editData?: ProductPrice | null;
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [price, setPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [status, setStatus] = useState('معتبر');
  const [srtPriceID, setSrtPriceID] = useState('');
  const [crmID, setCrmID] = useState('');
  const [shelfNumber, setShelfNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setSupplierName(editData.SupplierName);
      setPrice(editData.Price);
      setMaterial(editData.Material);
      setValidityDays(editData.PriceValidityDays || 7);
      setStatus(editData.Status || 'معتبر');
      setSrtPriceID(editData.SRTPriceID || '');
      setCrmID(editData.CRMID || '');
      setShelfNumber(editData.ShelfNumber || '');
    } else {
      setSupplierName('');
      setPrice('');
      setMaterial('');
      setValidityDays(7);
      setStatus('معتبر');
      setSrtPriceID('');
      setCrmID('');
      setShelfNumber('');
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !price) {
      setError('لطفا فیلدهای اجباری را پر کنید');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const isEdit = !!editData;
      const url = isEdit ? `/api/quotes/${editData.Id || editData.id || editData.PriceId || editData.priceId || editData.PriceID || editData.priceID}` : '/api/quotes';
      const method = isEdit ? 'PATCH' : 'POST';

      const body: any = {
        SupplierName: supplierName,
        Price: price,
        Material: material,
        PriceValidityDays: validityDays,
        Status: status,
        SRTPriceID: srtPriceID,
        CRMID: crmID,
        ShelfNumber: shelfNumber,
      };

      if (!isEdit) {
        // Add fields for NEW quote
        body.ProductName = productName;
        if (productId) {
          body.ProductID = isNaN(Number(productId)) ? productId : Number(productId);
        }
        body.From = userName;
        body.LastPriceUpdateDate = getPersianDate();
        body.DailyDollarRate = dollarRate;
        body.EstimatedPrice = "";
      } else {
        // Add condition-based updates for EDIT
        if (price !== editData.Price) {
          body.LastPriceUpdateDate = getPersianDate();
          body.DailyDollarRate = dollarRate;
        }
        body.EstimatedPrice = "";
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-username': userName
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'خطا در ثبت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className={`px-6 py-4 flex items-center justify-between text-white ${editData ? 'bg-indigo-600' : 'bg-amber-500'}`}>
          <h3 className="font-bold text-lg">{editData ? 'ثبت قیمت روز' : 'اضافه کردن قیمت جدید'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 mb-2">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">نام محصول:</span>
            <span className="font-black text-slate-700 block text-lg uppercase">{productName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">تامین کننده (نام فروشگاه/شخص)</label>
              <input 
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="نام تامین کننده..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
                required
              />
              {editData && <p className="text-[9px] text-amber-600 font-bold mt-1 px-1">هشدار: فقط درصورت وجود اشتباه تایپی ادیت شود</p>}
            </div>
            {!editData && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">ثبت کننده</label>
                <input 
                  type="text"
                  value={userName}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-100 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            )}
            {editData && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">وضعیت قیمت</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
                >
                  <option value="معتبر">معتبر</option>
                  <option value="نامعتبر">نامعتبر</option>
                  <option value="deleted">deleted</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">قیمت به تومان (Price)</label>
            <div className="relative">
              <input 
                type="text"
                value={formatCurrency(price)}
                onChange={(e) => setPrice(e.target.value.replace(/,/g, ''))}
                placeholder="مثلا: ۱,۰۰۰,۰۰۰"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all text-lg font-black text-emerald-700 tracking-wider"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Toman</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">جنس / برند / کشور (Material)</label>
            <input 
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="مثلا: فولاد کره ای"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
            />
            {editData && <p className="text-[9px] text-amber-600 font-bold mt-1 px-1">هشدار: فقط درصورت وجود اشتباه تایپی ادیت شود</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">شناسه قیمت سایت</label>
              <input 
                type="text"
                value={srtPriceID}
                onChange={(e) => setSrtPriceID(e.target.value)}
                placeholder="مثلا: SRT-PRICE-101"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">آیدی CRM</label>
              <input 
                type="text"
                value={crmID}
                onChange={(e) => setCrmID(e.target.value)}
                placeholder="CRM-202"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">شماره قفسه (STG)</label>
              <input 
                type="text"
                value={shelfNumber}
                onChange={(e) => setShelfNumber(e.target.value)}
                placeholder="A-12"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">اعتبار قیمت (روز)</label>
              <input 
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>
            {!editData && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نرخ روز دلار (Daily Rate)</label>
                <input 
                  type="text"
                  value={dollarRate}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-100 rounded-xl text-slate-400 text-sm cursor-not-allowed font-mono"
                />
              </div>
            )}
          </div>

          {!editData && (
             <div className="flex items-center justify-between bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-bold text-emerald-600 uppercase border border-emerald-100">
               <span>تاریخ ثبت خودکار:</span>
               <span>{getPersianDate()}</span>
             </div>
          )}

          {error && <p className="text-rose-500 text-xs px-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              انصراف
            </button>
            <button 
              type="submit"
              disabled={loading}
              className={`flex-[2] py-3 text-white font-black rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${editData ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (editData ? 'بروزرسانی قیمت' : 'ثبت نهایی قیمت')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  productName, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  productName: string; 
  onConfirm: () => Promise<void>; 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() === 'delete') {
      setLoading(true);
      await onConfirm();
      setLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
      >
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">تایید حذف محصول</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          آیا از حذف محصول <span className="font-bold text-rose-600">"{productName}"</span> اطمینان دارید؟
          برای تایید نهایی عبارت <span className="font-mono bg-slate-100 px-1 border rounded text-rose-600">delete</span> را تایپ کنید.
        </p>
        
        <input 
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="تایپ کنید: delete"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 transition-all text-center font-mono mb-4"
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            انصراف
          </button>
          <button 
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== 'delete' || loading}
            className="flex-[2] py-3 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'بله، حذف شود'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProductModal = ({ 
  isOpen, 
  onClose, 
  categoryName, 
  categoryInfo, 
  onSuccess,
  editData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  categoryName: string; 
  categoryInfo: ProductInfo | null;
  onSuccess: () => void;
  editData?: any; // If provided, we are in edit mode
}) => {
  const { userName } = useContext(AuthContext);
  const [targetName, setTargetName] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [productInformation, setProductInformation] = useState('');
  const [srtId, setSrtId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse other names from category info
  const nameOptions = useMemo(() => {
    if (!categoryInfo) return [categoryName];
    const others = categoryInfo.OtherNames 
      ? categoryInfo.OtherNames.split(/[،,]/).map(s => s.trim()).filter(Boolean)
      : [];
    return [categoryName, ...others];
  }, [categoryInfo, categoryName]);

  useEffect(() => {
    if (editData) {
      setTargetName(editData.targetName || editData.TargetName || '');
      setTargetModel(editData.targetModel || editData.TargetModel || '');
      setPartNumber(editData.partNumber || editData.PartNumber || '');
      setProductInformation(editData.productInformation || editData.ProductInformation || '');
      setSrtId(editData.srtId || editData.srtID || editData.SRTID || editData.srtid || '');
    } else if (nameOptions.length > 0) {
      setTargetName(nameOptions[0]);
      setTargetModel('');
      setPartNumber('');
      setProductInformation('');
      setSrtId('');
    }
  }, [editData, nameOptions]);

  const productName = `${targetName} ${targetModel}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName || !targetModel) {
      setError('لطفا فیلدهای اجباری را پر کنید');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = editData ? `/api/machine-parts/${editData.Id || editData.id || editData.productId || editData.ProductID}` : '/api/machine-parts';
      const method = editData ? 'PATCH' : 'POST';
      
      const body: any = {
        TargetName: targetName,
        TargetModel: targetModel,
        ProductName: productName,
        PartNumber: partNumber,
        ProductInformation: productInformation,
        SRTID: srtId
      };

      if (!editData) {
        // Only for new products
        body.PartName = categoryName;
        body.OtherNames = categoryInfo?.OtherNames;
        const rawPartID = categoryInfo?.Id || categoryInfo?.PartID;
        body.PartID = rawPartID ? (isNaN(Number(rawPartID)) ? rawPartID : Number(rawPartID)) : 0;
      } else {
        // For editing, ensure PartID, PartName, OtherNames are preserved by sending them
        const rawPartID = editData.PartID || editData.partID || categoryInfo?.Id || categoryInfo?.PartID;
        const prodId = editData.Id || editData.id || editData.productId || editData.ProductID;
        
        // Prevent mapped product ID instead of real category PartID
        if (rawPartID && String(rawPartID) !== String(prodId)) {
          body.PartID = isNaN(Number(rawPartID)) ? rawPartID : Number(rawPartID);
        } else {
          const fallbackID = categoryInfo?.Id || categoryInfo?.PartID;
          if (fallbackID) {
            body.PartID = isNaN(Number(fallbackID)) ? fallbackID : Number(fallbackID);
          }
        }
        
        body.PartName = editData.PartName || editData.partName || categoryName;
        body.OtherNames = editData.OtherNames || editData.otherNames || categoryInfo?.OtherNames || '';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'x-username': userName
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'خطا در ثبت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className={`px-6 py-4 flex items-center justify-between text-white ${editData ? 'bg-indigo-500' : 'bg-amber-500'}`}>
          <h3 className="font-bold text-lg">{editData ? 'بخش ویرایش محصول' : 'بخش اضافه کردن محصول جدید'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400">نام قطعه کل:</span>
            <span className="font-black text-slate-700">{categoryName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نام اصلی قطعه (TargetName)</label>
              <select 
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              >
                {nameOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نام دستگاه (TargetModel)</label>
              <input 
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                placeholder="مثلا: PC220-7"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${editData ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${editData ? 'text-indigo-600' : 'text-amber-600'}`}>نام کامل محصول {editData ? '(Updated)' : '(Auto-generated)'}</span>
            <p className="font-black text-slate-800 text-lg uppercase">{productName || 'منتظر تکمیل فیلدها...'}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">پارت نامبر (PartNumber)</label>
            <input 
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="پارت نامبرها را با کاما جدا کنید"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">اطلاعات محصول (ProductInformation)</label>
            <textarea 
              value={productInformation}
              onChange={(e) => setProductInformation(e.target.value)}
              rows={3}
              placeholder="توضیحات تکمیلی جهت معرفی و محصول..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-amber-500 transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">Product ID (ReadOnly)</label>
              <input 
                type="text"
                value={editData ? editData.productId : 'Auto-PD'}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">شناسه SRT (اختیاری)</label>
              <input 
                type="text"
                value={srtId}
                onChange={(e) => setSrtId(e.target.value)}
                placeholder="SRT-..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs px-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              انصراف
            </button>
            <button 
              type="submit"
              disabled={loading}
              className={`flex-[2] py-3 text-white font-black rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${editData ? 'bg-indigo-500 shadow-indigo-200 hover:bg-indigo-600' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (editData ? 'اعمال تغییرات' : 'ثبت و تایید محصول')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserProfileModal = ({ 
  isOpen, 
  onClose, 
  userName, 
  userRole 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userName: string; 
  userRole: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          <X size={18} />
        </button>
        <div className="text-center pt-4">
          <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-black text-xl shadow-lg border-2 border-white select-none">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{userName}</h3>
          
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
            <span>سطح دسترسی:</span>
            <span>{userRole?.toLowerCase() === 'admin' ? 'مدیر سیستم (Admin)' : userRole?.toLowerCase() === 'operator' ? 'اپراتور (Operator)' : 'مشاهده‌کننده (Viewer)'}</span>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-right">
            <h4 className="text-xs font-bold text-slate-400 block mb-2 mr-1">دسترسی‌های فعال شما:</h4>
            <div className="space-y-1.5">
              {userRole?.toLowerCase() === 'admin' && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>دسترسی کامل به تمامی بخش‌های مدیریتی</span>
                </div>
              )}
              {userRole?.toLowerCase() === 'operator' && (
                <>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>ثبت، ادیت و تغییر قیمت انواع قطعات سنگین</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>مشاهده کامل جزئیات فنی و سوابق قیمت</span>
                  </div>
                </>
              )}
              {userRole?.toLowerCase() === 'viewer' && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-450" />
                  <span>صرفاً مجاز به بررسی و مشاهده استعلام نسبت‌ها</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserAdminModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Roles Form State
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState('operator');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleSuccess, setRoleSuccess] = useState('');

  const permissionList = [
    { key: 'manage_categories', label: 'مدیریت و افزودن دسته‌بندی قطعات' },
    { key: 'manage_parts', label: 'افزودن، ویرایش و حذف قطعات و محصولات' },
    { key: 'manage_quotes', label: 'ثبت، فرآیند ویرایش و غیرفعال‌سازی سوابق قیمت قطعات' },
    { key: 'manage_users', label: 'تعریف کاربران سیستم و مدیریت سطح دسترسی نقش‌ها' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles')
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
        // Sync open role permissions
        const matched = rolesData.find(r => r.name === selectedRoleForPermissions);
        if (matched) {
          setSelectedPermissions(matched.permissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const matched = roles.find(r => r.name === selectedRoleForPermissions);
    if (matched) {
      setSelectedPermissions(matched.permissions || []);
    } else {
      setSelectedPermissions([]);
    }
  }, [selectedRoleForPermissions, roles]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('نام کاربری و رمز عبور نمی‌تواند خالی باشد');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setUserSuccess('کاربر با موفقیت تعریف شد');
        setNewUsername('');
        setNewPassword('');
        setNewRole('operator');
        fetchData();
      } else {
        setUserError(data.error || 'خطا در تعریف کاربر');
      }
    } catch (err) {
      setUserError('خطا در ارتباط با سرور');
    }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (!confirm(`آیا از حذف کاربر ${usernameToDelete} اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/users/${usernameToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'خطا در حذف کاربر');
      }
    } catch (err) {
      alert('خطا در حذف کاربر');
    }
  };

  const handleTogglePermission = (permKey: string) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter(k => k !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSaveRolePermissions = async () => {
    setRoleSuccess('');
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedRoleForPermissions,
          permissions: selectedPermissions
        })
      });
      if (res.ok) {
        setRoleSuccess('تغییرات دسترسی با موفقیت ذخیره شد');
        fetchData();
      } else {
        alert('خطا در ذخیره‌سازی دسترسی نقش');
      }
    } catch (err) {
      alert('خطا در ذخیره‌سازی دسترسی نقش');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Shield size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">تعریف و تنظیمات سطح دسترسی کاربران</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/10">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'users' 
                ? 'border-amber-500 text-amber-600 bg-amber-50/30' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            لیست و تعریف کاربران سیستم
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'roles' 
                ? 'border-amber-500 text-amber-600 bg-amber-50/30' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تعیین دسترسی‌های نقش‌ها
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add User Form */}
              <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-black text-slate-400 mr-1 uppercase flex items-center gap-1">
                  <Plus size={14} className="text-amber-500" />
                  <span>تعریف کاربر جدید در دیتابیس</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 mr-1">نام کاربری (حساس به حروف نیست)</label>
                    <input 
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="مثلا: reza"
                      className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-amber-500 rounded-xl outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 mr-1">رمز عبور دلخواه</label>
                    <input 
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="..."
                      className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-amber-500 rounded-xl outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 mr-1">انتخاب نقش</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-amber-500 rounded-xl outline-none text-sm transition-all"
                    >
                      <option value="admin">مدیر (Admin)</option>
                      <option value="operator">اپراتور (Operator)</option>
                      <option value="viewer">مشاهده‌کننده (Viewer)</option>
                    </select>
                  </div>
                </div>

                {userError && <p className="text-rose-500 text-xs mt-1 mr-1">{userError}</p>}
                {userSuccess && <p className="text-emerald-600 text-xs mt-1 mr-1">{userSuccess}</p>}

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-200 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>افزودن و ثبت نهایی کاربر</span>
                  </button>
                </div>
              </form>

              {/* Users List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 mr-1 uppercase">لیست فعال کاربران</h3>
                {loading && <p className="text-xs text-slate-400 text-center py-4">در حال بازخوانی لیست کاربران...</p>}
                {!loading && users.length === 0 && <p className="text-xs text-slate-400 text-center py-4">کاربری یافت نشد</p>}
                
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {users.map((u) => (
                    <div key={u._id || u.username} className="px-4 py-3 hover:bg-slate-50/50 flex items-center justify-between text-sm select-none">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{u.username}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">رمزعبور: {u.password}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role?.toLowerCase() === 'admin' 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : u.role?.toLowerCase() === 'operator' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {u.role?.toLowerCase() === 'admin' ? 'Admin' : u.role?.toLowerCase() === 'operator' ? 'Operator' : 'Viewer'}
                        </span>

                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          disabled={u.username.toLowerCase() === 'admin'}
                          className={`p-1.5 rounded-lg border transition-all ${
                            u.username.toLowerCase() === 'admin' 
                              ? 'opacity-30 border-slate-200 cursor-not-allowed text-slate-400' 
                              : 'border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white'
                          }`}
                          title="حذف حساب"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 mr-1">انتخاب نقش برای ویرایش دسترسی‌ها:</label>
                  <div className="flex gap-4">
                    {['operator', 'viewer'].map((roleName) => (
                      <label 
                        key={roleName} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl cursor-pointer transition-all ${
                          selectedRoleForPermissions === roleName 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-800 font-bold' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="roleSelect"
                          value={roleName}
                          checked={selectedRoleForPermissions === roleName}
                          onChange={() => setSelectedRoleForPermissions(roleName)}
                          className="hidden"
                        />
                        <span className="capitalize">{roleName === 'operator' ? 'اپراتور (Operator)' : 'مشاهدکننده (Viewer)'}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 mr-1 leading-relaxed">
                    نکته: نقش <b>admin</b> بالاترین سطح دسترسی است و به صورت خودکار به تمام گزینه‌ها دسترسی نامحدود دارد و قابل ایجاد محدودیت نیست.
                  </p>
                </div>
              </div>

              {/* Checkbox Permission Controls */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 mr-1 uppercase">انتخاب توانایی‌ها و دسترسی‌ها</h3>
                
                <div className="border border-slate-100 bg-white rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {permissionList.map((perm) => (
                    <label 
                      key={perm.key} 
                      className={`px-5 py-4 cursor-pointer hover:bg-slate-50/50 flex items-start gap-3 transition-colors select-none ${
                        selectedPermissions.includes(perm.key) ? 'bg-amber-50/10' : ''
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => handleTogglePermission(perm.key)}
                        className="mt-1 w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500"
                        disabled={selectedRoleForPermissions === 'admin'}
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">{perm.label}</span>
                        <span className="text-xs text-slate-400 font-sans block mt-0.5">{perm.key}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {roleSuccess && <p className="text-emerald-600 text-xs mt-1 mr-1">{roleSuccess}</p>}

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveRolePermissions}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-200 flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>ذخیره‌سازی و اعمال تغییرات دسترسی نقش</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Layout = ({ 
  children, 
  dollarRate, 
  dayChange, 
  onLogout, 
  userName, 
  userRole 
}: { 
  children: React.ReactNode; 
  dollarRate: string; 
  dayChange?: string | null; 
  onLogout: () => void; 
  userName: string; 
  userRole: string; 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserAdminOpen, setIsUserAdminOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';
  const isFirstPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col justify-between" dir="rtl">
      <div>
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Dropdown inside Header */}
              {!isLoginPage && (
                <div className="relative">
                  <button 
                    id="header-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-50 rounded-full transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                    title="دسترسی سریع"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Menu Dropdown - adjusted for header top element */}
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute top-12 right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-right text-sm">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsProfileOpen(true);
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 font-bold text-slate-700"
                        >
                          <User size={15} className="text-amber-500" />
                          <span>پنل کاربری (پروفایل)</span>
                        </button>

                        {userRole?.toLowerCase() === 'admin' && (
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsUserAdminOpen(true);
                            }}
                            className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 border-t border-slate-100 font-bold text-slate-700"
                          >
                            <Users size={15} className="text-amber-500" />
                            <span>تعریف و دسترسی کاربران</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/reports?tab=performance');
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 border-t border-slate-100 font-bold text-slate-700"
                        >
                          <TrendingUp size={15} className="text-amber-500" />
                          <span>گزارش عملکرد کاربران</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/reports?tab=views');
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 border-t border-slate-100 font-bold text-slate-700"
                        >
                          <BarChart2 size={15} className="text-amber-500" />
                          <span>پربازدیدترین‌ها (محصول/قطعه)</span>
                        </button>

                        <a
                          href="/persons-cardex"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 border-t border-slate-100 font-bold text-slate-700 block"
                        >
                          <Notebook size={15} className="text-amber-500" />
                          <span>کاردکس اشخاص</span>
                        </a>

                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/advanced-products');
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2 border-t border-slate-100 font-bold text-slate-700"
                        >
                          <Sliders size={15} className="text-amber-500" />
                          <span>مدیریت پیشرفته محصولات</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => !isLoginPage && navigate('/')}
              >
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  <Home size={24} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">مدیریت قیمت سنگین راه</h1>
              </div>
            </div>

            {!isLoginPage && !isFirstPage && (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 px-3 py-1.5 rounded-full text-sm"
              >
                <ArrowLeft size={16} />
                <span>بازگشت</span>
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-medium tracking-wider">قیمت روز دلار</span>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold select-none">
                  <span>{dollarRate}</span>
                  {dayChange !== undefined && dayChange !== null && (
                    <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full ${
                      parseFloat(dayChange || '0') >= 0 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`} dir="ltr">
                      {parseFloat(dayChange || '0') >= 0 ? `+${dayChange}%` : `${dayChange}%`}
                    </span>
                  )}
                </div>
              </div>
              
              {!isLoginPage && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
          {children}
        </main>
      </div>

      {!isLoginPage && (
        <footer className="border-t border-slate-200/60 bg-white py-6 mt-12 text-slate-400 text-xs text-center relative px-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-right text-slate-500 font-medium w-full text-center sm:text-right">
              <span>© ۱۴۰۳ سامانه استعلام قیمت سنگین راه</span>
            </div>
          </div>
        </footer>
      )}

      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        userRole={userRole}
      />

      <UserAdminModal 
        isOpen={isUserAdminOpen}
        onClose={() => setIsUserAdminOpen(false)}
      />
    </div>
  );
};

// --- Pages ---

const LoginPage = ({ onLogin }: { onLogin: (token: string, username: string, role: string, permissions: string[]) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        onLogin(data.token, data.username, data.role, data.permissions);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
            <Home size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">ورود به پنل مدیریت</h2>
          <p className="text-slate-500 text-sm mt-1">مدیریت قیمت سنگین راه</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نام کاربری</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
              placeholder="Admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
              placeholder="Admin"
              required
            />
          </div>
          {error && <p className="text-rose-500 text-xs mt-1 px-1">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'ورود به سیستم'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const ProductCategoryPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useContext(AuthContext);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<ProductInfo | null>(null);

  const [partNameInput, setPartNameInput] = useState('');
  const [otherNamesInput, setOtherNamesInput] = useState('');
  const [partCollectionInput, setPartCollectionInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete Confirm States
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CSV States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [partsUploadMethod, setPartsUploadMethod] = useState<'1' | '2'>('1');
  const [csvError, setCsvError] = useState('');
  const [csvSuccessMessage, setCsvSuccessMessage] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvFailedList, setCsvFailedList] = useState<any[]>([]);

  // Products CSV States
  const [isProdCsvModalOpen, setIsProdCsvModalOpen] = useState(false);
  const [prodCsvFile, setProdCsvFile] = useState<File | null>(null);
  const [prodUploadMethod, setProdUploadMethod] = useState<'1' | '2'>('1');
  const [prodCsvError, setProdCsvError] = useState('');
  const [prodCsvSuccessMessage, setProdCsvSuccessMessage] = useState('');
  const [prodCsvLoading, setProdCsvLoading] = useState(false);
  const [prodFailedList, setProdFailedList] = useState<any[]>([]);
  const [prodSuccessList, setProdSuccessList] = useState<any[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm1) params.append('search1', searchTerm1);
      if (searchTerm2) params.append('search2', searchTerm2);
      
      const res = await fetch(`/api/categories?${params.toString()}`);
      const rawData = await res.json();
      const data = mapToPascalCase(rawData);
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        console.error('Expected array for products, got:', data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory && modalMode === 'edit') {
      setPartNameInput(selectedCategory.PartName);
      setOtherNamesInput(selectedCategory.OtherNames || '');
      setPartCollectionInput(selectedCategory.PartCollection || '');
    } else {
      setPartNameInput('');
      setOtherNamesInput('');
      setPartCollectionInput('');
    }
    setFormError('');
  }, [selectedCategory, modalMode, isFormModalOpen]);

  // Form submit (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNameInput.trim()) {
      setFormError('لطفا نام معیار قطعه را وارد کنید');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const url = modalMode === 'edit' && selectedCategory 
        ? `/api/categories/${selectedCategory.Id || selectedCategory.PartID}` 
        : '/api/categories';
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PartName: partNameInput.trim(),
          OtherNames: otherNamesInput.trim(),
          PartCollection: partCollectionInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchProducts();
        setIsFormModalOpen(false);
      } else {
        setFormError(data.error || 'خطا در ثبت اطلاعات');
      }
    } catch (err) {
      setFormError('خطا در اتصال به سرور');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete submit
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setDeleteError('لطفا برای تایید کلمه delete را وارد کنید');
      return;
    }
    if (!selectedCategory) return;

    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/categories/${selectedCategory.Id || selectedCategory.PartID}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProducts();
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
        setDeleteConfirmText('');
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'خطا در حذف قطعه');
      }
    } catch (err) {
      setDeleteError('خطا در اتصال به سرور');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    let csvContent = "";
    let fileName = "";
    if (partsUploadMethod === '1') {
      csvContent = "PartName,OtherNames,PartCollection\n" +
                   "تسمه دینام,\"تسمه آلترناتور, تسمه اصلی, تسمه موتور\",سیستم موتور\n" +
                   "دنده اسپراکت,\"دنده چرخ زنجیر, دنده زنجیر گردان\",گیربکس و انتقال قدرت\n";
      fileName = "parts_sample_method1.csv";
    } else {
      csvContent = "Together,PartCollection\n" +
                   "\"تسمه دینام - تسمه آلترناتور - تسمه اصلی - تسمه موتور\nدنده اسپراکت - دنده چرخ زنجیر - دنده زنجیر گردان\",سیستم فنی\n";
      fileName = "parts_sample_method2.csv";
    }
    // Add UTF-8 BOM so Excel opens Persian correctly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV file change
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvError('');
      setCsvSuccessMessage('');
    }
  };

  // CSV Submit
  const handleCsvUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError('لطفا یک فایل معتبر انتخاب کنید');
      return;
    }
    setCsvLoading(true);
    setCsvError('');
    setCsvSuccessMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            setCsvError('محتوای فایل خالی است');
            setCsvLoading(false);
            return;
          }

          const rows = parseCsvContent(text);
          if (rows.length <= 1) {
            setCsvError('فرمت فایل نامعتبر است (تنها سربرگ وجود دارد یا فایل خالی است)');
            setCsvLoading(false);
            return;
          }

          const headers = rows[0].map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
          const uploadData: { PartName: string, OtherNames: string, PartCollection?: string }[] = [];

          if (partsUploadMethod === '1') {
            let nameIdx = headers.findIndex(h => h === 'partname');
            let othersIdx = headers.findIndex(h => h === 'othernames');
            let collectionIdx = headers.findIndex(h => h === 'partcollection');
            if (nameIdx === -1) nameIdx = 0;
            if (othersIdx === -1) othersIdx = 1;

            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i];
              if (cells.length === 0) continue;
              const pName = (cells[nameIdx] || '').replace(/^["']|["']$/g, '').trim();
              const oNames = (cells[othersIdx] || '').replace(/^["']|["']$/g, '').trim();
              const col = (collectionIdx !== -1) ? (cells[collectionIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
              
              uploadData.push({
                PartName: pName,
                OtherNames: oNames,
                PartCollection: col
              });
            }
          } else {
            // Method 2: Together and PartCollection
            let togetherIdx = headers.findIndex(h => h === 'together');
            let collectionIdx = headers.findIndex(h => h === 'partcollection');
            if (togetherIdx === -1) {
              setCsvError('ستون Together در سربرگ فایل جهت شناسایی الزامی است.');
              setCsvLoading(false);
              return;
            }

            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i];
              if (cells.length === 0) continue;
              const togetherRaw = cells[togetherIdx] || '';
              const partCollection = (collectionIdx !== -1) ? (cells[collectionIdx] || '').replace(/^["']|["']$/g, '').trim() : '';

              if (!togetherRaw.trim()) {
                uploadData.push({
                  PartName: '',
                  OtherNames: '',
                  PartCollection: partCollection
                });
                continue;
              }

              // Split cells by any line breaks
              const cellLines = togetherRaw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
              for (const line of cellLines) {
                // Split each line by delimiters: - _ , ،
                const partsOfName = line.split(/[-_،,]/).map(p => p.trim()).filter(Boolean);
                if (partsOfName.length > 0) {
                  const partName = partsOfName[0];
                  const otherNames = partsOfName.slice(1).join(', ');
                  uploadData.push({
                    PartName: partName,
                    OtherNames: otherNames,
                    PartCollection: partCollection
                  });
                } else {
                  uploadData.push({
                    PartName: '',
                    OtherNames: line,
                    PartCollection: partCollection
                  });
                }
              }
            }
          }

          if (uploadData.length === 0) {
            setCsvError('هیچ دیتای معتبری در فایل یافت نشد');
            setCsvLoading(false);
            return;
          }

          const response = await fetch('/api/categories/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadData)
          });
          const result = await response.json();

          if (response.ok) {
            setCsvSuccessMessage(`عملیات موفقیت‌آمیز بود! تعداد ${result.insertedCount || 0} قطعه با موفقیت فیلتر یا ذخیره شد. تعداد ${result.skippedCount || 0} مورد به علت تکراری بودن نادیده گرفته شد.`);
            if (result.failedList && result.failedList.length > 0) {
              setCsvFailedList(result.failedList);
            } else {
              setCsvFailedList([]);
            }
            setCsvFile(null);
            fetchProducts();
          } else {
            setCsvError(result.error || 'خطا در آپلود انبوه قطعات');
          }
        } catch (innerErr) {
          setCsvError('خطا در پردازش فایل');
        } finally {
          setCsvLoading(false);
        }
      };
      
      reader.onerror = () => {
        setCsvError('خطا در خواندن فایل');
        setCsvLoading(false);
      };

      reader.readAsText(csvFile, 'UTF-8');
    } catch (err) {
      setCsvError('خطا در بارگذاری فایل');
      setCsvLoading(false);
    }
  };

  // Download Failed Categories CSV report with failures and reasons
  const handleDownloadFailedCsvReport = () => {
    if (csvFailedList.length === 0) return;
    
    let csvContent = "PartName,OtherNames,PartCollection,Reason\n";
    
    csvFailedList.forEach(item => {
      const escapeVal = (text: any) => {
        if (!text) return '';
        const cleaned = String(text).replace(/"/g, '""');
        return `"${cleaned}"`;
      };
      
      csvContent += `${escapeVal(item.PartName)},${escapeVal(item.OtherNames)},${escapeVal(item.PartCollection)},${escapeVal(item.Reason)}\n`;
    });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "failed_parts_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample CSV for Products
  const handleDownloadProdSample = () => {
    let csvContent = "";
    if (prodUploadMethod === '1') {
      csvContent = "TargetName,TargetModel,PartNumber,ProductInformation,SRTID\n" +
                   "پمپ هیدرولیک,کوماتسو PC220-7,708-2L-00300,پمپ مادر اصلی هیدرولیک بیل کوماتسو,SRT-1001\n";
    } else {
      csvContent = "ProductName,PartNumber,ProductInformation,SRTID\n" +
                   "پمپ هیدرولیک کوماتسو PC220-7,708-2L-00300,پمپ مادر اصلی,SRT-1001\n";
    }
    // Add UTF-8 BOM so Excel opens Persian correctly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Failed Products CSV report with errors
  const handleDownloadFailedProdReport = () => {
    if (prodFailedList.length === 0) return;
    
    let csvContent = "TargetName,TargetModel,PartNumber,ProductInformation,SRTID,Error\n";
    
    prodFailedList.forEach(item => {
      const escape = (text: string) => {
        if (!text) return '';
        const cleaned = text.replace(/"/g, '""');
        return `"${cleaned}"`;
      };
      
      csvContent += `${escape(item.TargetName)},${escape(item.TargetModel)},${escape(item.PartNumber)},${escape(item.ProductInformation)},${escape(item.SRTID)},${escape(item.Error)}\n`;
    });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "failed_products_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Successful Products CSV report
  const handleDownloadSuccessProdReport = () => {
    if (prodSuccessList.length === 0) return;
    
    let csvContent = "TargetName,TargetModel,PartNumber,ProductInformation,SRTID,PartName,OtherNames,PartID,PartCollection\n";
    
    prodSuccessList.forEach(item => {
      const escape = (text: any) => {
        if (!text) return '';
        const cleaned = String(text).replace(/"/g, '""');
        return `"${cleaned}"`;
      };
      
      csvContent += `${escape(item.TargetName)},${escape(item.TargetModel)},${escape(item.PartNumber)},${escape(item.ProductInformation)},${escape(item.SRTID)},${escape(item.PartName)},${escape(item.OtherNames)},${escape(item.PartID)},${escape(item.PartCollection)}\n`;
    });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "لیست ایمپورت محصولات موفق.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prod CSV file change
  const handleProdCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProdCsvFile(e.target.files[0]);
      setProdCsvError('');
      setProdCsvSuccessMessage('');
      setProdFailedList([]);
      setProdSuccessList([]);
    }
  };

  const parseCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const parseCsvContent = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let insideQuote = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        row.push(cell.trim());
        result.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    
    if (cell || row.length > 0) {
      row.push(cell.trim());
      result.push(row);
    }
    
    return result.filter(r => r.some(c => c !== ''));
  };

  // Prod CSV Submit
  const handleProdCsvUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodCsvFile) {
      setProdCsvError('لطفا یک فایل معتبر انتخاب کنید');
      return;
    }
    setProdCsvLoading(true);
    setProdCsvError('');
    setProdCsvSuccessMessage('');
    setProdFailedList([]);
    setProdSuccessList([]);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            setProdCsvError('محتوای فایل خالی است');
            setProdCsvLoading(false);
            return;
          }

          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length <= 1) {
            setProdCsvError('فرمت فایل نامعتبر است (تنها سربرگ وجود دارد یا فایل خالی است)');
            setProdCsvLoading(false);
            return;
          }

          // Parse CSV headers case-insensitively to match properties
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          
          let uploadData: any[] = [];
          if (prodUploadMethod === '1') {
            let targetNameIdx = headers.findIndex(h => h.toLowerCase() === 'targetname');
            let targetModelIdx = headers.findIndex(h => h.toLowerCase() === 'targetmodel');
            let partNumberIdx = headers.findIndex(h => h.toLowerCase() === 'partnumber');
            let infoIdx = headers.findIndex(h => h.toLowerCase() === 'productinformation');
            let srtidIdx = headers.findIndex(h => h.toLowerCase() === 'srtid');

            if (targetNameIdx === -1 || targetModelIdx === -1) {
              setProdCsvError('ستون‌های TargetName و TargetModel در سربرگ فایل جهت شناسایی الزامی هستند.');
              setProdCsvLoading(false);
              return;
            }

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const cells = parseCsvLine(line);
              const cleanTName = (cells[targetNameIdx] || '').replace(/^["']|["']$/g, '').trim();
              const cleanTModel = (cells[targetModelIdx] || '').replace(/^["']|["']$/g, '').trim();
              if (cleanTName || cleanTModel) {
                uploadData.push({
                  TargetName: cleanTName,
                  TargetModel: cleanTModel,
                  PartNumber: (partNumberIdx !== -1 ? (cells[partNumberIdx] || '') : '').replace(/^["']|["']$/g, '').trim(),
                  ProductInformation: (infoIdx !== -1 ? (cells[infoIdx] || '') : '').replace(/^["']|["']$/g, '').trim(),
                  SRTID: (srtidIdx !== -1 ? (cells[srtidIdx] || '') : '').replace(/^["']|["']$/g, '').trim()
                });
              }
            }
          } else {
            let productNameIdx = headers.findIndex(h => h.toLowerCase() === 'productname');
            let partNumberIdx = headers.findIndex(h => h.toLowerCase() === 'partnumber');
            let infoIdx = headers.findIndex(h => h.toLowerCase() === 'productinformation');
            let srtidIdx = headers.findIndex(h => h.toLowerCase() === 'srtid');
            let partCollectionIdx = headers.findIndex(h => h.toLowerCase() === 'partcollection');

            if (productNameIdx === -1) {
              setProdCsvError('ستون ProductName در سربرگ فایل جهت شناسایی الزامی است.');
              setProdCsvLoading(false);
              return;
            }

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const cells = parseCsvLine(line);
              const cleanPName = (cells[productNameIdx] || '').replace(/^["']|["']$/g, '').trim();
              if (cleanPName) {
                uploadData.push({
                  ProductName: cleanPName,
                  PartNumber: (partNumberIdx !== -1 ? (cells[partNumberIdx] || '') : '').replace(/^["']|["']$/g, '').trim(),
                  ProductInformation: (infoIdx !== -1 ? (cells[infoIdx] || '') : '').replace(/^["']|["']$/g, '').trim(),
                  SRTID: (srtidIdx !== -1 ? (cells[srtidIdx] || '') : '').replace(/^["']|["']$/g, '').trim(),
                  PartCollection: (partCollectionIdx !== -1 ? (cells[partCollectionIdx] || '') : '').replace(/^["']|["']$/g, '').trim()
                });
              }
            }
          }

          if (uploadData.length === 0) {
            setProdCsvError('هیچ دیتای معتبری در فایل یافت نشد');
            setProdCsvLoading(false);
            return;
          }

          const response = await fetch(`/api/machine-parts/bulk?method=${prodUploadMethod}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadData)
          });
          const result = await response.json();

          if (response.ok) {
            const failures = result.failedCount || 0;
            const successCount = result.insertedCount || 0;
            setProdSuccessList(result.inserted || []);
            if (failures > 0) {
              setProdFailedList(result.failed || []);
              setProdCsvError(`ثبت دسته‌جمعی تکمیل شد. ${successCount} محصول اضافه شد، اما تعداد ${failures} مورد با خطا مواجه شدند. گزارش خطا را دانلود و بررسی نمایید.`);
            } else {
              setProdCsvSuccessMessage(`عملیات موفقیت‌آمیز بود! ${successCount} محصول جدید با موفقیت اضافه شد.`);
              setProdCsvFile(null);
            }
            fetchProducts();
          } else {
            setProdCsvError(result.error || 'خطا در آپلود انبوه محصولات');
          }
        } catch (innerErr) {
          setProdCsvError('خطا در پردازش فایل');
        } finally {
          setProdCsvLoading(false);
        }
      };
      
      reader.onerror = () => {
        setProdCsvError('خطا در خواندن فایل');
        setProdCsvLoading(false);
      };

      reader.readAsText(prodCsvFile, 'UTF-8');
    } catch (err) {
      setProdCsvError('خطا در بارگذاری فایل');
      setProdCsvLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 mr-2">نام اصلی قطعه</label>
            <input 
              value={searchTerm1}
              onChange={(e) => setSearchTerm1(e.target.value)}
              placeholder="مثلا: پمپ هیدرولیک"
              className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 mr-2">سایر اسامی / کد</label>
            <input 
              value={searchTerm2}
              onChange={(e) => setSearchTerm2(e.target.value)}
              placeholder="جستجوی ثانویه..."
              className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-end flex-shrink-0">
            <button 
              onClick={fetchProducts}
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors font-medium"
            >
              <Search size={18} />
              <span>جستجو</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden min-h-[150px] relative">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">لیست قطعات</h3>
            {hasPermission('manage_categories') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCsvError('');
                    setCsvSuccessMessage('');
                    setCsvFile(null);
                    setCsvFailedList([]);
                    setIsCsvModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-bold border border-emerald-200/40"
                  title="آپلود دسته‌جمعی قطعات (CSV)"
                >
                  <Upload size={13} />
                  <span>Parts</span>
                </button>
                <button
                  onClick={() => {
                    setProdCsvError('');
                    setProdCsvSuccessMessage('');
                    setProdCsvFile(null);
                    setProdFailedList([]);
                    setIsProdCsvModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-bold border border-indigo-200/40"
                  title="آپلود دسته‌جمعی محصولات (CSV)"
                >
                  <Upload size={13} />
                  <span>Products</span>
                </button>
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400">{products.length} مورد</span>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
          {products.map((p, idx) => (
            <motion.div 
              key={p.Id || p.PartID}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/parts/${p.PartName}`)}
              className="px-6 py-4 hover:bg-amber-50/50 cursor-pointer transition-colors group flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-right">
                  <h4 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors uppercase">{p.PartName}</h4>
                  {p.PartCollection && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/40">
                      {p.PartCollection}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.OtherNames || 'بدون مشخصات ثانویه'}</p>
              </div>

              {hasPermission('manage_categories') && (
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedCategory(p);
                      setModalMode('edit');
                      setIsFormModalOpen(true);
                    }}
                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="ویرایش قطعه"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(p);
                      setDeleteConfirmText('');
                      setDeleteError('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="حذف قطعه"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {!loading && products.length === 0 && (
            <div className="p-12 text-center text-slate-400">موردی یافت نشد.</div>
          )}
        </div>
      </div>

      {hasPermission('manage_categories') && (
        <button 
          onClick={() => {
            setSelectedCategory(null);
            setModalMode('add');
            setIsFormModalOpen(true);
          }}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-300 transition-all font-bold flex items-center justify-center gap-2 group bg-white shadow-sm"
        >
          <Plus size={20} />
          <span>اضافه کردن قطعه جدید (دسته بندی)</span>
        </button>
      )}

      {/* category form popup modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right" dir="rtl" onClick={e => e.target === e.currentTarget && setIsFormModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === 'add' ? 'افزودن قطعه جدید' : 'ویرایش قطعه'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-xs font-bold leading-relaxed">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 mr-1.5 mb-1 bg-white">نام معیار قطعه <span className="text-red-500">*</span></label>
                <input
                  required
                  placeholder="مثلا: پمپ هیدرولیک"
                  value={partNameInput}
                  onChange={e => setPartNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 mr-1.5 mb-1">دسته بندی قطعه <span className="text-slate-400 font-normal">(اختیاری)</span></label>
                <input
                  placeholder="مثلا: هیدرولیک"
                  value={partCollectionInput}
                  onChange={e => setPartCollectionInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 mr-1.5 mb-1">دیگر اسامی قطعه <span className="text-slate-400 font-normal">(جدا شده با کاما انگلیسی)</span></label>
                <input
                  placeholder="مثلا: Hydraulic Pump, پمپ اصلی"
                  value={otherNamesInput}
                  onChange={e => setOtherNamesInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-100/40 text-sm flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{modalMode === 'add' ? 'ثبت قطعه' : 'اعمال تغییرات'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl transition-colors border border-slate-200/50 text-sm"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* category delete confirmation modal */}
      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right" dir="rtl" onClick={e => e.target === e.currentTarget && setIsDeleteModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">تایید حذف قطعه</h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-xs font-bold leading-relaxed">
                  {deleteError}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  آیا از حذف قطعه <b className="text-slate-800 font-black">«{selectedCategory.PartName}»</b> و پارت‌های استعلام قیمت وابسته به آن اطمینان دارید؟ با حذف این قطعه کلیه قیمت‌ها و سابقه استعلام‌های آن برای همیشه حذف خواهند شد.
                </p>
                <p className="text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-lg leading-relaxed">
                  جهت جلوگیری از حذف ناخواسته، خواهشمند است کلمه <b className="font-mono text-sm tracking-wider underline">delete</b> را در کادر زیر عینا وارد نمایید.
                </p>
              </div>

              <div className="space-y-1">
                <input
                  required
                  placeholder="delete"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-500 rounded-xl outline-none transition-all text-sm text-center font-mono tracking-wider font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText.toLowerCase() !== 'delete'}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-100/40 text-sm flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>حذف قطعی قطعه</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl transition-colors border border-slate-200/50 text-sm"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CSV Batch Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 text-right overflow-y-auto" dir="rtl" onClick={e => e.target === e.currentTarget && setIsCsvModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-7">آپلود دسته‌جمعی قطعات از CSV</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">ثبت قطعات جدید یا دسته‌بندی آن‌ها با فایل اکسل/CSV به دلخواه</p>
              </div>
              <button 
                onClick={() => setIsCsvModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Method selection */}
            <div className="px-6 pt-5">
              <span className="text-[11px] font-black text-slate-400 block mb-2 mr-1">انتخاب روش آپلود قطعات:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPartsUploadMethod('1');
                    setCsvError('');
                    setCsvSuccessMessage('');
                  }}
                  className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    partsUploadMethod === '1'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${partsUploadMethod === '1' ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>روش اول: ارسال معیار قطعه</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPartsUploadMethod('2');
                    setCsvError('');
                    setCsvSuccessMessage('');
                  }}
                  className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    partsUploadMethod === '2'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${partsUploadMethod === '2' ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>روش دوم: آپلود محصولات (Together)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCsvUploadSubmit} className="p-6 space-y-5">
              {csvError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed shadow-sm flex gap-2.5 items-start">
                  <span className="text-rose-500 shrink-0 select-none">❌</span>
                  <span>{csvError}</span>
                </div>
              )}
              {csvSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold leading-relaxed shadow-sm flex gap-2.5 items-start">
                  <span className="text-emerald-500 shrink-0 select-none">✅</span>
                  <span>{csvSuccessMessage}</span>
                </div>
              )}

              {/* Dynamic Guidelines */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-500 mr-1 block">۱. دریافت فایل راهنما و الگو</span>
                {partsUploadMethod === '1' ? (
                  <div className="bg-amber-50/60 border border-amber-200/30 p-4 rounded-2xl flex gap-3 text-slate-700">
                    <Info size={18} className="shrink-0 mt-0.5 text-amber-500" />
                    <div className="text-xs space-y-1.5 leading-relaxed font-semibold">
                      <p className="font-extrabold text-amber-800">راهنمای روش اول (ارسال معیار قطعه):</p>
                      <p className="text-slate-500">در این حالت، سیستم فایل نمونه کلاسیک را بررسی و بارگذاری می‌کند. هر ردیف مشخصات یک قطعه است:</p>
                      <ul className="list-disc list-inside mr-2 text-[11px] text-slate-600 space-y-1 font-medium">
                        <li><b>PartName</b>: نام معیار اصلی قطعه (مانند: رادیاتور آب - اجباری)</li>
                        <li><b>OtherNames</b>: کلمات کلیدی، نام‌های ثانویه یا کد فنی (مترادف‌ها)</li>
                        <li><b>PartCollection</b>: دسته‌بندی قطعه (اختیاری)</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50 border border-indigo-100/60 p-4 rounded-2xl flex gap-3 text-slate-700">
                    <Info size={18} className="shrink-0 mt-0.5 text-indigo-500" />
                    <div className="text-xs space-y-1.5 leading-relaxed font-semibold">
                      <p className="font-extrabold text-indigo-800">راهنمای روش دوم (آپلود محصولات Together):</p>
                      <p className="text-slate-500">جهت آپلود همزمان چند خط داخل یک سلول اکسل ذیل یک دسته‌بندی مرجع مشترک:</p>
                      <ul className="list-disc list-inside mr-2 text-[11px] text-slate-600 space-y-1 font-medium">
                        <li><b>Together</b>: در هر خط، اسامی مختلف یک قطعه با جداکننده‌های <code className="font-bold text-slate-800">- _ , ،</code> ثبت گشته، اولین کلمه به عنوان نام معیار و مابقی به دیگر اسامی ارسال خواهد شد.</li>
                        <li><b>PartCollection</b>: نام دسته‌بندی مرجع تمامی قطعات این سطر (مانند: سیستم تعلیق)</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Download size={14} />
                    <span>دانلود قالب روش {partsUploadMethod === '1' ? 'اول' : 'دوم'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Section */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-500 mr-1 block">۲. آپلود فایل قطعات CSV</span>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-7 text-center bg-slate-50/20 hover:border-amber-400 transition-colors flex flex-col items-center justify-center gap-2 group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-black text-slate-700">
                    {csvFile ? csvFile.name : 'انتخاب فایل CSV قطعات'}
                  </span>
                  <span className="text-[10px] text-slate-400">یا فایل خود را داخل این کادر بکشید و رها کنید</span>
                </div>
              </div>

              {/* Errors list reporting */}
              {csvFailedList.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-right space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-extrabold">گزارش ردیف‌های ناموفق در ورود قطعات (تعداد: {csvFailedList.length} ردیف):</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
                    متأسفانه برخی ردیف‌ها با خطا یا تکراری بودن مواجه شدند. برای دانلود فایل گزارش دقیق عیب‌یابی شامل ستون دلیل ناموفق بودن، روی دکمه زیر کلیک کنید.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadFailedCsvReport}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download size={14} />
                    <span>دانلود فایل ردیف‌های ناموفق با ذکر دلیل خطای تک‌تک موارد</span>
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={csvLoading || !csvFile}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>شروع عملیات پردازش و آپلود فله‌ای</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-2xl transition-all border border-slate-200/50 text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Products CSV Batch Upload Modal */}
      {isProdCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 text-right overflow-y-auto" dir="rtl" onClick={e => e.target === e.currentTarget && setIsProdCsvModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-7">آپلود دسته‌جمعی محصولات از CSV</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">تعیین سریع اطلاعات محصولات با سیستم هوشمند هواداران کار ماشین‌آلات</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsProdCsvModalOpen(false)} 
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProdCsvUploadSubmit} className="p-6 space-y-6">
              {/* Segmented Control Method Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 mr-1 block">انتخاب روش آپلود اطلاعات:</span>
                <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                  <button
                    type="button"
                    onClick={() => setProdUploadMethod('1')}
                    className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 complex-transition ${
                      prodUploadMethod === '1'
                        ? 'bg-white text-amber-700 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${prodUploadMethod === '1' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    روش اول: ارسال TargetName و TargetModel
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdUploadMethod('2')}
                    className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 complex-transition ${
                      prodUploadMethod === '2'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${prodUploadMethod === '2' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    روش دوم: ارسال ProductName کتبی
                  </button>
                </div>
              </div>

              {/* Alert Info Box */}
              <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed flex gap-3 items-start border transition-all ${
                prodUploadMethod === '1'
                  ? 'bg-amber-50/50 border-amber-100 text-amber-800'
                  : 'bg-indigo-50/50 border-indigo-100 text-indigo-800'
              }`}>
                <Info size={16} className={`shrink-0 mt-0.5 ${prodUploadMethod === '1' ? 'text-amber-500' : 'text-indigo-500'}`} />
                <div>
                  {prodUploadMethod === '1' ? (
                    <span><strong>روش تفکیکی:</strong> در این متد نام دستگاه و مدل به‌صورت جدا در ستون‌های <code className="bg-amber-100/50 font-bold px-1.5 py-0.5 rounded text-amber-900">TargetName</code> و <code className="bg-amber-100/50 font-bold px-1.5 py-0.5 rounded text-amber-900">TargetModel</code> دریافت و مستقیم جفت می‌شوند.</span>
                  ) : (
                    <span><strong>روش هوشمند کتبی:</strong> سیستم به‌صورت خودکار نام کامل کتبی محصول (<code className="bg-indigo-100/50 font-bold px-1.5 py-0.5 rounded text-indigo-900">ProductName</code>) را با الگوریتم‌های پیشرفته تحلیل کرده و سهم مدل و نوع دستگاه را تفکیک و استخراج می‌کند.</span>
                  )}
                </div>
              </div>

              {/* Server Response Messages */}
              {prodCsvError && (
                <div className="p-4 bg-rose-50 border border-rose-150 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                  {prodCsvError}
                </div>
              )}
              {prodCsvSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-2xl text-xs font-bold leading-relaxed flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                  {prodCsvSuccessMessage}
                </div>
              )}

              {/* Steps Layout */}
              <div className="space-y-4">
                {/* Step 1: Download Sample File */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center">
                        ۱
                      </div>
                      <span className="text-xs font-extrabold text-slate-700">دانلود فایل الگو و نمونه جدول</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadProdSample}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} className="text-slate-450" />
                      <span>دانلود فایل نمونه .csv</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pr-8">
                    {prodUploadMethod === '1' ? (
                      <>
                        خواهشمند است الگوی معتبر شامل ستون‌های اصلی <b className="text-slate-600 font-bold">TargetName, TargetModel, PartNumber, ProductInformation, SRTID</b> را دانلود فرمایید. نام دستگاه ها جهت انتساب اتوماتیک به دسته قطعات استفاده می‌شود.
                      </>
                    ) : (
                      <>
                        خواهشمند است الگوی هوشمند شامل ستون‌های اصلی <b className="text-slate-600 font-bold">ProductName, PartNumber, ProductInformation, SRTID</b> را دانلود فرمایید. سیستم هوشمند فیلد نام کتبی را آنالیز می‌کند.
                      </>
                    )}
                  </p>
                </div>

                {/* Step 2: Upload File Area */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center">
                      ۲
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">انتخاب و بارگذاری سند CSV شما</span>
                  </div>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    prodCsvFile 
                      ? 'border-emerald-400 bg-emerald-50/5 hover:border-emerald-500' 
                      : 'border-slate-200 bg-slate-50/25 hover:border-indigo-400'
                  }`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleProdCsvFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {prodCsvFile ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                          <Check size={22} className="stroke-[3]" />
                        </div>
                        <span className="text-xs font-black text-slate-700 max-w-full truncate px-4">
                          {prodCsvFile.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg font-bold">
                            آماده شروع آپلود ({(prodCsvFile.size / 1024).toFixed(1)} کیلوبایت)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setProdCsvFile(null);
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline relative z-20"
                          >
                            حذف فایل
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-indigo-50/50 text-indigo-500 rounded-full flex items-center justify-center">
                          <Upload size={20} className="stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          انتخاب سند CSV و ردیف‌های محصولات
                        </span>
                        <span className="text-[10px] text-slate-400">فایل اکسل یا CSV را به اینجا بکشید یا کلیک کنید</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Errors list reporting */}
              {prodFailedList.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-right space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-extrabold">گزارش خطاهای رخ داده در ثبت گروهی:</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                    متأسفانه تعداد {prodFailedList.length} ردیف با خطا مواجه شد و ثبت نگردید. جهت دریافت فایل گزارش دقیق عیب‌یابی و جزییات خطاها دکمه زیر را کلیک کنید.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadFailedProdReport}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download size={14} />
                    <span>دانلود مستقیم فایل گزارش خطاهای محصولات</span>
                  </button>
                </div>
              )}

              {/* Success reports list */}
              {prodSuccessList.length > 0 && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-right space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-extrabold">گزارش محصولات ثبت شده موفق:</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                    تعداد {prodSuccessList.length} محصول جدید با نسبت‌یابی اتوماتیک دسته‌بندی و تعیین مشخصات با موفقیت در دیتابیس ثبت شدند. جهت دریافت گزارش کلیک کنید.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadSuccessProdReport}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download size={14} />
                    <span>دانلود گزارش اکسل محصولات موفق</span>
                  </button>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={prodCsvLoading || !prodCsvFile}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-extrabold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                >
                  {prodCsvLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} className="stroke-[3]" />}
                  <span>شروع عملیات پردازش و آپلود گروهی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProdCsvModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-extrabold rounded-xl transition-all border border-slate-200/50 text-sm active:scale-[0.98]"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MachinePartListPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<{ 
    name: string; 
    srtId?: string; 
    productId: string;
    targetName?: string;
    targetModel?: string;
    partNumber?: string;
    productInformation?: string;
  }[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [visibleSrtId, setVisibleSrtId] = useState<string | null>(null);

  const fetchMachineParts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: categoryName || '' });
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/machine-parts?${params.toString()}`);
      const rawData = await res.json();
      const data = mapToPascalCase(rawData);
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        console.error('Expected array for items, got:', data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryInfo = async () => {
    try {
      const res = await fetch(`/api/categories?search1=${categoryName}`);
      const rawData = await res.json();
      const data = mapToPascalCase(rawData);
      const info = data.find((p: ProductInfo) => p.PartName === categoryName);
      if (info) {
        setCategoryInfo(info);
        if (info.PartID) {
          fetch(`/api/views/part/${info.PartID}`, { method: 'POST' }).catch(console.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      const res = await fetch(`/api/machine-parts/${deleteData.Id || deleteData.id || deleteData.productId || deleteData.ProductID}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMachineParts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMachineParts();
    fetchCategoryInfo();
  }, [categoryName]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">{categoryName}</h2>
        <p className="text-sm text-slate-500">انتخاب قطعه برای دستگاه مشخص</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMachineParts()}
              placeholder="جستجوی مدل دستگاه..."
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={fetchMachineParts}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden relative min-h-[150px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-amber-500" size={28} />
          </div>
        )}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-700 text-sm">لیست قطعات به همراه دستگاه</h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
          {items.map((item, idx) => (
            <motion.div 
              key={item.productId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="px-6 py-5 hover:bg-amber-50/50 cursor-pointer transition-colors group flex items-center justify-between"
            >
              <div 
                onClick={() => navigate(`/quotes/${item.name}`)}
                className="flex-1 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors uppercase">{item.name}</h4>
                  </div>
                  {(() => {
                    const srtVal = item.srtId || item.srtID || item.SRTID || item.srtid;
                    return srtVal ? (
                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                        SRTID: {srtVal}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              
              {hasPermission('manage_parts') && (
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditData(item);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit size={17} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteData(item);
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {!loading && items.length === 0 && (
            <div className="p-12 text-center text-slate-400">موردی یافت نشد.</div>
          )}
        </div>
      </div>

      {hasPermission('manage_parts') && (
        <button 
          onClick={() => {
            setEditData(null);
            setIsModalOpen(true);
          }}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-300 transition-all font-bold flex items-center justify-center gap-2 group"
        >
          <Plus size={20} />
          <span>اضافه کردن محصول جدید</span>
        </button>
      )}

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        categoryName={categoryName || ''}
        categoryInfo={categoryInfo}
        onSuccess={fetchMachineParts}
        editData={editData}
      />

      <DeleteConfirmModal 
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        productName={deleteData?.name || ''}
        onConfirm={handleDelete}
      />
    </div>
  );
};

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const sal_a = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy2 = jy - 979;
  let jm2 = jm - 1;
  let jd2 = jd - 1;

  let j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
  for (let i = 0; i < jm2; ++i) j_day_no += sal_a[i + 1];

  j_day_no += jd2;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
  g_day_no = g_day_no % 146097;

  let leap = 1;
  if (g_day_no >= 36525) { /* 36525 = 365*100 + 100/4 */
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 1 */
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = 0;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
  g_day_no = g_day_no % 1461;

  if (g_day_no >= 366) {
    leap = 0;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  const sal_g = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gd = g_day_no + 1;
  let gm = 0;
  for (let i = 1; i <= 12; i++) {
    const di = (i === 2 && leap === 1) ? 29 : sal_g[i];
    if (gd <= di) {
      gm = i;
      break;
    }
    gd -= di;
  }

  return new Date(gy, gm - 1, gd);
}

function parseJalaliStringToDate(jalaliStr: string): Date | null {
  if (!jalaliStr || jalaliStr === 'ثبت اولیه' || jalaliStr === '---' || jalaliStr.includes('ثبت')) return null;
  // Convert Persian/Arabic digits to English digits
  const engStr = jalaliStr.replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
                          .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  
  const matches = engStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!matches) return null;
  const jy = parseInt(matches[1], 10);
  const jm = parseInt(matches[2], 10);
  const jd = parseInt(matches[3], 10);
  return jalaliToGregorian(jy, jm, jd);
}

function getEstimatedPriceInfo(q: ProductPrice, dollarRate: string) {
  const currentPrice = parseFloat((q.Price || '').replace(/\D/g, '')) || 0;
  const rateToday = parseFloat(dollarRate.replace(/\D/g, '')) || 0;
  const rateRegistered = parseFloat((q.DailyDollarRate || '').replace(/\D/g, '')) || 0;

  let calculatedEstimatedPrice = currentPrice;
  if (rateRegistered > 0 && rateToday > 0) {
    calculatedEstimatedPrice = Math.round(currentPrice * (rateToday / rateRegistered));
  }

  // Calculate elapsed days
  const registeredDate = parseJalaliStringToDate(q.LastPriceUpdateDate);
  const todayDate = new Date();
  let elapsedDays = 999;
  if (registeredDate) {
    const diffTime = todayDate.getTime() - registeredDate.getTime();
    elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 3600 * 24)));
  }

  const validityDays = q.PriceValidityDays || 7;
  const isPriceStillValid = registeredDate && (elapsedDays <= validityDays);
  const dollarRateChangePct = rateRegistered > 0 ? ((rateToday - rateRegistered) / rateRegistered) * 100 : 0;
  const hasMoreThan5PercentDollarChange = Math.abs(dollarRateChangePct) > 5;

  const isPriceDecrease = calculatedEstimatedPrice < currentPrice;

  // Unreliable status overrides
  const isOver150Days = elapsedDays > 150;
  const isOver30PercentDollarChange = Math.abs(dollarRateChangePct) >= 30;
  const isEstimatedPriceUnreliable = isOver150Days || isOver30PercentDollarChange;

  let shouldShowEstimatedPrice = false;

  if (isEstimatedPriceUnreliable) {
    // If >150 days or dollar difference >30%, force show with warning
    shouldShowEstimatedPrice = true;
  } else {
    // Ordinary rules
    if (!isPriceDecrease) {
      if (!isPriceStillValid) {
        // Price validity expired: must calculate
        shouldShowEstimatedPrice = true;
      } else {
        // Price still valid: calculate only if dollar has changed more than 5%
        if (hasMoreThan5PercentDollarChange) {
          shouldShowEstimatedPrice = true;
        }
      }
    }
  }

  const pctIncrease = currentPrice > 0 ? Math.round(((calculatedEstimatedPrice - currentPrice) / currentPrice) * 100) : 0;

  return {
    shouldShowEstimatedPrice,
    calculatedEstimatedPrice,
    isEstimatedPriceUnreliable,
    pctIncrease,
    currentPrice
  };
}

const QuoteDetailModal = ({ 
  isOpen, 
  onClose, 
  q,
  dollarRate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  q: ProductPrice | null; 
  dollarRate: string;
}) => {
  if (!isOpen || !q) return null;

  const {
    shouldShowEstimatedPrice,
    calculatedEstimatedPrice,
    isEstimatedPriceUnreliable,
    pctIncrease
  } = getEstimatedPriceInfo(q, dollarRate);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 flex items-center justify-between text-white bg-slate-800">
          <h3 className="font-bold text-base">جزئیات قیمت استعلام شده</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* باکس اصلی */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
            <span className="font-black text-lg text-slate-800 tracking-tight uppercase leading-snug">
              {q.ProductName}
            </span>
            {q.Material && (
              <span className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-xl w-fit">
                {q.Material}
              </span>
            )}
            <span className="text-xs font-bold text-slate-500">
              از {q.SupplierName || 'تامین‌کننده نامشخص'}
            </span>
          </div>

          {/* باکس اطلاعات قیمت */}
          <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 flex flex-col gap-3.5">
            {shouldShowEstimatedPrice ? (
              <div className="flex justify-between items-start border-b border-emerald-100/30 pb-3">
                <span className="text-xs font-bold text-slate-400 pt-1">قیمت</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-slate-400 line-through font-semibold">{formatCurrency(q.Price)} تومان</span>
                  <span className="text-3xl font-black text-amber-600 tracking-tight">{formatCurrency(String(calculatedEstimatedPrice))} تومان</span>
                  <span className="text-[10px] text-amber-600 font-bold mt-0.5">قیمت تخمینی</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center border-b border-emerald-100/30 pb-2.5">
                <span className="text-xs font-bold text-slate-400">قیمت</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(q.Price)}</span>
                  <span className="text-xs font-bold text-slate-500">تومان</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs font-bold text-slate-400">تاریخ بروزرسانی قیمت</span>
              <span className="font-bold text-slate-700">{q.LastPriceUpdateDate || 'ثبت اولیه'}</span>
            </div>

            {shouldShowEstimatedPrice ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-xs font-bold text-slate-400">درصد افزایش قیمت</span>
                  {pctIncrease >= 0 ? (
                    <div className="flex items-center gap-1 bg-rose-50 text-rose-600 font-black px-2.5 py-1 rounded-xl shadow-sm text-xs border border-rose-100/60">
                      <TrendingUp size={14} className="stroke-[3]" />
                      <span className="font-mono">{pctIncrease}%+</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 font-black px-2.5 py-1 rounded-xl shadow-sm text-xs border border-emerald-100/60">
                      <TrendingUp size={14} className="stroke-[3] rotate-180" />
                      <span className="font-mono">{Math.abs(pctIncrease)}%-</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-2 bg-slate-100/50 border border-slate-250/20 rounded-xl text-xs text-slate-500 font-bold">
                قیمت استعلام معتبر است و نیازی به تخمین ندارد.
              </div>
            )}

            {shouldShowEstimatedPrice && isEstimatedPriceUnreliable && (
              <div className="p-3 bg-rose-50 border border-rose-150/50 rounded-xl text-center text-xs font-extrabold text-rose-600">
                ⚠️ هشدار: قیمت تخمینی نامعتبر است
              </div>
            )}
          </div>

          {/* باکس اطلاعات سیستمی */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/40 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
              <span className="text-xs font-bold text-slate-400">نرخ دلار در روز استعلام</span>
              <span className="font-black text-slate-700 text-sm font-sans">{q.DailyDollarRate || 'نامشخص'} <span className="text-[10px] text-slate-400">تومان</span></span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
              <span className="text-xs font-bold text-slate-400">ثبت قیمت توسط:</span>
              <span className="font-bold text-slate-700 text-sm">{q.From || 'سیستم'}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
              <span className="text-xs font-bold text-slate-400">اعتبار قیمت (روز)</span>
              <span className="font-bold text-slate-700 text-sm font-sans">{q.PriceValidityDays || '۷'} روز</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
              <span className="text-xs font-bold text-slate-400">شناسه قطعه</span>
              <span className="font-mono text-slate-500 text-xs font-semibold">{q.PartID || 'CAT-001'}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
              <span className="text-xs font-bold text-slate-400">شناسه محصول</span>
              <span className="font-mono text-slate-500 text-xs font-semibold">{q.ProductID || 'PD---'}</span>
            </div>

            {q.CRMID && (
              <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
                <span className="text-xs font-bold text-slate-400">آیدی CRM</span>
                <span className="font-mono text-indigo-600 text-xs font-bold">{q.CRMID}</span>
              </div>
            )}

            {q.SRTPriceID && (
              <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
                <span className="text-xs font-bold text-slate-400">شناسه قیمت سایت</span>
                <span className="font-mono text-sky-600 text-xs font-bold">{q.SRTPriceID}</span>
              </div>
            )}

            {q.ShelfNumber && (
              <div className="flex justify-between items-center border-b border-slate-200/30 pb-2.5">
                <span className="text-xs font-bold text-slate-400">شماره قفسه</span>
                <span className="font-mono text-amber-600 text-xs font-bold">{q.ShelfNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">شناسه قیمت</span>
              <span className="font-mono text-slate-500 text-xs font-semibold">{q.Id || q.PriceId}</span>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PriceQuoteListPage = ({ dollarRate, userName }: { dollarRate: string, userName: string }) => {
  const { productTitle } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<ProductPrice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailQuote, setDetailQuote] = useState<ProductPrice | null>(null);
  const [infoModalContent, setInfoModalContent] = useState<string | null>(null);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      if (a.Status === 'نامعتبر' && b.Status !== 'نامعتبر') return 1;
      if (a.Status !== 'نامعتبر' && b.Status === 'نامعتبر') return -1;
      return 0;
    });
  }, [quotes]);

  const srtId = useMemo(() => quotes.find(q => q.SRTID)?.SRTID, [quotes]);

  const actualProductId = useMemo(() => {
    const q = quotes.find(x => x.ProductID || x.productId);
    return q ? (q.ProductID || q.productId) : undefined;
  }, [quotes]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ title: productTitle || '' });
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/quotes?${params.toString()}`);
      const rawData = await res.json();
      const data = mapToPascalCase(rawData);
      if (Array.isArray(data)) {
        setQuotes(data);
        const firstQuote = data.find((q: any) => q.ProductID);
        const itemIdentifier = firstQuote?.ProductID || productTitle;
        if (itemIdentifier) {
          fetch(`/api/views/product/${encodeURIComponent(itemIdentifier)}`, { method: 'POST' }).catch(console.error);
        }
      } else {
        setQuotes([]);
        console.error('Expected array for quotes, got:', data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAction = async (status: 'deleted' | 'نامعتبر') => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/quotes/${deleteId}?status=${status}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchQuotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [productTitle]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">{productTitle}</h2>
        
        {srtId && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700 text-sm font-bold w-fit">
            <span>محصول در سایت وجود دارد:</span>
            <button 
              onClick={() => copyToClipboard(srtId)}
              className="bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span className="font-mono">{srtId}</span>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <p className="text-sm text-slate-500 min-h-[1.25rem]">
          {loading ? 'در حال بارگذاری جزئیات...' : (quotes[0]?.ProductInformation || 'اطلاعات تکمیلی برای این محصول ثبت نشده است')}
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuotes()}
              placeholder="جستجو در قیمت‌ها..."
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <button onClick={fetchQuotes} className="px-6 py-3 bg-slate-800 text-white rounded-xl">
             <Search size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        )}
        {sortedQuotes.map((q, idx) => {
          const { shouldShowEstimatedPrice, calculatedEstimatedPrice } = getEstimatedPriceInfo(q, dollarRate);
          return (
            <motion.div 
              key={q.Id || q.PriceId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`${q.Status === 'نامعتبر' ? 'bg-slate-50 opacity-80' : 'bg-white'} p-5 rounded-2xl shadow-md border border-slate-100 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer group relative`}
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setDetailQuote(q)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{q.SupplierName}</span>
                    {q.Status === 'نامعتبر' && (
                      <span className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded font-bold">غیرفعال</span>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-bold text-slate-800 text-lg leading-tight uppercase group-hover:text-amber-700 transition-colors">{q.ProductName}</h4>
                    {q.SRTPriceID && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalContent(`شناسه قیمت سایت: ${q.SRTPriceID}`);
                        }}
                        className="px-2 py-0.5 bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border border-sky-100 rounded text-[10px] font-bold cursor-pointer"
                        title="مشاهده شناسه قیمت سایت"
                      >
                        SITE
                      </button>
                    )}
                    {q.CRMID && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalContent(`ایدی crm: ${q.CRMID}`);
                        }}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100 rounded text-[10px] font-bold cursor-pointer"
                        title="مشاهده ایدی crm"
                      >
                        CRM
                      </button>
                    )}
                    {q.ShelfNumber && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalContent(`قفسه: ${q.ShelfNumber}`);
                        }}
                        className="px-2 py-0.5 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-100 rounded text-[10px] font-bold cursor-pointer"
                        title="مشاهده قفسه"
                      >
                        STG
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{q.Material}</span>
                    <span className="text-xs text-slate-400">{q.LastPriceUpdateDate}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 p-3 sm:p-0 rounded-xl">
                  {shouldShowEstimatedPrice ? (
                    <>
                      <span className="text-xs text-slate-400 line-through font-semibold">{formatCurrency(q.Price)} تومان</span>
                      <span className="text-xl font-black tracking-tight text-amber-600">{formatCurrency(String(calculatedEstimatedPrice))} تومان</span>
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/40">قیمت تخمینی</span>
                    </>
                  ) : (
                    <>
                      <span className={`text-2xl font-black tracking-tight ${q.Status === 'نامعتبر' ? 'text-slate-400 line-through decoration-rose-500' : 'text-emerald-600'}`}>{formatCurrency(q.Price)}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">تومان</span>
                    </>
                  )}
                </div>
              </div>

              {hasPermission('manage_quotes') && (
                <div className="absolute top-4 left-4 flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuote(q);
                      setIsPriceModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black flex items-center gap-1.5"
                    title="ثبت قیمت روز"
                  >
                    <Edit size={12} />
                    <span>ثبت قیمت روز</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(q.Id || q.id || q.PriceId || q.priceId || q.PriceID || q.priceID);
                    }}
                    className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                    title="حذف یا غیرفعال سازی"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
        {!loading && quotes.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl text-slate-400">قیمتی یافت نشد.</div>
        )}
      </div>

      {hasPermission('manage_quotes') && (
        <button 
          onClick={() => {
            setSelectedQuote(null);
            setIsPriceModalOpen(true);
          }}
          className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all flex items-center justify-center gap-3"
        >
          <Banknote size={24} />
          <span>اضافه کردن قیمت به این محصول</span>
        </button>
      )}

      <PriceModal 
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        productName={productTitle || ''}
        productId={actualProductId}
        dollarRate={dollarRate}
        userName={userName}
        onSuccess={fetchQuotes}
        editData={selectedQuote}
      />

      <PriceActionModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onAction={handleDeleteAction}
      />

      <QuoteDetailModal 
        isOpen={!!detailQuote}
        onClose={() => setDetailQuote(null)}
        q={detailQuote}
        dollarRate={dollarRate}
      />

      {infoModalContent && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" 
          dir="rtl"
          onClick={() => setInfoModalContent(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <h4 className="font-bold text-slate-800 text-lg">جزئیات اطلاعات</h4>
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">{infoModalContent}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setInfoModalContent(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('admin_token'));
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Admin');
  const [userRole, setUserRole] = useState(() => (localStorage.getItem('user_role') || 'admin').toLowerCase());
  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('user_permissions') || '[]');
    } catch {
      return [];
    }
  });
  const [dollarRate, setDollarRate] = useState('64,200');
  const [dayChange, setDayChange] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsdtPrice = async () => {
      try {
        let res = await fetch('/api/nobitex');
        if (!res.ok) {
          res = await fetch('https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls');
        }
        if (!res.ok) {
          throw new Error('Response not OK');
        }
        const data = await res.json();
        if (data && data.status === 'ok' && data.stats && data.stats['usdt-rls']) {
          const usdtInfo = data.stats['usdt-rls'];
          const markVal = parseFloat(usdtInfo.mark);
          const dayChangeVal = usdtInfo.dayChange;

          if (!isNaN(markVal)) {
            const priceInToman = markVal / 10;
            setDollarRate(formatCurrency(String(Math.round(priceInToman))));
          } else {
            setDollarRate('عدم اتصال به NOBITEX');
          }
          if (dayChangeVal !== undefined && dayChangeVal !== null) {
            setDayChange(String(dayChangeVal));
          }
        } else {
          setDollarRate('عدم اتصال به NOBITEX');
        }
      } catch (err) {
        console.error('Error fetching Tether rate:', err);
        setDollarRate('عدم اتصال به NOBITEX');
      }
    };

    fetchUsdtPrice();
    const interval = setInterval(fetchUsdtPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (token: string, username: string, role: string, permissions: string[]) => {
    const normalizedRole = (role || 'admin').toLowerCase();
    localStorage.setItem('admin_token', token);
    localStorage.setItem('user_name', username);
    localStorage.setItem('user_role', normalizedRole);
    localStorage.setItem('user_permissions', JSON.stringify(permissions));

    setUserName(username);
    setUserRole(normalizedRole);
    setUserPermissions(permissions);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_permissions');

    setUserName('Admin');
    setUserRole('admin');
    setUserPermissions([]);
    setIsLoggedIn(false);
  };

  const hasPermission = (perm: string) => {
    if (userRole?.toLowerCase() === 'admin') return true;
    return userPermissions.includes(perm);
  };

  const authValue = useMemo(() => ({
    userName,
    userRole,
    userPermissions,
    hasPermission
  }), [userName, userRole, userPermissions]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pt-20 px-4" dir="rtl">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <Layout 
          dollarRate={dollarRate} 
          dayChange={dayChange} 
          onLogout={handleLogout}
          userName={userName}
          userRole={userRole}
        >
          <Routes>
            <Route path="/" element={<ProductCategoryPage />} />
            <Route path="/parts/:categoryName" element={<MachinePartListPage />} />
            <Route path="/quotes/:productTitle" element={<PriceQuoteListPage dollarRate={dollarRate} userName={userName} />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/persons-cardex" element={<PersonsCardexPage />} />
            <Route path="/advanced-products" element={<AdvancedProductsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
}

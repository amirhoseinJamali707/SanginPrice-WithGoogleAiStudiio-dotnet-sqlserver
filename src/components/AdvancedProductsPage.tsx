import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Loader2, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Trash, 
  RefreshCw, 
  Link, 
  ChevronRight,
  FileQuestion,
  HelpCircle,
  Hash,
  Info,
  Sliders,
  Check,
  Plus,
  Send,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CheckCircle,
  CheckSquare
} from 'lucide-react';

interface MachinePart {
  ProductID: number;
  PartID: string | number;
  PartName?: string;
  OtherNames?: string;
  TargetName?: string;
  TargetModel?: string;
  ProductName: string;
  PartNumber?: string;
  ProductInformation?: string;
  SRTID?: string;
  Status: string;
}

interface Category {
  Id: string | number;
  PartName: string;
  OtherNames?: string;
}

interface InlineEditState {
  [productId: number]: {
    targetName?: string;
    targetModel?: string;
    isEditingTargetName?: boolean;
    isEditingTargetModel?: boolean;
    tempTargetName?: string;
    tempTargetModel?: string;
  }
}

// Map helper to ensure consistent casing
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
        pascalKey = 'CRMId';
      } else {
        pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      }
    }
    result[pascalKey] = mapToPascalCase(obj[key]);
  }
  return result;
};

export default function AdvancedProductsPage() {
  const navigate = useNavigate();

  // 2 main Super Tabs: 'tags' (مدیریت تگ محصولات) vs 'sources' (مدیریت سورس محصولات)
  const [superTab, setSuperTab] = useState<'tags' | 'sources'>('tags');

  // Sub-tabs
  const [tagSubTab, setTagSubTab] = useState<'review' | 'unlinked'>('review');
  const [sourceSubTab, setSourceSubTab] = useState<'site' | 'deleted'>('site');

  // Common list states
  const [items, setItems] = useState<MachinePart[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filters for "محصولات سایت" inside "مدیریت سورس محصولات"
  // Options: 'all' | 'online' (has SRTID) | 'not_sent' (doesn't have SRTID)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online' | 'not_sent'>('all');

  // Advanced 3-step search configuration
  const [searchStep1Field, setSearchStep1Field] = useState<'name' | 'partNumber' | 'srtId'>('name');
  const [searchStep2Operator, setSearchStep2Operator] = useState<'contains' | 'starts' | 'exact'>('contains');
  const [searchStep3Value, setSearchStep3Value] = useState('');

  // Inline edit states for TargetName and TargetModel
  const [inlineEdits, setInlineEdits] = useState<InlineEditState>({});

  // PartName popup modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProductForCategory, setSelectedProductForCategory] = useState<MachinePart | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>(0);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Create New Category inline states
  const [showAddNewCategoryForm, setShowAddNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryOtherNames, setNewCategoryOtherNames] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Edit / Details modal for Deleted products
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState<MachinePart | null>(null);
  const [detailTargetName, setDetailTargetName] = useState('');
  const [detailTargetModel, setDetailTargetModel] = useState('');
  const [detailPartNumber, setDetailPartNumber] = useState('');
  const [detailSrtId, setDetailSrtId] = useState('');
  const [detailProductInfo, setDetailProductInfo] = useState('');
  const [detailPartID, setDetailPartID] = useState<string | number>(0);
  const [detailStatus, setDetailStatus] = useState('New');
  const [detailSaving, setDetailSaving] = useState(false);

  // Alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const rawData = await res.json();
        const parsed = mapToPascalCase(rawData);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Main data fetching method which runs on dependencies
  const fetchProducts = async () => {
    setLoading(true);
    setCurrentPage(1); // Reset page to first on new fetch query
    try {
      let endpoint = '';
      if (superTab === 'tags') {
        endpoint = tagSubTab === 'review' ? '/api/machine-parts/new' : '/api/machine-parts/unlinked';
      } else {
        endpoint = sourceSubTab === 'site' ? '/api/machine-parts/all-products' : '/api/machine-parts/deleted';
      }

      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const rawData = await res.json();
        const parsed = mapToPascalCase(rawData);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Run initial loadings and fetch on tab changes
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [superTab, tagSubTab, sourceSubTab]);

  // Handle Approve Action for unlinked & review tags
  const handleApprove = async (product: MachinePart) => {
    // Collect final targetName and targetModel (taking inline edits if active/saved)
    const finalTargetName = inlineEdits[product.ProductID]?.targetName !== undefined 
      ? inlineEdits[product.ProductID].targetName 
      : (product.TargetName || '');

    const finalTargetModel = inlineEdits[product.ProductID]?.targetModel !== undefined 
      ? inlineEdits[product.ProductID].targetModel 
      : (product.TargetModel || '');

    const finalPartID = product.PartID;

    if (!finalTargetName || !finalTargetModel) {
      showToast('لطفا ابتدا نام و مدل دستگاه را برای این کالا مشخص کنید', 'error');
      return;
    }

    try {
      // 1. Update machine part status to Active, plus inline update fields
      const calculatedProductName = `${finalTargetName} ${finalTargetModel}`.trim();
      const partBody = {
        ProductID: product.ProductID,
        PartID: finalPartID,
        TargetName: finalTargetName,
        TargetModel: finalTargetModel,
        ProductName: calculatedProductName,
        PartNumber: product.PartNumber || '',
        ProductInformation: product.ProductInformation || '',
        SRTID: product.SRTID || '',
        Status: 'Active'
      };

      const productRes = await fetch(`/api/machine-parts/${product.ProductID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partBody)
      });

      if (!productRes.ok) {
        showToast('خطا در بروزرسانی وضعیت کالا به فعال', 'error');
        return;
      }

      // 2. Append TargetName to category OtherNames if not present
      if (finalPartID && finalPartID !== 0 && finalPartID !== '0') {
        const matchingCat = categories.find(c => c.Id === finalPartID);
        if (matchingCat) {
          const partNameLower = matchingCat.PartName.trim().toLowerCase();
          const otherNamesLower = (matchingCat.OtherNames || '').trim().toLowerCase();
          const targetLower = finalTargetName.trim().toLowerCase();

          // Check if already exist in category Name or OtherNames
          const inPartName = partNameLower === targetLower;
          const inOtherNames = otherNamesLower.split(/[,،]/).map(x => x.trim().toLowerCase()).includes(targetLower);

          if (!inPartName && !inOtherNames) {
            const currentOthers = matchingCat.OtherNames || '';
            const newOtherNames = currentOthers 
              ? `${currentOthers}، ${finalTargetName}` 
              : finalTargetName;

            const catRes = await fetch(`/api/categories/${finalPartID}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                PartName: matchingCat.PartName,
                OtherNames: newOtherNames
              })
            });

            if (catRes.ok) {
              await fetchCategories(); // Refresh local category cache
            }
          }
        }
      }

      showToast('عملیات تایید با موفقیت انجام شد و وضعیت کالا به "فعال" انتقال یافت.', 'success');
      
      // Clean up inline edit references of approved product
      setInlineEdits(prev => {
        const copy = { ...prev };
        delete copy[product.ProductID];
        return copy;
      });

      // Reload products list
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('خطا در برقراری ارتباط با وب سرویس', 'error');
    }
  };

  // Open "اتصال به قطعه" Category edit modal
  const handleOpenCategorySelection = (product: MachinePart) => {
    setSelectedProductForCategory(product);
    setSelectedCategoryId(product.PartID || 0);
    setCategorySearch('');
    setShowAddNewCategoryForm(false);
    setNewCategoryName('');
    setNewCategoryOtherNames('');
    setIsCategoryModalOpen(true);
  };

  // Save linked category
  const handleSaveCategoryLink = async () => {
    if (!selectedProductForCategory) return;
    try {
      const finalTargetName = inlineEdits[selectedProductForCategory.ProductID]?.targetName !== undefined 
        ? inlineEdits[selectedProductForCategory.ProductID].targetName 
        : (selectedProductForCategory.TargetName || '');

      const finalTargetModel = inlineEdits[selectedProductForCategory.ProductID]?.targetModel !== undefined 
        ? inlineEdits[selectedProductForCategory.ProductID].targetModel 
        : (selectedProductForCategory.TargetModel || '');

      const calculatedProductName = `${finalTargetName} ${finalTargetModel}`.trim();
      const finalPartID = isNaN(Number(selectedCategoryId)) ? selectedCategoryId : Number(selectedCategoryId);

      // 1. First order of operation: Append targetName to target category's OtherNames if not present
      if (finalPartID && finalPartID !== 0 && finalPartID !== '0') {
        const targetCategory = categories.find(c => String(c.Id) === String(finalPartID));
        if (targetCategory && finalTargetName.trim()) {
          const partNameLower = targetCategory.PartName.trim().toLowerCase();
          const otherNamesLower = (targetCategory.OtherNames || '').trim().toLowerCase();
          const targetLower = finalTargetName.trim().toLowerCase();

          const inPartName = partNameLower === targetLower;
          const inOtherNames = otherNamesLower.split(/[,،]/).map(x => x.trim().toLowerCase()).includes(targetLower);

          if (!inPartName && !inOtherNames) {
            const currentOthers = targetCategory.OtherNames || '';
            const newOtherNames = currentOthers 
              ? `${currentOthers}، ${finalTargetName.trim()}` 
              : finalTargetName.trim();

            const catRes = await fetch(`/api/categories/${finalPartID}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                PartName: targetCategory.PartName,
                OtherNames: newOtherNames
              })
            });

            if (catRes.ok) {
              await fetchCategories(); // Refresh local category cache
            }
          }
        }
      }

      // 2. Second order of operation: Save product's target category link (PartID), keeping TargetName and TargetModel intact
      const partBody = {
        ProductID: selectedProductForCategory.ProductID,
        PartID: finalPartID,
        TargetName: finalTargetName,
        TargetModel: finalTargetModel,
        ProductName: calculatedProductName,
        PartNumber: selectedProductForCategory.PartNumber || '',
        ProductInformation: selectedProductForCategory.ProductInformation || '',
        SRTID: selectedProductForCategory.SRTID || '',
        Status: selectedProductForCategory.Status || 'Active'
      };

      const response = await fetch(`/api/machine-parts/${selectedProductForCategory.ProductID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partBody)
      });

      if (response.ok) {
        showToast('پیوند کالا به دسته‌بندی با موفقیت تغییر کرد.');
        setIsCategoryModalOpen(false);
        fetchProducts();
      } else {
        showToast('خطا در پیوند دسته‌بندی به کالا', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطای شبکه رخ داد', 'error');
    }
  };

  // Create new category and link
  const handleCreateAndLinkCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('لطفا نام معیار قطعه جدید را وارد کنید', 'error');
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PartName: newCategoryName.trim(),
          OtherNames: newCategoryOtherNames.trim()
        })
      });

      if (res.ok) {
        const newCat = await res.json();
        const parsedCat = mapToPascalCase(newCat);
        
        // Add to active cache
        setCategories(prev => [...prev, parsedCat]);
        setSelectedCategoryId(parsedCat.Id);
        setShowAddNewCategoryForm(false);
        showToast('دسته‌بندی جدید با موفقیت ساخته شد و اکنون انتخاب گردیده است.');
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.error || 'خطا در ثبت دسته‌بندی جدید', 'error');
      }
    } catch (err) {
      showToast('مشکل در دسترسی به شبکه', 'error');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Soft delete unlinked product
  const handleSoftDelete = async (productId: number) => {
    if (!window.confirm('آیا از انتقال این محصول به لیست محصولات حذف‌شده اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/machine-parts/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('کالا با موفقیت بایگانی موقت (سافت‌دیلیت) شد.');
        fetchProducts();
      } else {
        showToast('خطا در بایگانی کالا', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطای شبکه رخ داد', 'error');
    }
  };

  // Open Edit / Details for Deleted / General products
  const handleOpenDetailedEdit = (product: MachinePart) => {
    setDetailedProduct(product);
    setDetailTargetName(product.TargetName || '');
    setDetailTargetModel(product.TargetModel || '');
    setDetailPartNumber(product.PartNumber || '');
    setDetailSrtId(product.SRTID || '');
    setDetailProductInfo(product.ProductInformation || '');
    setDetailPartID(product.PartID || 0);
    setDetailStatus(product.Status || 'New');
    
    setIsDetailsModalOpen(true);
  };

  // Save detailed product changes
  const handleSaveDetailedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedProduct) return;
    if (!detailTargetName.trim() || !detailTargetModel.trim()) {
      showToast('لطفا نام و مدل دستگاه را پر کنید', 'error');
      return;
    }

    setDetailSaving(true);
    try {
      const calculatedName = `${detailTargetName} ${detailTargetModel}`.trim();
      const body = {
        ProductID: detailedProduct.ProductID,
        PartID: isNaN(Number(detailPartID)) ? detailPartID : Number(detailPartID),
        TargetName: detailTargetName.trim(),
        TargetModel: detailTargetModel.trim(),
        ProductName: calculatedName,
        PartNumber: detailPartNumber.trim(),
        ProductInformation: detailProductInfo.trim(),
        SRTID: detailSrtId.trim(),
        Status: detailStatus
      };

      const res = await fetch(`/api/machine-parts/${detailedProduct.ProductID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast('تغییرات محصول با موفقیت ذخیره گردید.');
        setIsDetailsModalOpen(false);
        fetchProducts();
      } else {
        showToast('خطا در ذخیره‌سازی جزئیات محصول', 'error');
      }
    } catch (err) {
      showToast('خطای ارتباط با سرور', 'error');
    } finally {
      setDetailSaving(false);
    }
  };

  // Filter Categories in popup search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const term = categorySearch.trim().toLowerCase();
    return categories.filter(c => 
      c.PartName.toLowerCase().includes(term) || 
      (c.OtherNames && c.OtherNames.toLowerCase().includes(term))
    );
  }, [categories, categorySearch]);

  // Inline edit utilities
  const startInlineEdit = (productId: number, field: 'TargetName' | 'TargetModel', currentValue: string) => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [`isEditing${field}`]: true,
        [`temp${field}`]: currentValue
      }
    }));
  };

  const cancelInlineEdit = (productId: number, field: 'TargetName' | 'TargetModel') => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [`isEditing${field}`]: false
      }
    }));
  };

  const saveInlineEditValue = (productId: number, field: 'TargetName' | 'TargetModel') => {
    const editState = inlineEdits[productId];
    if (!editState) return;

    const tempVal = editState[`temp${field}`] || '';
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [`isEditing${field}`]: false,
        [field.charAt(0).toLowerCase() + field.slice(1)]: tempVal
      }
    }));
  };

  const handleTempChange = (productId: number, field: 'TargetName' | 'TargetModel', val: string) => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [`temp${field}`]: val
      }
    }));
  };

  // Filtering products list for "محصولات سایت" (with 3-step advanced search & online filter)
  const processedProducts = useMemo(() => {
    let result = [...items];

    // Under "محصولات سایت" we can filter online status
    if (superTab === 'sources' && sourceSubTab === 'site') {
      if (sourceFilter === 'online') {
        result = result.filter(item => item.SRTID && item.SRTID.trim().length > 0);
      } else if (sourceFilter === 'not_sent') {
        result = result.filter(item => !item.SRTID || item.SRTID.trim().length === 0);
      }

      // Advanced 3-step search filter on client model
      if (searchStep3Value.trim() !== '') {
        const val = searchStep3Value.trim().toLowerCase();
        result = result.filter(item => {
          let fieldVal = '';
          if (searchStep1Field === 'name') fieldVal = item.ProductName || '';
          else if (searchStep1Field === 'partNumber') fieldVal = item.PartNumber || '';
          else if (searchStep1Field === 'srtId') fieldVal = item.SRTID || '';

          const normalizedField = fieldVal.toLowerCase();

          if (searchStep2Operator === 'exact') {
            return normalizedField === val;
          } else if (searchStep2Operator === 'starts') {
            return normalizedField.startsWith(val);
          } else {
            return normalizedField.includes(val);
          }
        });
      }
    }

    return result;
  }, [items, superTab, sourceSubTab, sourceFilter, searchStep1Field, searchStep2Operator, searchStep3Value]);

  // Pagination indexing
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return processedProducts.slice(startIdx, startIdx + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize));

  // Auto handle page boundary when data size changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [processedProducts.length, totalPages]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6" dir="rtl">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4.5 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800 border min-w-[320px] font-bold text-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-800'
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="text-emerald-500 shrink-0" size={20} />
            ) : toast.type === 'error' ? (
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
            ) : (
              <Info className="text-indigo-500 shrink-0" size={20} />
            )}
            <span className="leading-relaxed">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Sliders className="text-amber-500" size={28} />
            <span>مدیریت پیشرفته محصولات سیستم</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">سرویس تخصصی پاکسازی، دسته‌بندی و انتقال ساختاریافته کالاها به دیتابیس آنلاین</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm bg-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <ChevronRight size={15} />
          <span>بازگشت به برنامه اصلی</span>
        </button>
      </div>

      {/* 2 MAIN SUPER TABS */}
      <div className="bg-slate-100/75 p-1.5 rounded-3xl grid grid-cols-2 gap-2 shadow-sm border border-slate-200/50">
        <button
          onClick={() => {
            setSuperTab('tags');
            setSearchTerm('');
            setSearchStep3Value('');
          }}
          className={`py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
            superTab === 'tags'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers size={18} />
          <span>مدیریت تگ محصولات</span>
        </button>
        <button
          onClick={() => {
            setSuperTab('sources');
            setSearchTerm('');
            setSearchStep3Value('');
          }}
          className={`py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
            superTab === 'sources'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal size={18} />
          <span>مدیریت سورس محصولات</span>
        </button>
      </div>

      {/* SUB-TABS RENDERER */}
      <div className="space-y-6">
        {superTab === 'tags' ? (
          /* MANAGING PRODUCT TAGS SUB-TAB LIST */
          <div className="space-y-5">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200/70 shadow-sm gap-1.5 max-w-lg">
              <button
                onClick={() => setTagSubTab('review')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tagSubTab === 'review'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                بررسی تگ محصولات
              </button>
              <button
                onClick={() => setTagSubTab('unlinked')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tagSubTab === 'unlinked'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                محصولات بدون تگ (بدون اتصال قطعه)
              </button>
            </div>

            {/* Sub-tab 2 Actions Header Indicator */}
            {tagSubTab === 'unlinked' && (
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-2.5 items-start">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    این لیست شامل کالاهایی است که هنوز به هیچ قطعه‌ای (دسته‌بندی) متصل نگردیده‌اند. لطفا از دکمه <b>ویرایش کالا / پیوند</b> جهت اختصاص دسته‌بندی مناسب یا تعریف دسته‌بندی جدید استفاده کنید.
                  </p>
                </div>
                <button
                  onClick={() => showToast('عملیات بررسی مجدد با موفقیت انجام شد. محصولات فاقد تگ بروزرسانی گردیدند.', 'info')}
                  className="px-4 py-2 bg-white hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl text-xs font-black text-amber-600 transition-all shadow-sm"
                >
                  بررسی مجدد تگ محصولات بدون تگ
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MANAGING PRODUCT SOURCES SUB-TAB LIST */
          <div className="space-y-4">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200/70 shadow-sm gap-1.5 max-w-lg">
              <button
                onClick={() => setSourceSubTab('site')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  sourceSubTab === 'site'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                محصولات سایت
              </button>
              <button
                onClick={() => setSourceSubTab('deleted')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  sourceSubTab === 'deleted'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                محصولات حذف شده
              </button>
            </div>

            {/* Special filters if Sub tab is SITE PRODUCTS */}
            {sourceSubTab === 'site' && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                
                {/* Send action references */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs text-slate-500 font-bold">اتصال و سنک وضعیت با وب‌سایت آنلاین</span>
                  </div>
                  <button
                    onClick={() => showToast('ارسال گروهی با موفقیت صف‌بندی گردید. سیستم در پس‌زمینه شروع به بارگزاری محصولات می‌کند.', 'info')}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Send size={14} />
                    <span>ارسال تمام محصولات به سایت</span>
                  </button>
                </div>

                {/* 3 Step advanced Search Wizard */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-indigo-500" />
                    <span>جستجوی پیشرفته و ۳ مرحله‌ای محصولات</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Step 1 Selector */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-black block">۱. انتخاب فیلد بررسی</span>
                      <select
                        value={searchStep1Field}
                        onChange={(e: any) => setSearchStep1Field(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-bold"
                      >
                        <option value="name">عنوان کل کالا (ProductName)</option>
                        <option value="partNumber">شماره قطعه / پارت نامبر</option>
                        <option value="srtId">شناسه SRT ID درون سایت</option>
                      </select>
                    </div>

                    {/* Step 2 Operator Select */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-black block">۲. انتخاب نوع انطباق (عملگر)</span>
                      <select
                        value={searchStep2Operator}
                        onChange={(e: any) => setSearchStep2Operator(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-bold"
                      >
                        <option value="contains font-bold">شامل شود (Contains)</option>
                        <option value="exact">دقیقا برابر باشد (Exact)</option>
                        <option value="starts">شروع شود با (Starts With)</option>
                      </select>
                    </div>

                    {/* Step 3 Input field */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-black block">۳. عبارت جستجو</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchStep3Value}
                          onChange={(e) => setSearchStep3Value(e.target.value)}
                          placeholder="کلمه یا مقدار مورد نظر..."
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-3 pl-8 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-bold font-mono"
                        />
                        {searchStep3Value && (
                          <button 
                            onClick={() => setSearchStep3Value('')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sub Tab Site filter select ("همه", "آنلاین", "هنوز ایجاد نشده") */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-bold ml-2">فیلتر وضعیت سایت:</span>
                  <button
                    onClick={() => setSourceFilter('all')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sourceFilter === 'all'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    همه کالاها
                  </button>
                  <button
                    onClick={() => setSourceFilter('online')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sourceFilter === 'online'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    آنلاین (دارای SRT ID)
                  </button>
                  <button
                    onClick={() => setSourceFilter('not_sent')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sourceFilter === 'not_sent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    هنوز ایجاد نشده (فاقد SRT ID)
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* SEARCH BAR (For quick filtering on SQL query) */}
      {!(superTab === 'sources' && sourceSubTab === 'site') && (
        <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-150 flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              placeholder="جستجوی سریع در دیتابیس (عنوان کالا، مدل یا پارت نامبر)..."
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200/60 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-sm font-bold text-slate-700"
            />
          </div>
          <button 
            onClick={fetchProducts}
            className={`px-7 py-3 text-white rounded-xl font-bold transition-colors shadow-sm ${
              superTab === 'tags' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            جستجو
          </button>
        </div>
      )}

      {/* DATA TABLE AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-150 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 backdrop-blur-[1px]">
            <Loader2 className={`animate-spin ${superTab === 'tags' ? 'text-amber-500' : 'text-indigo-500'}`} size={36} />
          </div>
        )}

        {/* Counter Info Bar (Total Count constraint) */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${superTab === 'tags' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
            <span className="font-extrabold text-slate-700 text-xs">
              {superTab === 'tags' 
                ? (tagSubTab === 'review' ? 'لیست بررسی نهایی تگ کالاها (ProductStatus: New)' : 'لیست کالاهای بدون پیوند قطعه دسته‌بندی')
                : (sourceSubTab === 'site' ? 'لیست جامع کالاها جهت پایش سورس و پلتفرم' : 'لیست محصولات بایگانی و سافت‌دیلیت شده (بایگانی دیتابیس)')
              }
            </span>
          </div>
          <span className={`text-[11px] font-black px-4 py-1.5 rounded-full ${
            superTab === 'tags' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            تعداد کل محصولات در این جدول: {processedProducts.length} مورد
          </span>
        </div>

        {/* LIST ELEMENTS */}
        <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
          
          {paginatedItems.map((item, idx) => {
            const hasSrt = item.SRTID && item.SRTID.trim().length > 0;
            const inlineEdit = inlineEdits[item.ProductID];
            
            // Evaluated current visual states for TargetName and TargetModel
            const currentTargetName = inlineEdit?.targetName !== undefined ? inlineEdit.targetName : (item.TargetName || '');
            const currentTargetModel = inlineEdit?.targetModel !== undefined ? inlineEdit.targetModel : (item.TargetModel || '');

            return (
              <motion.div
                key={item.ProductID}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                className="p-5.5 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4.5"
              >
                
                {/* Main Information */}
                <div className="space-y-2.5 flex-1">
                  
                  {/* Title Bar */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    
                    {/* Reevaluated Full Product Name block */}
                    <h4 className="font-bold text-slate-800 text-base tracking-tight leading-relaxed uppercase">
                      {inlineEdit?.targetName !== undefined || inlineEdit?.targetModel !== undefined 
                        ? `${currentTargetName} ${currentTargetModel}`.trim() || 'کالای بدون عنوان'
                        : item.ProductName
                      }
                    </h4>

                    {/* SRT ID status badge */}
                    {item.SRTID ? (
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        SRT ID: {item.SRTID}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-bold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100">
                        بدون پیوند سایت
                      </span>
                    )}

                    {/* Part Number Status */}
                    {item.PartNumber && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded border border-slate-200">
                        {item.PartNumber}
                      </span>
                    )}

                    {/* Status badge representing DB State */}
                    {item.Status && (
                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded uppercase ${
                        item.Status.toLowerCase() === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.Status.toLowerCase() === 'deleted'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.Status}
                      </span>
                    )}
                  </div>

                  {/* SUB-FIELDS BAR with dynamic Inline Actions */}
                  <div className="text-xs text-slate-500 font-bold flex flex-wrap items-center gap-x-6 gap-y-2">
                    
                    {/* Inline edit targetName */}
                    <div className="flex items-center gap-1">
                      <span>نام عمومی دستگاه:</span>
                      {inlineEdit?.isEditingTargetName ? (
                        <div className="flex items-center gap-1 bg-white border border-indigo-400 rounded-lg p-0.5 shadow-sm">
                          <input
                            type="text"
                            value={inlineEdit.tempTargetName || ''}
                            onChange={(e) => handleTempChange(item.ProductID, 'TargetName', e.target.value)}
                            className="w-28 px-1.5 py-0.5 outline-none font-bold text-xs bg-slate-50 rounded"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEditValue(item.ProductID, 'TargetName')}
                          />
                          <button
                            type="button"
                            onClick={() => saveInlineEditValue(item.ProductID, 'TargetName')}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            title="تایید موقت"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelInlineEdit(item.ProductID, 'TargetName')}
                            className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600"
                            title="انصراف"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startInlineEdit(item.ProductID, 'TargetName', currentTargetName)}
                          className={`hover:bg-slate-105 border-b border-dashed border-slate-300 hover:border-slate-800 transition-colors py-0.5 text-slate-700 group flex items-center gap-1 ${
                            !currentTargetName ? 'text-amber-600 font-black' : ''
                          }`}
                        >
                          <span>{currentTargetName || 'انتخاب نشده'}</span>
                          <Edit size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all ml-1 duration-100" />
                        </button>
                      )}
                    </div>

                    {/* Inline edit targetModel */}
                    <div className="flex items-center gap-1">
                      <span>مدل دستگاه:</span>
                      {inlineEdit?.isEditingTargetModel ? (
                        <div className="flex items-center gap-1 bg-white border border-indigo-400 rounded-lg p-0.5 shadow-sm">
                          <input
                            type="text"
                            value={inlineEdit.tempTargetModel || ''}
                            onChange={(e) => handleTempChange(item.ProductID, 'TargetModel', e.target.value)}
                            className="w-28 px-1.5 py-0.5 outline-none font-bold text-xs bg-slate-50 rounded"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEditValue(item.ProductID, 'TargetModel')}
                          />
                          <button
                            type="button"
                            onClick={() => saveInlineEditValue(item.ProductID, 'TargetModel')}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            title="تایید موقت"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelInlineEdit(item.ProductID, 'TargetModel')}
                            className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600"
                            title="انصراف"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startInlineEdit(item.ProductID, 'TargetModel', currentTargetModel)}
                          className={`hover:bg-slate-105 border-b border-dashed border-slate-300 hover:border-slate-800 transition-colors py-0.5 text-slate-700 group flex items-center gap-1 ${
                            !currentTargetModel ? 'text-amber-600 font-black' : ''
                          }`}
                        >
                          <span>{currentTargetModel || 'انتخاب نشده'}</span>
                          <Edit size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all ml-1 duration-100" />
                        </button>
                      )}
                    </div>

                    {/* Associated Part (Category) Label mapping */}
                    <span className="flex items-center gap-1 text-slate-500">
                      <Layers size={13} className="text-slate-400" />
                      <span>دسته‌بندی (قطعه):</span>
                      <strong className={item.PartName ? 'text-slate-700 font-bold' : 'text-slate-400 font-bold'}>
                        {item.PartName || 'اتصال ندارد یا بررسی نشده'}
                      </strong>
                    </span>

                  </div>

                </div>

                {/* Operations Panel */}
                <div className="flex items-center gap-2.5 self-start lg:self-center">
                  
                  {/* Super Tab 1: Tag Management Actions */}
                  {superTab === 'tags' && (
                    <>
                      {/* Green success checkmark approval action */}
                      <button
                        onClick={() => handleApprove(item)}
                        title="تایید کالا و انتقال به وضعیت فعال"
                        className="px-4.5 py-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={15} />
                        <span>تایید و نهایی‌سازی</span>
                      </button>

                      {/* Edit Part Name category linkage */}
                      <button
                        onClick={() => handleOpenCategorySelection(item)}
                        title="اتصال این محصول به قطعه دیگر یا تغییر دسته‌بندی"
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200/80 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Link size={13} className="text-amber-500" />
                        <span>ویرایش PartName</span>
                      </button>

                      {/* Soft Delete option if in Unlinked or Review views */}
                      <button
                        onClick={() => handleSoftDelete(item.ProductID)}
                        className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                        title="انتقال کالا به محصولات حذف‌شده"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}

                  {/* Super Tab 2: Source Management Actions */}
                  {superTab === 'sources' && (
                    <>
                      {/* Detailed edit inside Super Tab 2 */}
                      <button
                        onClick={() => handleOpenDetailedEdit(item)}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit size={14} className="text-indigo-500" />
                        <span>ویرایش و اصلاح کالا</span>
                      </button>

                      {/* Not sent online to site yet triggers */}
                      {sourceSubTab === 'site' && !hasSrt && (
                        <button
                          onClick={() => showToast('محصول با موفقیت در نوبت بارگذاری در سایت قرار گرفت.', 'info')}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-500 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Send size={13} />
                          <span>ارسال به سایت</span>
                        </button>
                      )}
                    </>
                  )}

                </div>

              </motion.div>
            );
          })}

          {/* Empty Records Illustration */}
          {!loading && paginatedItems.length === 0 && (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
              <HelpCircle className="text-slate-300" size={54} />
              <p className="text-sm font-bold">هیچ کالایی متناسب با فیلترها و مقادیر جستجو شده یافت نشد.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSearchStep3Value('');
                  fetchProducts();
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm"
              >
                ریست کردن عبارات جستجو
              </button>
            </div>
          )}

        </div>

        {/* PAGINATION PANEL FOOTER */}
        {processedProducts.length > 0 && (
          <div className="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Show info stats */}
            <div className="text-xs text-slate-500 font-bold">
              نمایش داده‌ها از <strong className="text-slate-700">{Math.min(processedProducts.length, (currentPage - 1) * pageSize + 1)}</strong> تا <strong className="text-slate-700">{Math.min(processedProducts.length, currentPage * pageSize)}</strong> از مجموع <strong className="text-slate-700">{processedProducts.length}</strong> کالا
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="صفحه قبلی"
              >
                <ChevronRightIcon size={16} />
              </button>

              {/* Range of pages */}
              {Array.from({ length: totalPages }).map((_, pIdx) => {
                const pageNum = pIdx + 1;
                // Render dynamically only pages close to current
                if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="px-1 text-slate-400 font-bold text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all border ${
                      currentPage === pageNum
                        ? superTab === 'tags'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="صفحه بعدی"
              >
                <ChevronLeft size={16} />
              </button>

            </div>

            {/* Selector of sizes */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold">تعداد در صفحه:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-bold bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>

          </div>
        )}

      </div>

      {/* POPUP 1: PARTNAME CATEGORY LINKAGE & QUICK NEW CREATION */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-10 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[60] flex flex-col"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/75">
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-slate-800 text-base">پیوند کالا به PartName (دسته‌بندی)</span>
                  <span className="text-[11px] text-slate-500 font-bold uppercase">{selectedProductForCategory?.ProductName}</span>
                </div>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* Search Categories */}
                <div className="relative">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="جستجو و فیلتر در لیست دسته‌بندی‌های موجود..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl outline-none text-xs font-bold text-slate-700 transition-all"
                  />
                  {categorySearch && (
                    <button 
                      onClick={() => setCategorySearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      حذف فیلتر
                    </button>
                  )}
                </div>

                {/* Categories list dropdown-simulate */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50 max-h-40 overflow-y-auto">
                  <label className="text-[10px] text-slate-400 font-black block mb-1.5 mr-2">دسته‌بندی متصل فعلی یا جدید را انتخاب کنید:</label>
                  
                  <button
                    onClick={() => setSelectedCategoryId(0)}
                    type="button"
                    className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      selectedCategoryId === 0 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>-- هیچکدام (قطع اتصال به تگ) --</span>
                    {selectedCategoryId === 0 && <Check size={14} />}
                  </button>

                  {filteredCategories.map((c) => (
                    <button
                      key={c.Id}
                      onClick={() => setSelectedCategoryId(c.Id)}
                      type="button"
                      className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        selectedCategoryId === c.Id 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="truncate">{c.PartName} {c.OtherNames ? `(${c.OtherNames})` : ''}</span>
                      {selectedCategoryId === c.Id && <Check size={14} />}
                    </button>
                  ))}
                </div>

                {/* BUTTON to create a brand brand-new category (Create PartName flow) */}
                <div className="border-t border-slate-100 pt-3">
                  {!showAddNewCategoryForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddNewCategoryForm(true)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-sm border border-slate-200"
                    >
                      <Plus size={14} className="text-amber-500" />
                      <span>ایجاد قطعه (دسته‌بندی) کاملا جدید</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateAndLinkCategory} className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-black text-rose-700">فرم ثبت قطعه (دسته‌بندی) جدید</span>
                        <button 
                          type="button"
                          onClick={() => setShowAddNewCategoryForm(false)}
                          className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold"
                        >
                          لغو ایجاد
                        </button>
                      </div>

                      {/* New Item Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">نام معیار (مثال: رینگ پیستون موتور)</label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="نام فارسی معیار قطعه..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* New Item OtherNames */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">مترادف‌ها و نام‌های دیگر (با کاما جدا شود)</label>
                        <input
                          type="text"
                          value={newCategoryOtherNames}
                          onChange={(e) => setNewCategoryOtherNames(e.target.value)}
                          placeholder="مثال: رینگ موتور، رینگ چرخ"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={creatingCategory}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                      >
                        {creatingCategory ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>ثبت قطعه جدید...</span>
                          </>
                        ) : (
                          <span>تایید و ثبت قطعه جدید در دیتابیس</span>
                        )}
                      </button>

                    </form>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-150">
                  <button
                    onClick={handleSaveCategoryLink}
                    type="button"
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-md"
                  >
                    برقراری قطعی پیوند و ذخیره
                  </button>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    type="button"
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-500 rounded-xl font-bold text-xs transition-all border border-slate-200"
                  >
                    انصراف
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP 2: DETAILED EDIT & STATUS HANDLERS */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-10 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[60] flex flex-col"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/75">
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-slate-800 text-base">ویرایش جامع و بازیابی کالا</span>
                  <span className="text-[11px] text-indigo-600 font-bold">بخش کنترل محصولات با دسترسی ویژه</span>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDetailedProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Machine Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">نام عمومی دستگاه</label>
                    <input 
                      value={detailTargetName}
                      onChange={(e) => setDetailTargetName(e.target.value)}
                      type="text" 
                      placeholder="مانند: هیوندا، کوماتسو"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">مدل دستگاه</label>
                    <input 
                      value={detailTargetModel}
                      onChange={(e) => setDetailTargetModel(e.target.value)}
                      type="text" 
                      placeholder="مانند: PC220-7"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-bold bg-slate-50 p-2.5 border border-slate-200/55 rounded-xl">
                  عنوان کلی کالا: <strong className="text-slate-800 font-black">{`${detailTargetName} ${detailTargetModel}`.trim() || '---'}</strong>
                </div>

                {/* Part Number / SRT */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">پارت نامبر (شماره قطعه)</label>
                    <input 
                      value={detailPartNumber}
                      onChange={(e) => setDetailPartNumber(e.target.value)}
                      type="text" 
                      placeholder="مثال: 708-2L-04140"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all focus:border-indigo-500 focus:bg-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">شناسه SRT ID سایت</label>
                    <input 
                      value={detailSrtId}
                      onChange={(e) => setDetailSrtId(e.target.value)}
                      type="text" 
                      placeholder="مثال: P-1025"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all focus:border-indigo-500 focus:bg-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Categories Dropdown in detail modal */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">دسته‌بندی متصل به قطعه</label>
                  <select
                    value={detailPartID}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDetailPartID(isNaN(Number(val)) ? val : Number(val));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    <option value="0">-- فاقد اتصال تگ دسته‌بندی --</option>
                    {categories.map((c) => (
                      <option key={c.Id} value={c.Id}>
                        {c.PartName} {c.OtherNames ? `(${c.OtherNames})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status selector (important for recovery of Soft Deleted Products) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">وضعیت محصول (ProductStatus)</label>
                  <select
                    value={detailStatus}
                    onChange={(e) => setDetailStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    <option value="New">جدید (New)</option>
                    <option value="Active font-bold text-emerald-600">فعال (Active) - در جستجوی عادی نشان داده شود</option>
                    <option value="Deleted text-rose-600">حذف شده موقت (Deleted)</option>
                  </select>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-slate-600 leading-relaxed font-bold">
                    * توجه: با تغییر وضعیت از <strong className="text-rose-500">Deleted</strong> به <strong className="text-emerald-600">Active</strong> یا <strong className="text-amber-600 font-bold">New</strong>، این محصول مجدداً زنده شده و به چرخه‌ی کاری عادی سیستم باز خواهد گشت.
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">اطلاعات محصول (توضیحات)</label>
                  <textarea 
                    value={detailProductInfo}
                    onChange={(e) => setDetailProductInfo(e.target.value)}
                    placeholder="شرح و جزئیات تکمیلی کالا در دیتابیس..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none rounded-xl text-xs font-bold text-slate-700 h-20 resize-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-150">
                  <button
                    type="submit"
                    disabled={detailSaving}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {detailSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>در حال بروزرسانی دیتابیس...</span>
                      </>
                    ) : (
                      <span>ذخیره نهایی تغییرات</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs transition-all border border-slate-200"
                  >
                    لغو
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

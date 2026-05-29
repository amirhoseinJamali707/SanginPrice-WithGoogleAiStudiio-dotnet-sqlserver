import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BarChart2, 
  Calendar, 
  TrendingUp, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ArrowLeft,
  Loader2,
  DollarSign,
  Activity,
  Eye,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';

interface UserStat {
  userID: string;
  username: string;
  role: string;
  email: string;
  phone: string;
  insert_product_count: number;
  update_product_count: number;
  insert_price_count: number;
  update_price_count: number;
  total_activity: number;
}

interface AuditLog {
  _id?: string;
  user_id: string;
  action_type: 'insert_product' | 'update_product' | 'insert_price' | 'update_price';
  target_id: string;
  target_type: 'Product' | 'price';
  description: string;
  changes?: {
    old_price?: string | number;
    new_price?: string | number;
    old?: any;
    new?: any;
  };
  created_at: string;
}

const formatPersianDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const option: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'persian', 
    numberingSystem: 'latn' 
  };
  return new Intl.DateTimeFormat('fa-IR', option).format(date);
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
      if (key === 'id') {
        pascalKey = 'Id';
      } else if (key === 'partID' || key === 'partId') {
        pascalKey = 'PartID';
      } else if (key === 'productID' || key === 'productId') {
        pascalKey = 'ProductID';
      } else if (key === 'priceID' || key === 'priceId') {
        pascalKey = 'PriceId';
      } else if (key === 'srtID' || key === 'srtId') {
        pascalKey = 'SRTID';
      } else if (key === 'srtPriceID' || key === 'srtPriceId') {
        pascalKey = 'SRTPriceID';
      } else if (key === 'crmID' || key === 'crmId') {
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
  return result;
};

export const ReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab handling (?tab=performance or ?tab=views)
  const queryTab = searchParams.get('tab');
  const [activeMainTab, setActiveMainTab] = useState<'performance' | 'views'>(
    queryTab === 'views' ? 'views' : 'performance'
  );

  // Sync tab with URL query params
  const handleTabChange = (newTab: 'performance' | 'views') => {
    setActiveMainTab(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    if (queryTab === 'views' || queryTab === 'performance') {
      setActiveMainTab(queryTab);
    }
  }, [queryTab]);

  // --- TAB 1 STATE: PERFORMANCES ---
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState<UserStat[]>([]);
  const [summary, setSummary] = useState({
    priceUpdatesToday: 0,
    activeUserToday: 'بدون فعالیت'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sorting state for performances
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Timeline modal state
  const [selectedUserForTimeline, setSelectedUserForTimeline] = useState<UserStat | null>(null);
  const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // --- TAB 2 STATE: TOP VIEWS ---
  const [topViewsType, setTopViewsType] = useState<'part' | 'product'>('part');
  const [topViewsRange, setTopViewsRange] = useState<string>('3months');
  const [topViewsPage, setTopViewsPage] = useState<number>(1);
  const [topViewsData, setTopViewsData] = useState<any>(null);
  const [loadingTopViews, setLoadingTopViews] = useState<boolean>(false);
  const [triggeringJob, setTriggeringJob] = useState<boolean>(false);
  const [jobSuccessMessage, setJobSuccessMessage] = useState<string | null>(null);

  // Fetch Performances
  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/stats?range=${range}`);
      if (!res.ok) {
        throw new Error('خطا در دریافت گزارشات از سرور');
      }
      const rawData = await res.json();
      const data = mapToPascalCase(rawData);
      setStats(data.userStats || []);
      setSummary(data.summary || { priceUpdatesToday: 0, activeUserToday: 'بدون فعالیت' });
    } catch (err: any) {
      console.error(err);
      setError('امکان بارگذاری آمار در حال حاضر وجود ندارد. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Top Views Report
  const fetchTopViews = async () => {
    setLoadingTopViews(true);
    try {
      const res = await fetch(`/api/reports/top-views?type=${topViewsType}&range=${topViewsRange}&page=${topViewsPage}&limit=30`);
      if (res.ok) {
        const rawData = await res.json();
        const data = mapToPascalCase(rawData);
        setTopViewsData(data);
      } else {
        throw new Error('خطا در بارگذاری');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTopViews(false);
    }
  };

  // Trigger manual Pre-aggregation Run
  const triggerAggregationJob = async () => {
    setTriggeringJob(true);
    setJobSuccessMessage(null);
    try {
      const res = await fetch('/api/reports/trigger-nightly-job', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setJobSuccessMessage(data.message || 'پردازش و هماهنگ‌سازی بازدیدها با موفقیت انجام شد!');
        setTimeout(() => setJobSuccessMessage(null), 8000);
        fetchTopViews(); // reload data immediately
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringJob(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'performance') {
      fetchStats();
    }
  }, [range, activeMainTab]);

  useEffect(() => {
    if (activeMainTab === 'views') {
      fetchTopViews();
    }
  }, [topViewsType, topViewsRange, topViewsPage, activeMainTab]);

  // Reset page when range or type transitions
  useEffect(() => {
    setTopViewsPage(1);
  }, [topViewsType, topViewsRange]);

  const fetchTimeline = async (user: UserStat) => {
    setSelectedUserForTimeline(user);
    setTimelineLogs([]);
    setLoadingTimeline(true);
    try {
      const res = await fetch(`/api/audit-logs/${user.userID}`);
      if (res.ok) {
        const data = await res.json();
        setTimelineLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching user timeline logs:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Sort statistics
  const sortedStats = [...stats].sort((a, b) => {
    if (sortDirection === 'desc') {
      return b.total_activity - a.total_activity;
    } else {
      return a.total_activity - b.total_activity;
    }
  });

  const toggleSort = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const getActionBadgeStyle = (actType: string) => {
    switch (actType) {
      case 'insert_product':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'update_product':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'insert_price':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'update_price':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getActionName = (actType: string) => {
    switch (actType) {
      case 'insert_product': return 'ثبت محصول';
      case 'update_product': return 'ویرایش محصول';
      case 'insert_price': return 'ثبت قیمت';
      case 'update_price': return 'ویرایش قیمت';
      default: return 'سایر';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      
      {/* Header and Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg-amber shadow-amber-500/20">
            <BarChart2 size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">گزارشات مدیریتی هوشمند</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">مانیتورینگ عملکرد پرسنل و تحلیل آمار بازدیدهای انبار قطعات</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>بازگشت به داشبورد</span>
        </button>
      </div>

      {/* Modern Main Tab Selection */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md border border-slate-200/50">
        <button
          onClick={() => handleTabChange('performance')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'performance'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Award size={16} />
          <span>کارنامه عملکرد پرسنل</span>
        </button>
        <button
          onClick={() => handleTabChange('views')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'views'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Eye size={16} />
          <span>گزارش کالاها و قطعات پربازدید</span>
        </button>
      </div>

      {activeMainTab === 'performance' ? (
        <>
          {/* Controls & Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Date Filter Selection Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm md:col-span-4 flex flex-col justify-between">
              <div>
                <label className="flex items-center gap-2 text-sm font-extrabold text-slate-700 mb-3">
                  <Calendar size={18} className="text-amber-500" />
                  <span>فیلتر بازه زمانی گزارشات</span>
                </label>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-5">
                  جهت آنالیز فعالیت پرسنل در بازه زمانی دلخواه، فیلتر مد نظر را انتخاب فرمایید.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'today', label: 'امروز' },
                  { key: 'week', label: 'هفته اخیر' },
                  { key: 'month', label: 'ماه اخیر' },
                  { key: 'all', label: 'کل تاریخچه' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setRange(item.key as any)}
                    className={`py-2.5 px-3 rounded-xl text-center text-xs font-bold border transition-all ${
                      range === item.key
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/10 scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Metric Cards */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1: Today Updated Prices */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-2 h-full bg-amber-500" />
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                  <DollarSign size={28} />
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[11px] font-bold block">قیمت‌های ویرایش‌شده امروز</span>
                  <span className="text-2xl font-black text-slate-800 block">
                    {summary.priceUpdatesToday} <b className="text-xs font-bold text-slate-500">مورد</b>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block bg-emerald-50 rounded-md px-1.5 py-0.5 inline-block">قیمت‌های جدید ارائه‌شده پرسنل</span>
                </div>
              </div>

              {/* Card 2: Most Active User Today */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-2 h-full bg-indigo-500" />
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                  <TrendingUp size={28} />
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[11px] font-bold block">فعال‌ترین کاربر امروز سیستم</span>
                  <span className="text-base font-black text-slate-800 block truncate max-w-[200px]" title={summary.activeUserToday}>
                    {summary.activeUserToday}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block bg-indigo-50 rounded-md px-1.5 py-0.5 inline-block">بر اساس مجموع تعداد تغییرات و درج‌ها</span>
                </div>
              </div>
            </div>

          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-24 flex flex-col items-center justify-center gap-4 shadow-sm">
              <Loader2 className="animate-spin text-amber-500" size={38} />
              <p className="text-sm font-bold text-slate-500">در حال دریافت و تجميع آماری لاگ عملکرد کاربران...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4">
              <p className="text-sm font-bold text-rose-700">{error}</p>
              <button
                onClick={fetchStats}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                تلاش مجدد بارگذاری گزارشات
              </button>
            </div>
          ) : (
            /* Main Performance Table */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="font-extrabold text-sm text-slate-800">جدول رتبه‌بندی عملکرد پرسنل به تفکیک فعالیت</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">تعداد کاربران فعال سیستم: {sortedStats.length} کاربر</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-black uppercase">
                      <th className="py-3 px-4 font-black">کاربر سیستم</th>
                      <th className="py-3 px-4 font-black">نقش سیستم</th>
                      <th className="py-3 px-4 font-black text-center">ثبت دستگاه جدید</th>
                      <th className="py-3 px-4 font-black text-center">ویرایش دستگاه</th>
                      <th className="py-3 px-4 font-black text-center">ثبت قیمت</th>
                      <th className="py-3 px-4 font-black text-center">ویرایش قیمت</th>
                      <th 
                        className="py-3 px-4 font-black text-center cursor-pointer hover:bg-slate-200/50 transition-colors select-none"
                        onClick={toggleSort}
                      >
                        <div className="flex items-center justify-center gap-1.5 text-slate-800">
                          <span>مجموع فعالیت‌ها</span>
                          {sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {sortedStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                          هیچ عملکرد ثبت‌شده‌ای برای این فیلترینگ زمانی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      sortedStats.map((u, idx) => (
                        <tr 
                          key={u.userID} 
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => fetchTimeline(u)}
                                className="w-8 h-8 rounded-xl bg-amber-100/50 hover:bg-amber-500 hover:text-white text-amber-600 transition-all flex items-center justify-center font-bold text-xs"
                                title="مشاهده ۱۰ اقدام اخیر این کاربر"
                              >
                                <Clock size={14} />
                              </button>
                              <div>
                                <button
                                  onClick={() => fetchTimeline(u)}
                                  className="font-extrabold hover:text-amber-500 transition-colors text-slate-900 block text-right"
                                >
                                  {u.username}
                                </button>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${
                              u.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : u.role === 'operator'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                              {u.role === 'admin' ? 'مدیر سیستم' : u.role === 'operator' ? 'اپراتور' : 'مشاهده کننده'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-extrabold text-[#10b981]">
                            {u.insert_product_count || 0}
                          </td>

                          <td className="py-4 px-4 text-center font-extrabold text-[#14b8a6]">
                            {u.update_product_count || 0}
                          </td>

                          <td className="py-4 px-4 text-center font-extrabold text-[#6366f1]">
                            {u.insert_price_count || 0}
                          </td>

                          <td className="py-4 px-4 text-center font-extrabold text-[#f59e0b]">
                            {u.update_price_count || 0}
                          </td>

                          <td className="py-4 px-4 text-center bg-slate-50/40 font-black text-slate-900 group-hover:bg-slate-100/60 transition-colors">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-black">
                              {u.total_activity || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* --- TAB 2 VIEW: TOP VISITED PARTS & PRODUCTS WITH PRE-AGGREGATION --- */
        <div className="space-y-6">
          
          {/* Quick Informational / Action Header banner */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-right">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 justify-start">
                <Sparkles className="text-amber-600 animate-pulse" size={18} />
                <h4 className="font-extrabold text-sm text-amber-900">موتور پردازش هوشمند و پیش‌تجميع بهینه بازدیدها (Pre-aggregation)</h4>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed max-w-2xl font-medium text-right">
                سیستم با ثبت بلادرنگ در <code className="font-mono bg-amber-200/40 px-1 rounded text-amber-800">daily_views</code> و اجرای رول‌آپ دوره‌ای (ساعت ۱ بامداد)، آمارهای بازه‌های زمانی را تفکیک و به‌روز می‌کند مخاطبین گرامی اکنون بدون لود سنگین دیتابیس می‌توانند تحلیل‌های دقیق آماری را به سرعت ثانیه‌ای مشاهده فرمایند.
              </p>
            </div>
            
            <button
              onClick={triggerAggregationJob}
              disabled={triggeringJob}
              className="px-4.5 py-2.5 bg-slate-900 border border-slate-950 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 text-xs font-black self-stretch sm:self-auto justify-center disabled:opacity-50 cursor-pointer"
            >
              {triggeringJob ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>پردازش بازه‌ها (اجرای دستی اکنون)</span>
            </button>
          </div>

          {jobSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 py-3.5 px-5 rounded-xl text-xs font-semibold text-right shadow-sm animate-in fade-in">
              ✔️ {jobSuccessMessage}
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* View Type Toggle (Parts vs Products) */}
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl max-w-xs self-start">
              <button
                onClick={() => setTopViewsType('part')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  topViewsType === 'part'
                    ? 'bg-white text-slate-800 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                قطعات پربازدید
              </button>
              <button
                onClick={() => setTopViewsType('product')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  topViewsType === 'product'
                    ? 'bg-white text-slate-800 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                محصولات پربازدید
              </button>
            </div>

            {/* Time range switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-600 whitespace-nowrap">بازه زمانی:</span>
              <div className="relative">
                <select
                  value={topViewsRange}
                  onChange={(e) => setTopViewsRange(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 pl-9 text-xs font-black text-slate-700 appearance-none outline-none focus:border-amber-500 min-w-[150px] text-right cursor-pointer"
                >
                  <option value="1month">۱ ماه اخیر</option>
                  <option value="3months">۳ ماه اخیر (پیش‌فرض)</option>
                  <option value="6months">۶ ماه اخیر</option>
                  <option value="1year">۱ سال اخیر</option>
                  <option value="all">كل تاریخچه</option>
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Main Grid View */}
          {loadingTopViews ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-24 flex flex-col items-center justify-center gap-4 shadow-sm">
              <Loader2 className="animate-spin text-amber-500" size={38} />
              <p className="text-sm font-bold text-slate-500">لیست کالاها و قطعات پربازدید در حال آماده‌سازی سریع...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    رتبه‌بندی {topViewsType === 'part' ? 'دسته‌بندی‌ها و قطعات' : 'محصولات خاص'} بر اساس بیشترین بازدید
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-bold">
                  نمایش بر اساس: {' '}
                  {topViewsRange === '1month' ? '۱ ماه اخیر' : topViewsRange === '3months' ? '۳ ماه اخیر' : topViewsRange === '6months' ? '۶ ماه اخیر' : topViewsRange === '1year' ? '۱ سال اخیر' : 'كل تاریخچه'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-black uppercase">
                      <th className="py-3 px-5 font-black text-center w-16">رتبه</th>
                      <th className="py-3 px-5 font-black">
                        {topViewsType === 'part' ? 'نام قطعه' : 'عنوان محصول و مدل'}
                      </th>
                      <th className="py-3 px-5 font-black">شناسه (ID)</th>
                      {topViewsType === 'product' && <th className="py-3 px-5 font-black">شماره فنی (Part Number)</th>}
                      <th className="py-3 px-5 font-black text-center">بازدید کل تاریخچه</th>
                      <th className="py-3 px-5 font-black text-center">بازدید بازه فیلتر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {!topViewsData || !topViewsData.items || topViewsData.items.length === 0 ? (
                      <tr>
                        <td colSpan={topViewsType === 'product' ? 6 : 5} className="py-16 text-center text-slate-400 font-bold">
                          هیچ رکوردی برای این الگو واکشی نشد.
                        </td>
                      </tr>
                    ) : (
                      topViewsData.items.map((item: any, idx: number) => {
                        const rank = (topViewsPage - 1) * 30 + idx + 1;
                        let specViews = item.views_3months || 0;
                        if (topViewsRange === '1month') specViews = item.views_1month || 0;
                        else if (topViewsRange === '6months') specViews = item.views_6months || 0;
                        else if (topViewsRange === '1year') specViews = item.views_1year || 0;
                        else if (topViewsRange === 'all') specViews = item.view_count || 0;

                        return (
                          <tr key={item._id || idx} className="hover:bg-amber-50/20 transition-colors group">
                            <td className="py-3.5 px-5 text-center">
                              <span className={`w-6 h-6 rounded-lg font-black text-xs inline-flex items-center justify-center ${
                                rank === 1 ? 'bg-amber-500 text-white animate-bounce' : rank === 2 ? 'bg-slate-400 text-white' : rank === 3 ? 'bg-amber-700/60 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {rank}
                              </span>
                            </td>

                            <td className="py-3.5 px-5 font-extrabold text-slate-900">
                              {topViewsType === 'part' ? item.PartName : item.ProductName}
                            </td>

                            <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                              {topViewsType === 'part' ? (item.Id || item.PartID) : (item.Id || item.ProductID)}
                            </td>

                            {topViewsType === 'product' && (
                              <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                                {item.PartNumber || '-'}
                              </td>
                            )}

                            <td className="py-3.5 px-5 text-center font-bold text-slate-500">
                              {(item.view_count || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">بار</span>
                            </td>

                            <td className="py-3.5 px-5 text-center font-black text-amber-600 bg-amber-50/20 group-hover:bg-amber-50/35 transition-colors">
                              {(specViews || 0).toLocaleString()} <span className="text-[10px] text-amber-500 font-medium">بار</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {topViewsData && topViewsData.pages > 1 && (
                <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="text-xs text-slate-500 font-bold">
                    صفحه {topViewsPage} از {topViewsData.pages} (مجموعاً {topViewsData.total} مورد)
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTopViewsPage(prev => Math.max(1, prev - 1))}
                      disabled={topViewsPage === 1}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {Array.from({ length: Math.min(5, topViewsData.pages) }, (_, pIdx) => {
                      let btnPage = pIdx + 1;
                      if (topViewsPage > 3 && topViewsData.pages > 5) {
                        btnPage = topViewsPage - 3 + pIdx;
                        if (btnPage + (4 - pIdx) > topViewsData.pages) {
                          btnPage = topViewsData.pages - 4 + pIdx;
                        }
                      }
                      
                      return (
                        <button
                          key={btnPage}
                          onClick={() => setTopViewsPage(btnPage)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            topViewsPage === btnPage
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'hover:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-200'
                          }`}
                        >
                          {btnPage}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setTopViewsPage(prev => Math.min(topViewsData.pages, prev + 1))}
                      disabled={topViewsPage === topViewsData.pages}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* User Actions Timeline Popup/Modal */}
      {selectedUserForTimeline && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right" onClick={() => setSelectedUserForTimeline(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-lg lg:max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-250 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">۱۰ اقدام اخیر کاربر "{selectedUserForTimeline.username}"</h4>
                  <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">نقش: {selectedUserForTimeline.role === 'admin' ? 'مدیر سیستم' : 'اپراتور'} | موبایل: {selectedUserForTimeline.phone}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserForTimeline(null)}
                className="p-1 px-3 py-1.5 hover:bg-white/10 text-white hover:text-amber-500 rounded-lg transition-colors font-black text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body (Scrollable Timeline) */}
            <div className="p-6 overflow-y-auto max-h-[60vh] flex-grow space-y-6">
              {loadingTimeline ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-amber-500" size={30} />
                  <p className="text-xs font-bold text-slate-500">در حال واکشی آخرین اقدامات و لاگ عملکرد...</p>
                </div>
              ) : timelineLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-bold text-xs space-y-2">
                  <Activity size={24} className="mx-auto text-slate-300" />
                  <p>هیچ سابقه فعالیتی یافت نشد.</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-100 pr-5 mr-3 space-y-5">
                  {timelineLogs.map((log, lIdx) => (
                    <div key={log._id || lIdx} className="relative">
                      <span className="absolute -right-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-50" />
                      
                      <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl relative space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-dashed border-slate-200 pb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border text-center self-start ${getActionBadgeStyle(log.action_type)}`}>
                            {getActionName(log.action_type)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Clock size={11} />
                            {formatPersianDateTime(log.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-[11px] font-bold text-slate-800 leading-relaxed pr-1 text-right">
                          {log.description}
                        </p>
                        
                        {log.changes && (
                          <div className="mt-2.5 p-2 bg-white border border-slate-100 rounded-lg text-right">
                            <span className="text-[9px] text-slate-400 font-bold block mb-1">جزئیات ثبت تغییرات:</span>
                            {log.action_type === 'update_price' && log.changes.old_price !== undefined ? (
                              <div className="flex justify-between text-[11px]">
                                <span className="text-rose-500 font-bold">قیمت قبلی: {Number(log.changes.old_price).toLocaleString()} ریال</span>
                                <span className="text-emerald-500 font-bold">قیمت جدید: {Number(log.changes.new_price).toLocaleString()} ریال</span>
                              </div>
                            ) : (
                              <pre className="text-[9px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap leading-normal">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserForTimeline(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                بستن پنجره جزئیات
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

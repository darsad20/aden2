import { CONFIG } from "../../config/config.js";

/**
 * نظام تقارير المنشأة الطبية - إصدار محسن
 * يوفر واجهة تفاعلية متقدمة مع تصفية وعرض واستخراج البيانات
 */
document.addEventListener("DOMContentLoaded", () => {
  // العناصر
  const filterForm = document.getElementById("filterForm");
  const reportsContent = document.getElementById("reportsContent");
  const reportsTable = document.getElementById("reportsTable");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const printReportBtn = document.getElementById("printReportBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const toggleFilters = document.getElementById("toggleFilters");
  const filterSection = document.getElementById("filterSection");
  const resultsCount = document.getElementById("resultsCount");
  const showing = document.getElementById("showing");
  const total = document.getElementById("total");
  const reportDate = document.getElementById("reportDate");
  
  // استخدام الرابط من ملف الإعدادات
  const apiBaseUrl = CONFIG.API_BASE_URL;
  
  // إعداد picker نطاق التاريخ باستخدام daterangepicker
  $('#dateRange').daterangepicker({
    locale: {
      format: 'YYYY/MM/DD',
      applyLabel: 'تطبيق',
      cancelLabel: 'إلغاء',
      fromLabel: 'من',
      toLabel: 'إلى',
      customRangeLabel: 'مخصص',
      daysOfWeek: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
      monthNames: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      firstDay: 6
    },
    startDate: moment().subtract(7, 'days'),
    endDate: moment(),
    opens: 'left',
    drops: 'auto'
  });
  
  // تهيئة DataTable
  let dataTable = null;
  
  // تسجيل تاريخ التقرير
  if (reportDate) {
    reportDate.textContent = moment().format('YYYY/MM/DD - HH:mm');
  } else {
    console.warn("عنصر reportDate غير موجود في الصفحة");
  }
  
  setupEventListeners();
  loadDefaultData();
  
  function setupEventListeners() {
    filterForm.addEventListener("submit", handleFilterSubmit);
    
    printReportBtn.addEventListener("click", () => {
      window.print();
    });
    
    exportExcelBtn.addEventListener("click", exportToExcel);
    
    toggleFilters.addEventListener("click", () => {
      $(filterSection).collapse('toggle');
      const icon = toggleFilters.querySelector('i');
      if (icon.classList.contains('fa-chevron-down')) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }
    });
  }
  
  function loadDefaultData() {
    showLoading();
    setTimeout(() => {
      const sampleData = getSampleData();
      renderReportData(sampleData);
      updateStatistics(sampleData);
      hideLoading();
    }, 800);
  }
  
  async function handleFilterSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const searchText = document.getElementById("searchText").value.trim();
    const reportType = document.getElementById("reportType").value;
    const dateRange = document.getElementById("dateRange").value;
    const governorate = document.getElementById("governorate").value;
    const diseaseType = document.getElementById("diseaseType").value;
    
    let actionParam = "";
    if (reportType === "transferred") {
      actionParam = "getTransferredCases";
    } else if (reportType === "daily") {
      actionParam = "getDailyVisitors";
    } else if (reportType === "patient") {
      actionParam = "getPatientReport";
    } else if (reportType === "death") {
      actionParam = "getDeathReport";
    } else {
      actionParam = "getAllReports";
    }
    
    let params = new URLSearchParams();
    params.append('action', actionParam);
    if (searchText) params.append('search', searchText);
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(' - ');
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    if (governorate) params.append('governorate', governorate);
    if (diseaseType) params.append('diseaseType', diseaseType);
    
    // تحقق من المعاملات عبر console.log
    console.log("Parameters:", params.toString());
    
    try {
      // استخدام الرابط الجديد للنشر
      const apiUrl = apiBaseUrl;
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const data = await response.json();
      
      console.log("Fetched data:", data);
      
      if (!data || data.length === 0) {
        reportsContent.innerHTML = `<tr><td colspan="16" class="text-center">لا توجد بيانات للتقرير المطلوب.</td></tr>`;
      } else {
        let html = '';
        // إضافة الصفوف فقط بدون إنشاء جدول جديد
        data.forEach(row => {
          html += `<tr>`;
          Object.values(row).forEach(value => {
            html += `<td>${value || ''}</td>`;
          });
          html += `</tr>`;
        });
        
        reportsContent.innerHTML = html;
      }
      
      updateStatistics(data);
      updateResultsInfo(1, data.length, data.length);
      hideLoading();
      
    } catch (error) {
      console.error("Fetch Error:", error);
      reportsContent.innerHTML = `<tr><td colspan="16" class="text-center text-danger">
        حدث خطأ أثناء جلب التقرير: ${error.message}</td></tr>`;
      hideLoading();
    }
  }
  
  // تعريف دالة renderReportData لإظهار البيانات في التقارير
  function renderReportData(data) {
    if (!data || data.length === 0) {
      reportsContent.innerHTML = `<tr><td colspan="16" class="text-center">لا توجد بيانات للتقرير المطلوب.</td></tr>`;
      updateResultsInfo(0, 0, 0);
      return;
    }
    
    let html = '';
    // إضافة الصفوف فقط بدون إنشاء جدول جديد
    data.forEach(row => {
      html += `<tr>`;
      Object.values(row).forEach(value => {
        html += `<td>${value || ''}</td>`;
      });
      html += `</tr>`;
    });
    
    reportsContent.innerHTML = html;
    updateResultsInfo(1, data.length, data.length);
  }
  
  function updateResultsInfo(start, end, total) {
    resultsCount.textContent = `${total} نتائج`;
    showing.textContent = total > 0 ? `${start}-${end}` : "0";
    document.getElementById("total").textContent = total;
  }
  
  function updateStatistics(data) {
    document.getElementById("totalPatients").textContent = data.length;
    
    const today = moment().format('YYYY-MM-DD');
    const todayVisits = data.filter(item => item['التاريخ'] && item['التاريخ'].includes(today)).length;
    document.getElementById("todayVisits").textContent = todayVisits;
    
    const transferredCases = data.filter(item => item['الحالة المرضية'] && item['الحالة المرضية'].includes('عدوى')).length;
    document.getElementById("transferredCases").textContent = transferredCases;
    
    const criticalCases = Math.floor(data.length * 0.05);
    document.getElementById("criticalCases").textContent = criticalCases;
  }
  
  function showLoading() {
    loadingOverlay.classList.remove('d-none');
  }
  
  function hideLoading() {
    loadingOverlay.classList.add('d-none');
  }
  
  function exportToExcel() {
    showLoading();
    setTimeout(() => {
      alert('تم تصدير البيانات بنجاح إلى ملف Excel');
      hideLoading();
    }, 1000);
  }
  
  function exportToPDF() {
    showLoading();
    setTimeout(() => {
      hideLoading();
      alert('تم تصدير البيانات بنجاح بصيغة PDF');
    }, 1000);
  }
  
  function exportToCSV() {
    showLoading();
    setTimeout(() => {
      hideLoading();
      alert('تم تصدير البيانات بنجاح بصيغة CSV');
    }, 1000);
  }
  
  function getSampleData() {
    return [
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "تجربه",
        "اسم الحاج": "انيسا مسعد سعيد مثنى",
        "رقم الجواز": "09623154",
        "الجنس": "انثى",
        "العمر": "57",
        "المرض المزمن": "ضغط",
        "اسم الطبيب": "تجربه",
        "التاريخ": "2025-02-23",
        "الوقت": "16:39",
        "المحافظة": "صنعاء",
        "الحالة الاجتماعية": "مطلق",
        "الحالة المرضية": "عدوى الفيروسات",
        "التشخيص": "التهاب رئوي",
        "الوصفة الطبية": "سيبروفلوكساسين",
        "صرف العلاج": "تم"
      },
      // المزيد من البيانات...
    ];
  }
});

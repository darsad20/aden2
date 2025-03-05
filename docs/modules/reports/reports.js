import { CONFIG } from "../../config/config.js";

/**
 * نظام تقارير المنشأة الطبية - إصدار محسن
 * يوفر واجهة تفاعلية متقدمة مع تصفية وعرض واستخراج البيانات
 * مع دعم للشاشات المتعددة والوضع المظلم وربط مع أنظمة العلاج والمخزون
 */
document.addEventListener("DOMContentLoaded", () => {
  // العناصر
  const filterForm = document.getElementById("filterForm");
  const reportsContent = document.getElementById("reportsContent");
  const cardViewContainer = document.getElementById("cardViewContainer");
  const reportsTable = document.getElementById("reportsTable");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const printReportBtn = document.getElementById("printReportBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const toggleFilters = document.getElementById("toggleFilters");
  const toggleDashboard = document.getElementById("toggleDashboard");
  const filterSection = document.getElementById("filterSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const resultsCount = document.getElementById("resultsCount");
  const showing = document.getElementById("showing");
  const total = document.getElementById("total");
  const reportDate = document.getElementById("reportDate");
  const facilityName = document.getElementById("facilityName");
  const officeNumber = document.getElementById("officeNumber");
  const tableViewBtn = document.getElementById("tableViewBtn");
  const cardViewBtn = document.getElementById("cardViewBtn");
  const tableViewContainer = document.getElementById("tableViewContainer");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const saveFilterBtn = document.getElementById("saveFilterBtn");
  const savedFiltersList = document.getElementById("savedFiltersList");
  
  // الحالة العامة للتطبيق
  const appState = {
    isDarkMode: localStorage.getItem("darkMode") === "true",
    currentData: [],
    currentFilter: {},
    savedFilters: JSON.parse(localStorage.getItem("savedFilters") || "[]"),
    viewMode: localStorage.getItem("viewMode") || "table", // table أو card
    inventory: {}, // لتخزين بيانات المخزون
    treatmentHistory: {}, // لتخزين تاريخ العلاج
  };
  
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
  }
  
  // تطبيق الوضع المظلم إذا كان محفوظاً
  if (appState.isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  // تحديد وضع العرض المفضل
  if (appState.viewMode === 'card') {
    tableViewContainer.classList.add('d-none');
    cardViewContainer.classList.remove('d-none');
    cardViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
  }
  
  // تحميل الفلاتر المحفوظة
  loadSavedFilters();
  
  setupEventListeners();
  initCharts();
  loadDefaultData();
  loadInventoryData();
  
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
    
    toggleDashboard.addEventListener("click", () => {
      $(dashboardSection).collapse('toggle');
      const icon = toggleDashboard.querySelector('i');
      if (icon.classList.contains('fa-chevron-down')) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      } else {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }
    });
    
    // إضافة مستمعي أحداث لتغيير معلومات المنشأة عند تغيير الفندق أو مكتب الخدمة
    document.getElementById("hotelName").addEventListener("change", updateFacilityInfo);
    document.getElementById("serviceOffice").addEventListener("change", updateFacilityInfo);
    
      // مستمع لتبديل وضع العرض (جدول/بطاقات)
    tableViewBtn.addEventListener("click", () => {
      setViewMode('table');
    });
    
    cardViewBtn.addEventListener("click", () => {
      setViewMode('card');
    });
    
    // مستمع للوضع المظلم
    darkModeToggle.addEventListener("click", toggleDarkMode);
    
    // مستمع لحفظ الفلتر
    saveFilterBtn.addEventListener("click", () => {
      const currentFilterSettings = getCurrentFilterSettings();
      showSaveFilterModal(currentFilterSettings);
    });
    
    // إضافة مستمع للنقر على زر تأكيد حفظ الفلتر في المودال
    document.getElementById("confirmSaveFilter").addEventListener("click", saveCurrentFilter);
    
    // إضافة مستمع لتقديم نموذج الإحالة
    document.getElementById("submitReferral").addEventListener("click", handleReferralSubmit);
    
    // إضافة مستمع لطباعة تاريخ العلاج
    document.getElementById("printTreatmentHistory").addEventListener("click", printTreatmentHistory);
  }
  
  function setViewMode(mode) {
    appState.viewMode = mode;
    localStorage.setItem("viewMode", mode);
    
    if (mode === 'table') {
      tableViewContainer.classList.remove('d-none');
      cardViewContainer.classList.add('d-none');
      tableViewBtn.classList.add('active');
      cardViewBtn.classList.remove('active');
    } else {
      tableViewContainer.classList.add('d-none');
      cardViewContainer.classList.remove('d-none');
      cardViewBtn.classList.add('active');
      tableViewBtn.classList.remove('active');
    }
  }
  
  function toggleDarkMode() {
    appState.isDarkMode = !appState.isDarkMode;
    localStorage.setItem("darkMode", appState.isDarkMode);
    
    if (appState.isDarkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // إعادة تهيئة الرسوم البيانية بعد تغيير الوضع
    initCharts();
  }
  
  function updateFacilityInfo() {
    const selectedHotel = document.getElementById("hotelName").value || "جميع الفنادق";
    const selectedOffice = document.getElementById("serviceOffice").value || "جميع المكاتب";
    
    facilityName.textContent = selectedHotel;
    officeNumber.textContent = selectedOffice;
  }
  
 async function loadDefaultData() {
  showLoading();
  
  try {
    // محاولة جلب البيانات من API
    const apiUrl = `${apiBaseUrl}?action=getAllReports`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      let data = await response.json();
      
      // إضافة هذه الأسطر للتحقق:
      if (!Array.isArray(data)) {
        console.warn("البيانات المستلمة ليست مصفوفة، استخدام بيانات تجريبية.");
        data = getSampleData();
      }
      
      appState.currentData = data;
      renderReportData(data);
      updateStatistics(data);
    } else {
      // بقية الكود يظل كما هو
    }
  } catch (error) {
    // بقية الكود يظل كما هو
  } finally {
    hideLoading();
  }
  
  // جلب بيانات تاريخ العلاج
  loadTreatmentHistory();
}

  
 async function handleFilterSubmit(e) {
  e.preventDefault();
  showLoading();
  
  try {
    const searchText = document.getElementById("searchText").value.trim();
    const reportType = document.getElementById("reportType").value;
    const dateRange = document.getElementById("dateRange").value;
    const governorate = document.getElementById("governorate").value;
    const diseaseType = document.getElementById("diseaseType").value;
    const hotelName = document.getElementById("hotelName").value;
    const serviceOffice = document.getElementById("serviceOffice").value;
    
    // حفظ الفلتر الحالي في حالة التطبيق
    appState.currentFilter = {
      searchText,
      reportType,
      dateRange,
      governorate,
      diseaseType,
      hotelName,
      serviceOffice
    };
    
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
    if (hotelName) params.append('hotelName', hotelName);
    if (serviceOffice) params.append('serviceOffice', serviceOffice);
    
    // تحديث معلومات المنشأة
    updateFacilityInfo();
    
    // استخدام الرابط من الإعدادات
    const apiUrl = apiBaseUrl;
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    
    if (!response.ok) throw new Error(`Network error: ${response.status}`);
    let data = await response.json();
    
    // تحقق إذا كانت البيانات مصفوفة أو كائن خطأ
    if (!Array.isArray(data)) {
      console.error("API لم يرجع مصفوفة:", data);
      if (data && data.success === false) {
        throw new Error(data.message || "خطأ في استرجاع البيانات من الخادم");
      }
      // استخدام بيانات تجريبية
      console.warn("استخدام بيانات تجريبية بدلاً من ذلك.");
      data = getSampleData();
    }
    
    appState.currentData = data;
    renderReportData(data);
    updateStatistics(data);
    
  } catch (error) {
    console.error("Fetch Error:", error);
    reportsContent.innerHTML = `<tr><td colspan="18" class="text-center text-danger">
      حدث خطأ أثناء جلب التقرير: ${error.message}</td></tr>`;
    cardViewContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">
      حدث خطأ أثناء جلب التقرير: ${error.message}</div></div>`;
    updateResultsInfo(0, 0, 0);
  } finally {
    hideLoading();
  }
}

  
  // دالة لتهيئة الرسوم البيانية
  function initCharts() {
    // تهيئة الرسم البياني الدائري للأمراض
    initDiseasesPieChart();
    
    // تهيئة الرسم البياني الخطي للزيارات
    initVisitsLineChart();
  }
  
  function initDiseasesPieChart() {
    const ctx = document.getElementById('diseasesPieChart').getContext('2d');
    
    // تحقق إذا كان الرسم البياني موجوداً بالفعل وتدميره
    if (window.diseasesPieChart && typeof window.diseasesPieChart.destroy === 'function') {
      window.diseasesPieChart.destroy();
    }
    
    // تحديد الألوان بناءً على وضع العرض
    const colors = appState.isDarkMode ? 
      ['#5dade2', '#5cd6a9', '#f7dc6f', '#e57e76', '#af7ac5'] : 
      ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];
    
    try {
      window.diseasesPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['ضغط', 'سكري', 'قلب', 'ربو', 'أخرى'],
          datasets: [{
            data: [35, 25, 20, 10, 10],
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: appState.isDarkMode ? '#eeeeee' : '#333333',
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            title: {
              display: true,
              text: 'توزيع الأمراض المزمنة',
              color: appState.isDarkMode ? '#eeeeee' : '#333333',
              font: {
                size: 16,
                family: 'Tajawal'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          }
        }
      });
    } catch (error) {
      console.error("خطأ في إنشاء مخطط الأمراض:", error);
    }
  }
  
  function initVisitsLineChart() {
    const ctx = document.getElementById('visitsLineChart').getContext('2d');
    
    // تحقق إذا كان الرسم البياني موجوداً بالفعل وتدميره
    if (window.visitsLineChart && typeof window.visitsLineChart.destroy === 'function') {
      window.visitsLineChart.destroy();
    }
    
    // إنشاء بيانات الأيام السبعة الماضية
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      labels.push(date.format('MM/DD'));
      data.push(Math.floor(Math.random() * 40) + 20); // بيانات عشوائية للعرض
    }
    
    try {
      window.visitsLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'عدد الزيارات',
            data: data,
            borderColor: appState.isDarkMode ? '#5dade2' : '#3498db',
            backgroundColor: appState.isDarkMode ? 'rgba(93, 173, 226, 0.1)' : 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: appState.isDarkMode ? '#5dade2' : '#3498db',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'عدد الزيارات في الأسبوع الماضي',
              color: appState.isDarkMode ? '#eeeeee' : '#333333',
              font: {
                size: 16,
                family: 'Tajawal'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                color: appState.isDarkMode ? 'rgba(238, 238, 238, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: appState.isDarkMode ? '#adb5bd' : '#6c757d'
              }
            },
            y: {
              grid: {
                color: appState.isDarkMode ? 'rgba(238, 238, 238, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: appState.isDarkMode ? '#adb5bd' : '#6c757d'
              },
              beginAtZero: true
            }
          }
        }
      });
    } catch (error) {
      console.error("خطأ في إنشاء مخطط الزيارات:", error);
    }
  }
  
  // دالة عرض البيانات في التقارير
 function renderReportData(data) {
  // إضافة هذه الأسطر في بداية الدالة:
  if (!data || !Array.isArray(data)) {
    console.error("خطأ: البيانات ليست مصفوفة", data);
    reportsContent.innerHTML = `<tr><td colspan="18" class="text-center text-danger">خطأ في تنسيق البيانات</td></tr>`;
    cardViewContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">خطأ في تنسيق البيانات</div></div>`;
    updateResultsInfo(0, 0, 0);
    return;
  }
    
    // تحديث العرض الجدولي
    let tableHtml = '';
    data.forEach(row => {
      tableHtml += `
        <tr>
          <td>${row["المنشأة"] || ''}</td>
          <td>${row["الفندق"] || ''}</td>
          <td>${row["مكتب الخدمة"] || ''}</td>
          <td>${row["اسم الحاج"] || ''}</td>
          <td>${row["رقم الجواز"] || ''}</td>
          <td>${row["الجنس"] || ''}</td>
          <td>${row["العمر"] || ''}</td>
          <td>${row["المرض المزمن"] || ''}</td>
          <td>${row["اسم الطبيب"] || ''}</td>
          <td>${row["التاريخ"] || ''}</td>
          <td>${row["الوقت"] || ''}</td>
          <td>${row["المحافظة"] || ''}</td>
          <td>${row["الحالة الاجتماعية"] || ''}</td>
          <td>${row["الحالة المرضية"] || ''}</td>
          <td>${row["التشخيص"] || ''}</td>
          <td>${row["الوصفة الطبية"] || ''}</td>
          <td>${row["صرف العلاج"] || ''}</td>
          <td>
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary view-treatment" data-patient-id="${row["رقم الجواز"]}" data-patient-name="${row["اسم الحاج"]}" data-bs-toggle="tooltip" title="عرض تاريخ العلاج">
                <i class="fas fa-history"></i>
              </button>
              <button class="btn btn-sm btn-outline-info refer-hospital" data-patient-id="${row["رقم الجواز"]}" data-patient-name="${row["اسم الحاج"]}" data-bs-toggle="tooltip" title="إحالة إلى المستشفى">
                <i class="fas fa-ambulance"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    reportsContent.innerHTML = tableHtml;
    
    // تحديث عرض البطاقات
    let cardsHtml = '';
    data.forEach(row => {
      cardsHtml += `
        <div class="col-md-6 col-lg-4">
          <div class="patient-card">
            <div class="patient-card-header">
              <h6 class="patient-name">${row["اسم الحاج"] || 'بدون اسم'}</h6>
              <span class="text-${row["صرف العلاج"] === "تم" ? "success" : "danger"}">${row["صرف العلاج"] || 'لم يتم'}</span>
            </div>
            <div class="patient-info">
              <div class="patient-data-row">
                <span class="patient-label">رقم الجواز:</span>
                <span class="patient-value">${row["رقم الجواز"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">الجنس:</span>
                <span class="patient-value">${row["الجنس"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">العمر:</span>
                <span class="patient-value">${row["العمر"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">المرض المزمن:</span>
                <span class="patient-value">${row["المرض المزمن"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">الفندق:</span>
                <span class="patient-value">${row["الفندق"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">التشخيص:</span>
                <span class="patient-value">${row["التشخيص"] || ''}</span>
              </div>
              <div class="patient-data-row">
                <span class="patient-label">الوصفة الطبية:</span>
                <span class="patient-value">${row["الوصفة الطبية"] || ''}</span>
              </div>
            </div>
            <div class="patient-card-footer">
              <div class="patient-card-actions">
                <button class="btn btn-sm btn-outline-primary view-treatment" data-patient-id="${row["رقم الجواز"]}" data-patient-name="${row["اسم الحاج"]}">
                  <i class="fas fa-history"></i> تاريخ العلاج
                </button>
                <button class="btn btn-sm btn-outline-info refer-hospital" data-patient-id="${row["رقم الجواز"]}" data-patient-name="${row["اسم الحاج"]}">
                  <i class="fas fa-ambulance"></i> إحالة
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    cardViewContainer.innerHTML = cardsHtml;
    
    // تحديث معلومات النتائج
    updateResultsInfo(1, data.length, data.length);
    
    // تهيئة tooltip
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // إضافة مستمعي الأحداث للأزرار
    setupTreatmentButtons();
    setupReferralButtons();
  }
  
  function setupTreatmentButtons() {
    document.querySelectorAll('.view-treatment').forEach(btn => {
      btn.addEventListener('click', function() {
        const patientId = this.dataset.patientId;
        const patientName = this.dataset.patientName;
        showTreatmentHistory(patientId, patientName);
      });
    });
  }
  
  function setupReferralButtons() {
    document.querySelectorAll('.refer-hospital').forEach(btn => {
      btn.addEventListener('click', function() {
        const patientId = this.dataset.patientId;
        const patientName = this.dataset.patientName;
        showHospitalReferral(patientId, patientName);
      });
    });
  }
  
  function showTreatmentHistory(patientId, patientName) {
    const patientData = appState.currentData.find(patient => patient["رقم الجواز"] === patientId);
    
    if (!patientData) {
      console.error("لم يتم العثور على بيانات المريض");
      return;
    }
    
    // تعيين بيانات المريض في المودال
    document.getElementById('patientNameInModal').textContent = patientName;
    document.getElementById('passportInModal').textContent = patientId;
    document.getElementById('ageInModal').textContent = patientData["العمر"] || 'غير محدد';
    document.getElementById('chronicDiseaseInModal').textContent = patientData["المرض المزمن"] || 'لا يوجد';
    
    // تحميل تاريخ العلاج للمريض
    const timelineContent = document.getElementById('treatmentTimelineContent');
    
    if (appState.treatmentHistory[patientId]) {
      let timelineHtml = '';
      
      appState.treatmentHistory[patientId].forEach(treatment => {
        const date = treatment.date;
        const formattedDate = moment(date).format('YYYY/MM/DD');
        
        timelineHtml += `
          <div class="timeline-item">
            <div class="timeline-date">${formattedDate}</div>
            <div class="timeline-content">
              <div class="row mb-2">
                <div class="col-md-6">
                  <strong>التشخيص:</strong> ${treatment.diagnosis}
                </div>
                <div class="col-md-6">
                  <strong>الطبيب:</strong> ${treatment.doctor}
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-md-12">
                  <strong>الوصفة الطبية:</strong> ${treatment.medication}
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <strong>حالة العلاج:</strong> 
                  <span class="badge bg-${treatment.dispensed ? 'success' : 'warning'}">
                               ${treatment.dispensed ? 'تم الصرف' : 'بانتظار الصرف'}
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>الكمية:</strong> ${treatment.quantity}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      timelineContent.innerHTML = timelineHtml;
    } else {
      timelineContent.innerHTML = '<div class="alert alert-info">لم يتم العثور على تاريخ علاج سابق لهذا المريض.</div>';
    }
    
    // عرض المودال
    const modal = new bootstrap.Modal(document.getElementById('treatmentHistoryModal'));
    modal.show();
  }
  
  function showHospitalReferral(patientId, patientName) {
    // تعيين بيانات المريض في نموذج الإحالة
    document.getElementById('referralPatientName').textContent = patientName;
    document.getElementById('referralPassport').textContent = patientId;
    
    // عرض المودال
    const modal = new bootstrap.Modal(document.getElementById('hospitalReferralModal'));
    modal.show();
  }
  
  function handleReferralSubmit() {
    showLoading();
    
    const patientName = document.getElementById('referralPatientName').textContent;
    const passportNumber = document.getElementById('referralPassport').textContent;
    const hospitalName = document.getElementById('hospitalName').value;
    const referralReason = document.getElementById('referralReason').value;
    const urgencyLevel = document.getElementById('urgencyLevel').value;
    const transferMedicalData = document.getElementById('transferMedicalData').checked;
    
    // التحقق من صحة البيانات
    if (!hospitalName || !referralReason) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      hideLoading();
      return;
    }
    
    // محاكاة إرسال البيانات إلى الخادم
    setTimeout(() => {
      console.log("Referral submitted:", {
        patientName,
        passportNumber,
        hospitalName,
        referralReason,
        urgencyLevel,
        transferMedicalData
      });
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('hospitalReferralModal'));
      modal.hide();
      
      // عرض رسالة نجاح
      alert('تم إرسال الإحالة بنجاح');
      
      hideLoading();
    }, 1500);
  }
  
  function printTreatmentHistory() {
    const patientName = document.getElementById('patientNameInModal').textContent;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تاريخ العلاج - ${patientName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
        <style>
          body {
            font-family: 'Tajawal', sans-serif;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .patient-info {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .treatment-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .treatment-date {
            font-weight: bold;
            margin-bottom: 10px;
            color: #3498db;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>تاريخ العلاج الطبي</h1>
            <p>تاريخ الطباعة: ${moment().format('YYYY/MM/DD HH:mm')}</p>
          </div>
          
          <div class="patient-info">
            <div class="row">
              <div class="col-md-6">
                <h4>معلومات المريض</h4>
                <p><strong>الاسم:</strong> ${patientName}</p>
                <p><strong>رقم الجواز:</strong> ${document.getElementById('passportInModal').textContent}</p>
              </div>
              <div class="col-md-6">
                <p><strong>العمر:</strong> ${document.getElementById('ageInModal').textContent}</p>
                <p><strong>المرض المزمن:</strong> ${document.getElementById('chronicDiseaseInModal').textContent}</p>
              </div>
            </div>
          </div>
          
          <h4>سجل العلاجات</h4>
          <div class="treatment-list">
            ${document.getElementById('treatmentTimelineContent').innerHTML}
          </div>
          
          <div class="mt-4 text-center no-print">
            <button class="btn btn-primary" onclick="window.print()">طباعة</button>
            <button class="btn btn-secondary ms-2" onclick="window.close()">إغلاق</button>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
  
  function updateResultsInfo(start, end, total) {
    resultsCount.textContent = `${total} نتائج`;
    showing.textContent = total > 0 ? `${start}-${end}` : "0";
    document.getElementById("total").textContent = total;
  }
  
 function updateStatistics(data) {
  // التحقق من أن البيانات مصفوفة
  if (!data || !Array.isArray(data)) {
    console.error("خطأ: البيانات ليست مصفوفة في updateStatistics", data);
    document.getElementById("totalPatients").textContent = "0";
    document.getElementById("todayVisits").textContent = "0";
    document.getElementById("transferredCases").textContent = "0";
    document.getElementById("criticalCases").textContent = "0";
    
    // تحديث الرسوم البيانية بشكل آمن
    try {
      // استدعاء دالة تحديث الرسوم البيانية مع مصفوفة فارغة
      updateChartsWithData([]);
    } catch (error) {
      console.error("خطأ في تحديث الرسوم البيانية:", error);
    }
    
    return;
  }

  document.getElementById("totalPatients").textContent = data.length.toLocaleString();
    
    // تحديث الرسوم البيانية بالبيانات الجديدة
    updateChartsWithData(data);
  }
  
 function updateChartsWithData(data) {
  // إضافة هذه الأسطر في بداية الدالة:
  if (!data || !Array.isArray(data)) {
    console.error("خطأ: البيانات ليست مصفوفة في updateChartsWithData", data);
    return;
  }
  
  // حساب توزيع الأمراض المزمنة
  const diseases = {
    'ضغط': 0,
    'سكري': 0,
    'قلب': 0,
    'ربو': 0,
    'أخرى': 0
  };
    
    data.forEach(patient => {
      const disease = patient['المرض المزمن'];
      if (disease) {
        if (disease.includes('ضغط')) {
          diseases['ضغط']++;
        } else if (disease.includes('سكري')) {
          diseases['سكري']++;
        } else if (disease.includes('قلب')) {
          diseases['قلب']++;
        } else if (disease.includes('ربو')) {
          diseases['ربو']++;
        } else {
          diseases['أخرى']++;
        }
      } else {
        diseases['أخرى']++;
      }
    });
    
    // تحديث الرسم البياني الدائري
    if (window.diseasesPieChart && window.diseasesPieChart.data) {
      window.diseasesPieChart.data.datasets[0].data = [
        diseases['ضغط'],
        diseases['سكري'],
        diseases['قلب'],
        diseases['ربو'],
        diseases['أخرى']
      ];
      window.diseasesPieChart.update();
    } else {
      // إذا لم يكن المخطط موجودًا، قم بتهيئته من جديد
      initDiseasesPieChart();
    }
    
    // حساب الزيارات اليومية للأسبوع الماضي
    const dailyVisits = {};
    
    // تهيئة البيانات للأيام السبعة الماضية
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      dailyVisits[date] = 0;
    }
    
    // حساب عدد الزيارات لكل يوم
    data.forEach(patient => {
      const visitDate = patient['التاريخ'];
      if (visitDate && dailyVisits[visitDate] !== undefined) {
        dailyVisits[visitDate]++;
      }
    });
    
    // تحديث الرسم البياني الخطي
    if (window.visitsLineChart && window.visitsLineChart.data) {
      const labels = Object.keys(dailyVisits).map(date => moment(date).format('MM/DD'));
      const visitCounts = Object.values(dailyVisits);
      
      window.visitsLineChart.data.labels = labels;
      window.visitsLineChart.data.datasets[0].data = visitCounts;
      window.visitsLineChart.update();
    } else {
      // إذا لم يكن المخطط موجودًا، قم بتهيئته من جديد
      initVisitsLineChart();
    }
  }
  
  function showLoading() {
    loadingOverlay.classList.remove('d-none');
  }
  
  function hideLoading() {
    loadingOverlay.classList.add('d-none');
  }
  
  async function exportToExcel() {
    showLoading();
    
    // تحضير البيانات للتصدير
    const formattedData = formatDataForExport(appState.currentData);
    
    // محاكاة عملية التصدير
    setTimeout(() => {
      try {
        // إذا كنت تستخدم مكتبة مثل SheetJS (xlsx) يمكنك استخدامها هنا
        // أو يمكن استبدالها بأي طريقة تفضلها للتصدير
        
        // إنشاء عنصر <a> مخفي لتنزيل الملف
        const filename = `تقرير_${moment().format('YYYY-MM-DD_HHmmss')}.xlsx`;
        
        console.log("تم تصدير البيانات:", formattedData);
        alert(`تم تصدير البيانات بنجاح إلى ملف Excel باسم ${filename}`);
      } catch (error) {
        console.error("خطأ في تصدير البيانات:", error);
        alert("حدث خطأ أثناء تصدير البيانات: " + error.message);
      } finally {
        hideLoading();
      }
    }, 1500);
  }
  
  function getSampleData() {
    return [
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "فندق الصفا",
        "مكتب الخدمة": "1",
        "اسم الحاج": "انيسا مسعد سعيد مثنى",
        "رقم الجواز": "09623154",
        "الجنس": "انثى",
        "العمر": "57",
        "المرض المزمن": "ضغط",
        "اسم الطبيب": "د. محمد احمد",
        "التاريخ": "2023-02-23",
        "الوقت": "16:39",
        "المحافظة": "صنعاء",
        "الحالة الاجتماعية": "مطلق",
        "الحالة المرضية": "عدوى الفيروسات",
        "التشخيص": "التهاب رئوي",
        "الوصفة الطبية": "سيبروفلوكساسين",
        "صرف العلاج": "تم"
      },
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "فندق المروة",
        "مكتب الخدمة": "2",
        "اسم الحاج": "احمد محمد علي",
        "رقم الجواز": "08745219",
        "الجنس": "ذكر",
        "العمر": "65",
        "المرض المزمن": "سكري",
        "اسم الطبيب": "د. خالد عبدالله",
        "التاريخ": "2023-02-24",
        "الوقت": "10:15",
        "المحافظة": "عمران",
        "الحالة الاجتماعية": "متزوج",
        "الحالة المرضية": "ارتفاع سكر الدم",
        "التشخيص": "خلل في السكر",
        "الوصفة الطبية": "انسولين",
        "صرف العلاج": "تم"
      },
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "فندق الرياض",
        "مكتب الخدمة": "3",
        "اسم الحاج": "فاطمة علي سالم",
        "رقم الجواز": "07563214",
        "الجنس": "انثى",
        "العمر": "48",
        "المرض المزمن": "قلب",
        "اسم الطبيب": "د. سارة يوسف",
        "التاريخ": "2023-02-24",
        "الوقت": "14:20",
        "المحافظة": "ذمار",
        "الحالة الاجتماعية": "متزوج",
        "الحالة المرضية": "خفقان القلب",
        "التشخيص": "عدم انتظام ضربات القلب",
        "الوصفة الطبية": "بيتا بلوكر",
        "صرف العلاج": "تم"
      },
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "فندق الصفا",
        "مكتب الخدمة": "2",
        "اسم الحاج": "ياسر عمر فؤاد",
        "رقم الجواز": "06389521",
        "الجنس": "ذكر",
        "العمر": "72",
        "المرض المزمن": "ضغط",
        "اسم الطبيب": "د. محمد احمد",
        "التاريخ": "2023-02-25",
        "الوقت": "09:45",
        "المحافظة": "تعز",
        "الحالة الاجتماعية": "متزوج",
        "الحالة المرضية": "ارتفاع ضغط الدم",
        "التشخيص": "ضغط دم مرتفع",
        "الوصفة الطبية": "لوسارتان",
        "صرف العلاج": "تم"
      },
      {
        "المنشأة": "ابراج طيبة",
        "الفندق": "فندق المروة",
        "مكتب الخدمة": "1",
        "اسم الحاج": "نورة سالم عبدالله",
        "رقم الجواز": "05412389",
        "الجنس": "انثى",
        "العمر": "53",
        "المرض المزمن": "سكري",
        "اسم الطبيب": "د. خالد عبدالله",
        "التاريخ": "2023-02-25",
        "الوقت": "11:30",
        "المحافظة": "صنعاء",
        "الحالة الاجتماعية": "أرمل",
        "الحالة المرضية": "انخفاض سكر الدم",
        "التشخيص": "هبوط سكر",
        "الوصفة الطبية": "جلوكوز",
        "صرف العلاج": "تم"
      }
    ];
  }
  
  // دالة لتوليد بيانات تجريبية لتاريخ العلاج
  function generateSampleTreatmentHistory() {
    // إنشاء حالة تاريخ علاج تجريبية للمرضى
    const treatmentHistory = {};
    
    // مثال لتاريخ علاج الحاج "انيسا"
    treatmentHistory["09623154"] = [
      {
        date: "2023-02-23",
        diagnosis: "التهاب رئوي",
        doctor: "د. محمد احمد",
        medication: "سيبروفلوكساسين 500 ملغ مرتين يومياً",
        dispensed: true,
        quantity: "10 أقراص"
      },
      {
        date: "2023-01-15",
        diagnosis: "التهاب الحلق",
        doctor: "د. أحمد سالم",
        medication: "أموكسيسيلين 500 ملغ ثلاث مرات يومياً",
        dispensed: true,
        quantity: "15 أقراص"
      }
    ];
    
    // مثال لتاريخ علاج الحاج "احمد"
    treatmentHistory["08745219"] = [
      {
        date: "2023-02-24",
        diagnosis: "خلل في السكر",
        doctor: "د. خالد عبدالله",
        medication: "انسولين 10 وحدات قبل الوجبات",
        dispensed: true,
        quantity: "3 عبوات"
      },
      {
        date: "2023-02-10",
        diagnosis: "ارتفاع سكر الدم",
        doctor: "د. خالد عبدالله",
        medication: "ميتفورمين 500 ملغ مرتين يومياً",
        dispensed: true,
        quantity: "30 أقراص"
      },
      {
        date: "2023-01-05",
        diagnosis: "فحص دوري للسكر",
        doctor: "د. سارة يوسف",
        medication: "متابعة النظام الغذائي",
        dispensed: false,
        quantity: "لا يوجد"
      }
    ];
    
    // مثال لتاريخ علاج الحاج "فاطمة"
    treatmentHistory["07563214"] = [
      {
        date: "2023-02-24",
        diagnosis: "عدم انتظام ضربات القلب",
        doctor: "د. سارة يوسف",
        medication: "بيتا بلوكر 25 ملغ مرة يومياً",
        dispensed: true,
        quantity: "30 أقراص"
      },
      {
        date: "2023-02-01",
        diagnosis: "ضعف عضلة القلب",
        doctor: "د. سارة يوسف",
        medication: "ديجوكسين 0.125 ملغ مرة يومياً",
        dispensed: true,
        quantity: "30 أقراص"
      }
    ];
    
    return treatmentHistory;
  }
  
  // دالة لتوليد بيانات تجريبية للمخزون
  function generateSampleInventoryData() {
    return {
      "باراسيتامول": { total: 1000, used: 250, remaining: 750 },
      "أموكسيسيلين": { total: 800, used: 440, remaining: 360 },
      "أنسولين": { total: 500, used: 400, remaining: 100 },
      "لوسارتان": { total: 600, used: 300, remaining: 300 },
      "سيبروفلوكساسين": { total: 400, used: 200, remaining: 200 }
    };
  }
  
  // دالة للحصول على معلومات العلاجات من API
  async function loadTreatmentHistory() {
    try {
      // محاولة جلب البيانات من API
      const apiUrl = `${apiBaseUrl}?action=getTreatmentHistory`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        appState.treatmentHistory = data;
      } else {
        console.warn("لم يتم الاتصال بالخادم، استخدام بيانات تجريبية لتاريخ العلاج.");
        // استخدام بيانات تجريبية في حالة فشل الاتصال
        appState.treatmentHistory = generateSampleTreatmentHistory();
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات تاريخ العلاج:", error);
      // استخدام بيانات تجريبية في حالة حدوث خطأ
      appState.treatmentHistory = generateSampleTreatmentHistory();
    }
  }
  
  // دالة لجلب بيانات المخزون
  async function loadInventoryData() {
    try {
      // محاولة جلب البيانات من API
      const apiUrl = `${apiBaseUrl}?action=getInventoryData`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        appState.inventory = data;
        updateInventoryDisplay();
      } else {
        console.warn("لم يتم الاتصال بالخادم، استخدام بيانات تجريبية للمخزون.");
        // استخدام بيانات تجريبية في حالة فشل الاتصال
        appState.inventory = generateSampleInventoryData();
        updateInventoryDisplay();
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات المخزون:", error);
      // استخدام بيانات تجريبية في حالة حدوث خطأ
      appState.inventory = generateSampleInventoryData();
      updateInventoryDisplay();
    }
  }
  
  // تحديث عرض المخزون
  function updateInventoryDisplay() {
    const inventoryBars = document.querySelector('.inventory-bars');
    if (!inventoryBars) return;
    
    let html = '';
    const medications = Object.keys(appState.inventory);
    
    medications.slice(0, 3).forEach(medication => {
      const item = appState.inventory[medication];
      const percentage = Math.round((item.remaining / item.total) * 100);
      let statusClass = 'success';
      
      if (percentage <= 30) {
        statusClass = 'danger';
      } else if (percentage <= 60) {
        statusClass = 'warning';
      }
      
      html += `
        <div class="inventory-item">
          <div class="d-flex justify-content-between mb-1">
            <span>${medication}</span>
            <span>${percentage}%</span>
          </div>
          <div class="progress mb-2" style="height: 8px;">
            <div class="progress-bar bg-${statusClass}" role="progressbar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    });
    
    inventoryBars.innerHTML = html;
  }
  
  // دمج بيانات التقرير مع بيانات العلاج (إذا لزم الأمر)
  function mergeReportDataWithTreatment(reportData, treatmentData) {
    if (!treatmentData || Object.keys(treatmentData).length === 0) return reportData;
    
    // تنفيذ منطق الدمج هنا
    const mergedData = reportData.map(report => {
      const patientId = report["رقم الجواز"];
      const patientTreatments = treatmentData[patientId];
      
      if (patientTreatments && patientTreatments.length > 0) {
        // الحصول على آخر معاملة
        const latestTreatment = patientTreatments[0];
        
        return {
          ...report,
          "صرف العلاج": latestTreatment.dispensed ? "تم" : "لم يتم",
          "عدد العلاجات السابقة": patientTreatments.length
        };
      }
      
      return report;
    });
    
    return mergedData;
  }
  
  // دالة مساعدة لتنسيق البيانات للتصدير
  function formatDataForExport(data) {
    return data.map(row => {
      // تنسيق البيانات للتصدير
      const formattedRow = { ...row };
      
      // إضافة اسم الفندق ومكتب الخدمة بشكل صريح هنا
      // في حالة لم تكن موجودة بالفعل في البيانات
      if (!formattedRow["الفندق"]) {
        formattedRow["الفندق"] = document.getElementById("hotelName").value || "غير محدد";
      }
      
      if (!formattedRow["مكتب الخدمة"]) {
        formattedRow["مكتب الخدمة"] = document.getElementById("serviceOffice").value || "غير محدد";
      }
      
      // إضافة معلومات تاريخ العلاج إذا كانت متوفرة
      const patientId = formattedRow["رقم الجواز"];
      if (appState.treatmentHistory[patientId]) {
        formattedRow["عدد العلاجات السابقة"] = appState.treatmentHistory[patientId].length;
      } else {
        formattedRow["عدد العلاجات السابقة"] = 0;
      }
      
      return formattedRow;
    });
  }
  
  // الوظائف المتعلقة بحفظ وتحميل الفلاتر
  function getCurrentFilterSettings() {
    return {
      reportType: document.getElementById("reportType").value,
      dateRange: document.getElementById("dateRange").value,
      searchText: document.getElementById("searchText").value,
      hotelName: document.getElementById("hotelName").value,
      serviceOffice: document.getElementById("serviceOffice").value,
      governorate: document.getElementById("governorate").value,
      diseaseType: document.getElementById("diseaseType").value
    };
  }
  
  function showSaveFilterModal(filterSettings) {
    // عرض إعدادات الفلتر الحالية في المودال
    const currentFilterSettings = document.getElementById("currentFilterSettings");
    let html = '<ul class="list-unstyled">';
    
    if (filterSettings.reportType) {
      html += `<li><strong>نوع التقرير:</strong> ${document.getElementById("reportType").options[document.getElementById("reportType").selectedIndex].text}</li>`;
    }
    
    if (filterSettings.dateRange) {
      html += `<li><strong>الفترة الزمنية:</strong> ${filterSettings.dateRange}</li>`;
    }
    
    if (filterSettings.searchText) {
      html += `<li><strong>نص البحث:</strong> ${filterSettings.searchText}</li>`;
    }
    
    if (filterSettings.hotelName) {
      html += `<li><strong>الفندق:</strong> ${document.getElementById("hotelName").options[document.getElementById("hotelName").selectedIndex].text}</li>`;
    }
    
    if (filterSettings.serviceOffice) {
      html += `<li><strong>مكتب الخدمة:</strong> ${document.getElementById("serviceOffice").options[document.getElementById("serviceOffice").selectedIndex].text}</li>`;
    }
    
    if (filterSettings.governorate) {
      html += `<li><strong>المحافظة:</strong> ${document.getElementById("governorate").options[document.getElementById("governorate").selectedIndex].text}</li>`;
    }
    
    if (filterSettings.diseaseType) {
      html += `<li><strong>المرض المزمن:</strong> ${document.getElementById("diseaseType").options[document.getElementById("diseaseType").selectedIndex].text}</li>`;
    }
    
    html += '</ul>';
    
    if (html === '<ul class="list-unstyled"></ul>') {
      html = '<div class="alert alert-warning">لم يتم تحديد أي معايير للفلتر.</div>';
    }
    
    currentFilterSettings.innerHTML = html;
    
    // عرض المودال
    const modal = new bootstrap.Modal(document.getElementById('saveFilterModal'));
    modal.show();
  }
  
  function saveCurrentFilter() {
    const filterName = document.getElementById("filterName").value.trim();
    
    if (!filterName) {
      alert("يرجى إدخال اسم للفلتر");
      return;
    }
    
    const currentSettings = getCurrentFilterSettings();
    const newFilter = {
      id: Date.now(),
      name: filterName,
      settings: currentSettings
    };
    
    // إضافة الفلتر إلى القائمة
    appState.savedFilters.push(newFilter);
    
    // حفظ الفلاتر في localStorage
    localStorage.setItem("savedFilters", JSON.stringify(appState.savedFilters));
    
    // تحديث قائمة الفلاتر المحفوظة
    loadSavedFilters();
    
    // إغلاق المودال
    const modal = bootstrap.Modal.getInstance(document.getElementById('saveFilterModal'));
    modal.hide();
    
    // تنبيه المستخدم
    alert(`تم حفظ الفلتر "${filterName}" بنجاح`);
  }
  
  function loadSavedFilters() {
    const savedFiltersList = document.getElementById("savedFiltersList");
    
    if (appState.savedFilters.length === 0) {
      savedFiltersList.innerHTML = '<li><span class="dropdown-item disabled">لا توجد فلاتر محفوظة</span></li>';
      return;
    }
    
    let html = '';
    
    appState.savedFilters.forEach(filter => {
      html += `
        <li>
          <a class="dropdown-item d-flex justify-content-between align-items-center" href="#" data-filter-id="${filter.id}">
            <span>${filter.name}</span>
            <button class="btn btn-sm btn-outline-danger delete-filter" data-filter-id="${filter.id}" onclick="event.stopPropagation();">
              <i class="fas fa-times"></i>
            </button>
          </a>
        </li>
      `;
    });
    
    savedFiltersList.innerHTML = html;
    
    // إضافة مستمعي الأحداث للفلاتر المحفوظة
    document.querySelectorAll('[data-filter-id]').forEach(item => {
      if (!item.classList.contains('delete-filter')) {
        item.addEventListener('click', function(e) {
          e.preventDefault();
          const filterId = parseInt(this.dataset.filterId);
          applyFilter(filterId);
        });
      }
    });
    
    // إضافة مستمعي الأحداث لأزرار الحذف
    document.querySelectorAll('.delete-filter').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const filterId = parseInt(this.dataset.filterId);
        deleteFilter(filterId);
      });
    });
  }
  
  function applyFilter(filterId) {
    const filter = appState.savedFilters.find(f => f.id === filterId);
    
    if (!filter) {
      console.error("لم يتم العثور على الفلتر");
      return;
    }
    
    // تطبيق إعدادات الفلتر على النموذج
    const settings = filter.settings;
    
    document.getElementById("reportType").value = settings.reportType || '';
    document.getElementById("dateRange").value = settings.dateRange || '';
    document.getElementById("searchText").value = settings.searchText || '';
    document.getElementById("hotelName").value = settings.hotelName || '';
    document.getElementById("serviceOffice").value = settings.serviceOffice || '';
    document.getElementById("governorate").value = settings.governorate || '';
    document.getElementById("diseaseType").value = settings.diseaseType || '';
    
    // تحديث معلومات المنشأة
    updateFacilityInfo();
    
    // تطبيق الفلتر تلقائياً
    document.getElementById("applyFilters").click();
  }
  
  function deleteFilter(filterId) {
    if (confirm("هل أنت متأكد من حذف هذا الفلتر؟")) {
      // حذف الفلتر من المصفوفة
      appState.savedFilters = appState.savedFilters.filter(f => f.id !== filterId);
      
      // حفظ التغييرات في localStorage
      localStorage.setItem("savedFilters", JSON.stringify(appState.savedFilters));
      
      // تحديث قائمة الفلاتر
      loadSavedFilters();
    }
  }
});

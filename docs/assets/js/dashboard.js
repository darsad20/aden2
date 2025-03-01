/**
 * نظام إدارة الرعاية الصحية لحجاج اليمن
 * @version 2.0.0
 * @description نظام متكامل لمتابعة الرعاية الصحية لحجاج الجمهورية اليمنية
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

/**
 * تهيئة لوحة المتابعة الرئيسية
 */
function initializeDashboard() {
  updateStatisticsData();
  // تم حذف استدعاء الدوال الخاصة بالرسم البياني لأنها تمثل أقساماً أسفل البطاقات
  setupNotificationSystem();
  setupMobileNavigation();
  enhanceAccessibility();
  setupEventListeners();
}

/**
 * تحديث بيانات الإحصائيات من Google Apps Script API
 * الرابط: https://script.google.com/macros/s/AKfycbzy-SYwUOW-0jAOvZHT6Q1MKxwm7PIXgRe4dia4NVoD6dBzxP2PyD_i9yGF0IKlnwrg/exec
 */
function updateStatisticsData() {
  const baseUrl = 'https://script.google.com/macros/s/AKfycbzy-SYwUOW-0jAOvZHT6Q1MKxwm7PIXgRe4dia4NVoD6dBzxP2PyD_i9yGF0IKlnwrg/exec';

  // تحديث إجمالي الحجاج
  fetch(`${baseUrl}?action=getTotalPilgrims`)
    .then(response => response.json())
    .then(data => {
      const totalPilgrims = typeof data === 'number' ? data : 0;
      animateCounter("totalPilgrims", totalPilgrims);
    })
    .catch(error => {
      console.error("Error fetching totalPilgrims:", error);
      animateCounter("totalPilgrims", 0);
    });

  // تحديث عدد الزوار اليومي (تصفية بناءً على تاريخ اليوم)
  fetch(`${baseUrl}?action=getDailyVisitors`)
    .then(response => response.json())
    .then(data => {
      const today = new Date().toISOString().split("T")[0];
      const dailyVisitors = Array.isArray(data)
        ? data.filter(row => row["التاريخ"] && row["التاريخ"].includes(today))
        : [];
      animateCounter("treatedCases", dailyVisitors.length);
    })
    .catch(error => {
      console.error("Error fetching dailyVisitors:", error);
      animateCounter("treatedCases", 0);
    });

  // تحديث الحالات المحولة
  fetch(`${baseUrl}?action=getTransferredCases`)
    .then(response => response.json())
    .then(data => {
      const transferredCases = Array.isArray(data) ? data.length : 0;
      animateCounter("transferredCases", transferredCases);
    })
    .catch(error => {
      console.error("Error fetching transferredCases:", error);
      animateCounter("transferredCases", 0);
    });

  // تحديث عدد الوفيات
  fetch(`${baseUrl}?action=getDeathReport`)
    .then(response => response.json())
    .then(data => {
      const deathCount = Array.isArray(data) ? data.length : 0;
      animateCounter("deathCount", deathCount);
    })
    .catch(error => {
      console.error("Error fetching deathReport:", error);
      animateCounter("deathCount", 0);
    });

  // تحديث عدد التنبيهات (يمكن تعديل هذا الجزء حسب الحاجة)
  const notificationBadge = document.getElementById("notificationCount");
  if (notificationBadge) {
    notificationBadge.innerText = "5";
  }
}

/**
 * تطبيق تأثير عداد للإحصائيات
 * @param {string} elementId - معرف العنصر
 * @param {number} targetValue - القيمة النهائية
 */
function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 1500; // مدة التأثير بالميللي ثانية
  const startTime = performance.now();
  const startValue = 0;
  
  function updateCounter(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // استخدام دالة تخفيف للحصول على تأثير جمالي
    const easedProgress = easeOutQuad(progress);
    const currentValue = Math.floor(startValue + easedProgress * (targetValue - startValue));
    
    element.innerText = currentValue.toLocaleString("ar-SA");
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.innerText = targetValue.toLocaleString("ar-SA");
    }
  }
  
  requestAnimationFrame(updateCounter);
}

/**
 * دالة تخفيف تربيعية للحركة
 * @param {number} t - نسبة التقدم (0-1)
 * @returns {number} - قيمة مُخفَفة للانتقال السلس
 */
function easeOutQuad(t) {
  return t * (2 - t);
}

/**
 * إعداد نظام التنبيهات
 */
function setupNotificationSystem() {
  const notifications = [
    { 
      id: 1, 
      message: "تنبيه: حالة طارئة لحاج يمني يحتاج متابعة عاجلة في مستشفى منى!", 
      type: "emergency", 
      time: "منذ 5 دقائق" 
    },
    { 
      id: 2, 
      message: "تذكير: يجب تحديث بيانات حالات الإجهاد الحراري للحجاج اليمنيين في موقع عرفات.", 
      type: "reminder", 
      time: "منذ 20 دقيقة" 
    },
    { 
      id: 3, 
      message: "إشعار: تم إضافة 15 حالة جديدة من الحجاج اليمنيين في العيادات الميدانية.", 
      type: "info", 
      time: "منذ ساعة" 
    },
    { 
      id: 4, 
      message: "تقرير: تم نقل 3 حجاج يمنيين من منطقة المشاعر إلى المستشفى التخصصي.", 
      type: "transfer", 
      time: "منذ ساعتين" 
    },
    { 
      id: 5, 
      message: "تحديث: وصول كشف جديد بمعلومات الحجاج اليمنيين المتأخرين.", 
      type: "update", 
      time: "منذ 3 ساعات" 
    }
  ];

  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      toastContainer.innerHTML = "";
      notifications.forEach((notif) => showNotification(notif, toastContainer));
    });
  }

  notifications.slice(0, 3).forEach((notif) => showNotification(notif, toastContainer));
}

/**
 * عرض تنبيه محدد في الواجهة
 * @param {Object} notification - كائن التنبيه
 * @param {HTMLElement} container - حاوية التنبيهات
 */
function showNotification(notification, container) {
  const { id, message, type, time } = notification;
  
  let bgClass, iconClass;
  
  switch (type) {
    case "emergency":
      bgClass = "bg-danger";
      iconClass = "fa-triangle-exclamation";
      break;
    case "reminder":
      bgClass = "bg-warning text-dark";
      iconClass = "fa-bell";
      break;
    case "info":
      bgClass = "bg-info text-dark";
      iconClass = "fa-circle-info";
      break;
    case "transfer":
      bgClass = "bg-primary";
      iconClass = "fa-ambulance";
      break;
    case "update":
      bgClass = "bg-success";
      iconClass = "fa-refresh";
      break;
    default:
      bgClass = "bg-secondary";
      iconClass = "fa-bell";
  }
  
  const toast = document.createElement("div");
  toast.className = `toast ${bgClass} border-0 mb-2`;
  toast.id = `toast-${id}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  
  const textColorClass = ["bg-warning", "bg-info"].includes(bgClass) ? "text-dark" : "text-white";
  
  toast.innerHTML = `
    <div class="toast-header ${bgClass} ${textColorClass}">
      <i class="fas ${iconClass} me-2"></i>
      <strong class="me-auto">${getNotificationTitle(type)}</strong>
      <small>${time}</small>
      <button type="button" class="btn-close ${textColorClass === 'text-white' ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="إغلاق"></button>
    </div>
    <div class="toast-body ${textColorClass}">
      ${message}
    </div>
  `;
  
  container.appendChild(toast);
  
  const toastInstance = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 7000,
  });
  
  toastInstance.show();
}

/**
 * الحصول على عنوان التنبيه حسب نوعه
 * @param {string} type - نوع التنبيه
 * @returns {string} - عنوان التنبيه
 */
function getNotificationTitle(type) {
  switch (type) {
    case "emergency":
      return "تنبيه طارئ";
    case "reminder":
      return "تذكير";
    case "info":
      return "معلومات";
    case "transfer":
      return "نقل حالة";
    case "update":
      return "تحديث";
    default:
      return "إشعار";
  }
}

/**
 * إعداد التنقل للأجهزة المحمولة
 */
function setupMobileNavigation() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content");
  
  if (!sidebarToggle || !sidebar || !content) return;
  
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    
    const icon = sidebarToggle.querySelector("i");
    if (icon) {
      if (sidebar.classList.contains("show")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
      } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }
    }
  });
  
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains("show") && 
        !sidebar.contains(e.target) && 
        e.target !== sidebarToggle &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove("show");
      
      const icon = sidebarToggle.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }
    }
  });
}

/**
 * تحسين إمكانية الوصول
 */
function enhanceAccessibility() {
  document.querySelectorAll('#sidebar a').forEach((link) => {
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        window.location.href = link.getAttribute("href");
      }
    });
  });

  document.querySelectorAll('.stat-card').forEach((card) => {
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.add("card-focus");
        setTimeout(() => card.classList.remove("card-focus"), 300);
      }
    });

    card.addEventListener("mouseenter", () => {
      card.setAttribute("aria-expanded", "true");
    });
    
    card.addEventListener("mouseleave", () => {
      card.setAttribute("aria-expanded", "false");
    });
  });
  
  document.querySelectorAll('.stat-card').forEach((card) => {
    const title = card.querySelector('.card-title').textContent;
    const value = card.querySelector('.display-6').textContent;
    card.setAttribute('aria-label', `${title}: ${value}`);
  });

  document.querySelectorAll('button').forEach(button => {
    if (!button.getAttribute('aria-label')) {
      const text = button.textContent.trim();
      if (text) {
        button.setAttribute('aria-label', text);
      }
    }
  });
}

/**
 * إعداد مستمعي الأحداث المختلفة
 */
function setupEventListeners() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function() {
      const icon = this.querySelector("i");
      if (icon) {
        icon.classList.add("fa-spin");
      }
      
      setTimeout(() => {
        updateStatisticsData();
        
        const toastContainer = document.getElementById("toastContainer");
        if (toastContainer) {
          showNotification({
            id: "refresh-success",
            message: "تم تحديث بيانات لوحة المتابعة بنجاح",
            type: "update",
            time: "الآن"
          }, toastContainer);
        }
        
        if (icon) {
          icon.classList.remove("fa-spin");
        }
      }, 1500);
    });
  }
  
  document.querySelectorAll('.urgent-case button').forEach(button => {
    button.addEventListener('click', function() {
      const caseElement = this.closest('.urgent-case');
      const patientName = caseElement.querySelector('h5').textContent;
      const action = this.textContent.trim();
      
      alert(`سيتم ${action === 'متابعة' ? 'متابعة' : 'عرض تفاصيل'} حالة ${patientName}`);
    });
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'h') {
      const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
      helpModal.show();
    }
  });
}

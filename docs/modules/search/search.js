/**
 * وحدة بحث الحاج - نظام الرعاية الصحية للحجاج 1446هـ
 * يوفر وظائف البحث وعرض بيانات الحجاج
 * رابط النشر: https://hajj-healthcare-app.netlify.app/
 * الإصدار: 1.2.0
 */

(function () {
  "use strict";

  // تكوين التطبيق
  const CONFIG = {
    API_URL:
      "https://script.google.com/macros/s/AKfycbzy-SYwUOW-0jAOvZHT6Q1MKxwm7PIXgRe4dia4NVoD6dBzxP2PyD_i9yGF0IKlnwrg/exec",
    VERSION: "1.2.0",
    APP_URL: "https://hajj-healthcare-app.netlify.app/",
    SEARCH_DELAY: 500, // تأخير البحث المباشر بالمللي ثانية
    STORAGE_KEY: "hajj_healthcare_last_search",
    MIN_SEARCH_LENGTH: 3, // الحد الأدنى لعدد الأحرف للبحث التلقائي
  };

  // عناصر DOM
  const elements = {
    searchForm: document.getElementById("searchForm"),
    passportInput: document.getElementById("passport"),
    nameInput: document.getElementById("pilgrimName"),
    clearPassportBtn: document.getElementById("clearPassport"),
    clearNameBtn: document.getElementById("clearName"),
    resetSearchBtn: document.getElementById("resetSearch"),
    searchResults: document.getElementById("searchResults"),
    pilgrimCard: document.getElementById("pilgrimCard"),
    pilgrimInfo: document.getElementById("pilgrimInfo"),
    pilgrimPassportBadge: document.getElementById("pilgrimPassportBadge"),
    loadingSpinner: document.getElementById("loadingSpinner"),
    treatmentLink: document.getElementById("treatmentLink"),
    deathLink: document.getElementById("deathLink"),
    printButton: document.getElementById("printButton"),
    keyboardShortcuts: document.getElementById("keyboardShortcuts"),
  };

  // تهيئة التلميحات
  function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }

  // حدث تحميل الصفحة
  document.addEventListener("DOMContentLoaded", function () {
    console.log(`نظام الرعاية الصحية للحجاج - النسخة ${CONFIG.VERSION}`);
    initTooltips();
    setupEventListeners();
    checkUrlParameters();
    restoreLastSearch();

    // تأثيرات دخول الصفحة
    animateEntrance();
  });

  // تأثيرات دخول الصفحة
  function animateEntrance() {
    document.querySelector(".search-container").style.opacity = "0";
    setTimeout(() => {
      document.querySelector(".search-container").style.opacity = "1";
      document.querySelector(".search-container").classList.add("animate__fadeInUp");
    }, 300);
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    // نموذج البحث
    elements.searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      performSearch();
    });

    // أزرار المسح
    elements.clearPassportBtn.addEventListener("click", function () {
      elements.passportInput.value = "";
      elements.passportInput.focus();
    });

    elements.clearNameBtn.addEventListener("click", function () {
      elements.nameInput.value = "";
      elements.nameInput.focus();
    });

    // زر إعادة تعيين البحث
    elements.resetSearchBtn.addEventListener("click", function () {
      resetSearch();
    });

    // البحث المباشر أثناء الكتابة
    let searchTimeout;
    elements.passportInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const value = this.value.trim();
      if (value.length >= CONFIG.MIN_SEARCH_LENGTH) {
        elements.passportInput.classList.add("is-searching");
        searchTimeout = setTimeout(() => {
          performSearch();
          elements.passportInput.classList.remove("is-searching");
        }, CONFIG.SEARCH_DELAY);
      }
    });

    // زر الطباعة
    elements.printButton.addEventListener("click", function () {
      printPilgrimData();
    });

    // اختصارات لوحة المفاتيح
    document.addEventListener("keydown", function (e) {
      // Alt + F للتركيز على حقل البحث
      if (e.altKey && e.key === "f") {
        e.preventDefault();
        elements.passportInput.focus();
        showToast("تم التركيز على حقل البحث", "info", 1000);
      }

      // Alt + Enter لتنفيذ البحث
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }

      // Escape لإعادة تعيين البحث
      if (e.key === "Escape") {
        resetSearch();
        showToast("تم إعادة تعيين البحث", "info", 1000);
      }
    });
  }

  // التحقق من معلمات URL
  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const passport = urlParams.get("passport");
    const name = urlParams.get("name");

    if (passport) {
      elements.passportInput.value = passport;
      setTimeout(() => performSearch(), 500);
    } else if (name) {
      elements.nameInput.value = name;
      setTimeout(() => performSearch(), 500);
    }
  }

  // استعادة آخر بحث
  function restoreLastSearch() {
    const savedSearch = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (savedSearch) {
      try {
        const searchData = JSON.parse(savedSearch);
        const oneDayMs = 24 * 60 * 60 * 1000;
        const isRecent = new Date().getTime() - searchData.timestamp < oneDayMs;

        if (isRecent) {
          if (searchData.passport) elements.passportInput.value = searchData.passport;
          if (searchData.name) elements.nameInput.value = searchData.name;

          showToast("تم استعادة آخر بحث", "info", 3000);
        } else {
          localStorage.removeItem(CONFIG.STORAGE_KEY);
        }
      } catch (e) {
        console.error("خطأ في استعادة البيانات المحفوظة:", e);
        localStorage.removeItem(CONFIG.STORAGE_KEY);
      }
    }
  }

  // حفظ آخر بحث
  function saveLastSearch() {
    const searchData = {
      passport: elements.passportInput.value.trim(),
      name: elements.nameInput.value.trim(),
      timestamp: new Date().getTime(),
    };

    if (searchData.passport || searchData.name) {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(searchData));
    }
  }

  // إعادة تعيين البحث
  function resetSearch() {
    elements.passportInput.value = "";
    elements.nameInput.value = "";
    elements.searchResults.classList.add("d-none");
    elements.searchResults.innerHTML = "";
    elements.pilgrimCard.classList.add("d-none");
    elements.passportInput.focus();
  }

  // عرض رسالة توست
  function showToast(message, icon = "success", timer = 3000) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: message,
      position: "top",
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
  }

  // تنفيذ البحث
  async function performSearch() {
    const passport = elements.passportInput.value.trim();
    const pilgrimName = elements.nameInput.value.trim();

    if (!passport && !pilgrimName) {
      showMessage(
        "يرجى إدخال رقم الجواز أو اسم الحاج للبحث",
        "warning"
      );
      return;
    }

    saveLastSearch();
    showLoading(true);
    elements.searchResults.classList.remove("d-none");
    elements.pilgrimCard.classList.add("d-none");

    try {
      let searchParams = new URLSearchParams();

      if (passport) {
        searchParams.append("action", "searchPilgrim");
        searchParams.append("passport", passport);
      } else {
        searchParams.append("action", "searchByName");
        searchParams.append("pilgrimName", pilgrimName);
      }

      const response = await fetch(
        `${CONFIG.API_URL}?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`خطأ في الاتصال بالخادم: ${response.status}`);
      }

      const data = await response.json();
      handleSearchResults(data);
    } catch (error) {
      console.error("خطأ في البحث:", error);
      showMessage(`حدث خطأ أثناء البحث: ${error.message}`, "danger");
    } finally {
      showLoading(false);
    }
  }

  // التعامل مع نتائج البحث
  function handleSearchResults(data) {
    if (!data || data.length === 0) {
      showMessage(
        `<div class="text-center">
          <i class="fas fa-search fa-3x mb-3 text-warning"></i>
          <h4>لا توجد نتائج</h4>
          <p class="text-muted">لم يتم العثور على بيانات تطابق معايير البحث</p>
          <button class="btn btn-sm btn-outline-secondary mt-2" onclick="window.location.reload()">
            <i class="fas fa-sync me-2"></i> بحث جديد
          </button>
        </div>`,
        "warning"
      );
      return;
    }

    // نتائج متعددة
    if (data.length > 1) {
      displaySearchResults(data);
    } else {
      // نتيجة واحدة - عرض بطاقة الحاج
      displayPilgrimCard(data[0]);

      // عرض رسالة نجاح مؤقتة
      showToast("تم العثور على بيانات الحاج", "success");
    }
  }

  // عرض نتائج البحث المتعددة
  function displaySearchResults(results) {
    let html = `
      <div class="card border-0 shadow-sm animate__animated animate__fadeIn">
        <div class="card-header bg-gradient-light py-3">
          <div class="text-center">
            <h3 class="mb-1"><i class="fas fa-list-ul me-2 text-primary"></i> نتائج البحث</h3>
            <span class="search-results-count">
              <i class="fas fa-users me-1"></i> عدد النتائج: ${results.length}
            </span>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-3">
            <div class="filter-container">
              <i class="fas fa-filter filter-icon"></i>
              <input type="text" class="form-control" id="filterResults" 
                   placeholder="تصفية النتائج..." aria-label="تصفية النتائج">
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th><i class="fa-solid fa-passport"></i> رقم الجواز</th>
                  <th><i class="fa-solid fa-user"></i> اسم الحاج</th>
                  <th><i class="fa-solid fa-venus-mars"></i> الجنس</th>
                  <th><i class="fa-solid fa-cake-candles"></i> العمر</th>
                  <th><i class="fa-solid fa-flag"></i> الجنسية</th>
                </tr>
              </thead>
              <tbody id="resultsTableBody">`;

    results.forEach((pilgrim) => {
      html += `
        <tr class="pilgrim-row" data-passport="${pilgrim["رقم الجواز"]}">
          <td><strong>${pilgrim["رقم الجواز"] || ""}</strong></td>
          <td>${pilgrim["اسم الحاج"] || ""}</td>
          <td>${
            pilgrim["الجنس"] === "ذكر"
              ? '<i class="fas fa-male text-primary"></i> ذكر'
              : pilgrim["الجنس"] === "أنثى"
              ? '<i class="fas fa-female text-danger"></i> أنثى'
              : pilgrim["الجنس"] || ""
          }</td>
          <td>${pilgrim["العمر"] || ""}</td>
          <td>${pilgrim["الجنسية"] || ""}</td>
        </tr>`;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>
        <div class="table-footer">
          <i class="fas fa-info-circle me-1"></i>
          انقر على الصف لاختيار الحاج
        </div>
      </div>
    `;

    elements.searchResults.innerHTML = html;

    // إضافة معالج النقر على الصفوف
    document.querySelectorAll(".pilgrim-row").forEach((row) => {
      row.addEventListener("click", function () {
        const passport = this.dataset.passport;
        if (passport) {
          getAndDisplayPilgrimByPassport(passport);
        }
      });
    });

    // إضافة تصفية للنتائج
    const filterInput = document.getElementById("filterResults");
    if (filterInput) {
      filterInput.addEventListener("input", function () {
        const filterValue = this.value.toLowerCase();
        document.querySelectorAll("#resultsTableBody tr").forEach((row) => {
          const rowText = row.textContent.toLowerCase();
          row.style.display = rowText.includes(filterValue) ? "" : "none";
        });
      });

      // التركيز على حقل التصفية
      filterInput.focus();
    }
  }

  // الحصول على بيانات الحاج برقم الجواز وعرضها
  async function getAndDisplayPilgrimByPassport(passport) {
    showLoading(true);

    try {
      const params = new URLSearchParams({
        action: "searchPilgrim",
        passport: passport,
      });

      const response = await fetch(`${CONFIG.API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`خطأ في الاتصال بالخادم: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        elements.searchResults.innerHTML = "";
        displayPilgrimCard(data[0]);

        // تحديث حقل البحث بقيمة الجواز
        elements.passportInput.value = passport;
        elements.nameInput.value = "";

        // حفظ البحث في التخزين المحلي
        saveLastSearch();
      } else {
        showMessage("لا يمكن العثور على بيانات الحاج", "warning");
      }
    } catch (error) {
      console.error("خطأ في تحديث بيانات الحاج:", error);
      showMessage(
        `حدث خطأ أثناء تحديث البيانات: ${error.message}`,
        "danger"
      );
    } finally {
      showLoading(false);
    }
  }

  // عرض بطاقة الحاج
  function displayPilgrimCard(pilgrim) {
    elements.searchResults.classList.add("d-none");
    elements.pilgrimCard.classList.remove("d-none");

    // إضافة تأثير متحرك
    elements.pilgrimCard.classList.add("animate__fadeIn");
    setTimeout(() => {
      elements.pilgrimCard.classList.remove("animate__fadeIn");
    }, 1000);

    // عرض رقم الجواز في الشارة
    elements.pilgrimPassportBadge.innerHTML = `<i class="fas fa-passport me-2"></i>${
      pilgrim["رقم الجواز"] || "غير متوفر"
    }`;

    // تصنيف البيانات
    const personalInfo = {};
    const medicalInfo = {};
    const otherInfo = {};

    Object.entries(pilgrim).forEach(([key, value]) => {
      if (!value || (typeof value === "string" && value.trim() === "")) return;

      if (
        ["اسم الحاج", "رقم الجواز", "الجنس", "العمر", "الجنسية"].includes(key)
      ) {
        personalInfo[key] = value;
      } else if (
        ["المرض المزمن", "اسم العلاج المستخدم", "حالة المريض"].includes(key)
      ) {
        medicalInfo[key] = value;
      } else {
        otherInfo[key] = value;
      }
    });

    // إنشاء محتوى البطاقة
    let cardContent = "";

    // بيانات شخصية
    if (Object.keys(personalInfo).length > 0) {
      cardContent += createInfoSection(
        "البيانات الشخصية",
        personalInfo,
        "fa-user-circle"
      );
    }

    // بيانات طبية
    if (Object.keys(medicalInfo).length > 0) {
      cardContent += createInfoSection(
        "البيانات الطبية",
        medicalInfo,
        "fa-stethoscope"
      );
    }

      // بيانات أخرى
    if (Object.keys(otherInfo).length > 0) {
      cardContent += createInfoSection(
        "بيانات إضافية",
        otherInfo,
        "fa-info-circle"
      );
    }

    elements.pilgrimInfo.innerHTML = cardContent;

    // تحديث روابط الصفحات الأخرى
    const passport = pilgrim["رقم الجواز"] || "";
    if (passport) {
      elements.treatmentLink.href = `../treatment/treatment.html?passport=${passport}`;
      elements.deathLink.href = `../death/death.html?passport=${passport}`;
    }
  }

  // إنشاء قسم معلومات في البطاقة
  function createInfoSection(title, data, icon = "fa-info-circle") {
    const iconMap = {
      "اسم الحاج": "fa-user",
      "رقم الجواز": "fa-passport",
      "الجنس": "fa-venus-mars",
      "العمر": "fa-cake-candles",
      "الجنسية": "fa-flag",
      "المنشأة": "fa-building",
      "الفندق": "fa-hotel",
      "المرض المزمن": "fa-heart-pulse",
      "اسم العلاج المستخدم": "fa-capsules",
      "حالة المريض": "fa-stethoscope",
      "التاريخ": "fa-calendar",
      "الوقت": "fa-clock",
      "رقم الحملة": "fa-id-card",
      "ملاحظات": "fa-sticky-note",
    };

    let rows = "";
    Object.entries(data).forEach(([key, value]) => {
      const fieldIcon = iconMap[key] || "fa-circle-info";
      
      // تحقق من نوع البيانات لعرضها بشكل مناسب
      let displayValue = value;
      
      // خاص بالجنس
      if (key === "الجنس") {
        const genderIcon = value === "ذكر" ? "fa-male text-primary" : "fa-female text-danger";
        displayValue = `<i class="fas ${genderIcon} me-2"></i> ${value}`;
      }
      
      rows += `
        <tr>
          <th><i class="fa-solid ${fieldIcon} me-2"></i>${key}</th>
          <td>${displayValue}</td>
        </tr>`;
    });

    return `
      <div class="pilgrim-section">
        <h4><i class="fa-solid ${icon} me-2"></i>${title}</h4>
        <table class="pilgrim-data-table">
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // عرض رسالة
  function showMessage(message, type = "info") {
    elements.searchResults.classList.remove("d-none");

    const alertClass = `alert-${type}`;
    let icon = "info-circle";
    
    switch (type) {
      case 'danger':
        icon = "exclamation-triangle";
        break;
      case 'warning':
        icon = "exclamation-circle";
        break;
      case 'success':
        icon = "check-circle";
        break;
      default:
        icon = "info-circle";
    }

    elements.searchResults.innerHTML = `
      <div class="alert ${alertClass} animate__animated animate__fadeIn">
        <div class="alert-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div>${message}</div>
      </div>`;
  }

  // إظهار/إخفاء حالة التحميل
  function showLoading(show) {
    if (elements.loadingSpinner) {
      elements.loadingSpinner.classList.toggle("d-none", !show);
    }
  }

  // طباعة بيانات الحاج - باستخدام iframe للطباعة (الدالة المصححة)
  function printPilgrimData() {
    // إنشاء iframe مؤقت للطباعة
    const printFrame = document.createElement('iframe');
    
    // تعيين خصائص الإطار
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.name = 'printFrame';
    printFrame.id = 'printFrame';
    
    document.body.appendChild(printFrame);
    
    // الحصول على محتوى الإطار
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    
    // الحصول على رقم الجواز واسم الحاج
    const passportNumber = elements.pilgrimPassportBadge.textContent.trim();
    let pilgrimName = "";
    
    // البحث عن اسم الحاج بطريقة صحيحة
    const allRows = elements.pilgrimInfo.querySelectorAll('tr');
    for (let i = 0; i < allRows.length; i++) {
      const thElement = allRows[i].querySelector('th');
      if (thElement && thElement.textContent.includes("اسم الحاج")) {
        const tdElement = allRows[i].querySelector('td');
        pilgrimName = tdElement ? tdElement.textContent.trim() : "";
        break;
      }
    }
    
    // إنشاء محتوى HTML للطباعة
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بيانات الحاج - نظام الرعاية الصحية للحجاج</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          /* تنسيقات الطباعة */
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            color: #000;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #eee;
          }
          
          .print-header h2 {
            margin: 0 0 5px;
            font-size: 20px;
          }
          
          .print-header h3 {
            margin: 0;
            font-size: 18px;
            color: #555;
          }
          
          .passport-badge {
            text-align: center;
            margin: 15px 0;
            padding: 8px 15px;
            background-color: #f8f9fa;
            display: inline-block;
            border-radius: 30px;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 20px;
            border: 1px solid #eee;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .section-header {
            background-color: #f8f9fa;
            padding: 10px 15px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            padding: 8px 15px;
            text-align: right;
            border-bottom: 1px solid #f0f0f0;
          }
          
          tr:last-child th, tr:last-child td {
            border-bottom: none;
          }
          
          th {
            width: 35%;
            color: #555;
          }
          
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #777;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>نظام الرعاية الصحية للحجاج 1446هـ</h2>
          <h3>بطاقة بيانات الحاج</h3>
        </div>
        
        <div style="text-align: center;">
          <div class="passport-badge">
            رقم الجواز: ${passportNumber}
          </div>
        </div>
        
        ${elements.pilgrimInfo.innerHTML}
        
        <div class="print-footer">
          <p>
            تم استخراج هذه البيانات من نظام الرعاية الصحية للحجاج 1446هـ
            <br>
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
      </body>
      </html>
    `);
    
    frameDoc.close();
    
    // انتظار تحميل المحتوى ثم الطباعة
    setTimeout(function() {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      // إزالة الإطار بعد الطباعة
      setTimeout(function() {
        document.body.removeChild(printFrame);
      }, 500);
    }, 300);
  }

  // وظيفة مساعدة للعثور على العناصر التي تحتوي على نص معين
  function setupContains() {
    // دالة مساعدة للبحث عن عنصر يحتوي على نص معين
    document.findElementWithText = function(selector, text) {
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent.includes(text)) {
          return elements[i];
        }
      }
      return null;
    };
    
    // دالة مساعدة للبحث عن عناصر تحتوي على نص معين (تُرجع مصفوفة)
    document.findElementsWithText = function(selector, text) {
      const elements = document.querySelectorAll(selector);
      const results = [];
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent.includes(text)) {
          results.push(elements[i]);
        }
      }
      return results;
    };
  }

  /**
   * وظائف مساعدة
   */

  // تنسيق التاريخ للعرض
  function formatDate(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-SA");
    } catch {
      return dateString;
    }
  }

  // تحقق من صحة رقم الجواز
  function isValidPassport(passport) {
    if (!passport) return false;
    return passport.length >= 5;
  }

  // تمييز النص المطابق في نتائج البحث
  function highlightMatch(text, searchTerm) {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }

  // تنقية النص من العلامات HTML
  function sanitizeText(text) {
    if (!text) return "";
    return text.replace(/[<>"'&]/g, (match) => {
      switch (match) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        case "&":
          return "&amp;";
      }
    });
  }
  
  // استدعاء وظيفة الإعداد
  setupContains();
  
  // تطبيق استدعاء البحث عند استرجاع الصفحة من التاريخ
  window.addEventListener('pageshow', function(event) {
    // إذا كانت الصفحة قادمة من التخزين المؤقت (back/forward navigation)
    if (event.persisted) {
      // إعادة تهيئة العناصر والمستمعين
      setupDOMReferences();
      setupEventListeners();
    }
  });
  
  // إعادة تعريف مراجع DOM
  function setupDOMReferences() {
    elements.searchForm = document.getElementById("searchForm");
    elements.passportInput = document.getElementById("passport");
    elements.nameInput = document.getElementById("pilgrimName");
    elements.clearPassportBtn = document.getElementById("clearPassport");
    elements.clearNameBtn = document.getElementById("clearName");
    elements.resetSearchBtn = document.getElementById("resetSearch");
    elements.searchResults = document.getElementById("searchResults");
    elements.pilgrimCard = document.getElementById("pilgrimCard");
    elements.pilgrimInfo = document.getElementById("pilgrimInfo");
    elements.pilgrimPassportBadge = document.getElementById("pilgrimPassportBadge");
    elements.loadingSpinner = document.getElementById("loadingSpinner");
    elements.treatmentLink = document.getElementById("treatmentLink");
    elements.deathLink = document.getElementById("deathLink");
    elements.printButton = document.getElementById("printButton");
    elements.keyboardShortcuts = document.getElementById("keyboardShortcuts");
  }
  
  // إضافة وظيفة لتحسين أداء البحث
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // تحسين أداء البحث المباشر
  const debouncedSearch = debounce(() => {
    performSearch();
  }, CONFIG.SEARCH_DELAY);
  
  // تحسين تنسيق بطاقة الطباعة
  function applyPrintStyles(doc) {
    // تحويل الأيقونات إلى نصوص بسيطة في وثيقة الطباعة
    const iconElements = doc.querySelectorAll('.fa, .fas, .far, .fab, .fa-solid, .fa-regular, .fa-brands');
    iconElements.forEach(icon => {
      icon.style.display = 'none';
    });
    
    // تحسين عرض الجداول للطباعة
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
    });
    
    const rows = doc.querySelectorAll('tr');
    rows.forEach(row => {
      row.style.borderBottom = '1px solid #eee';
    });
    
    const cells = doc.querySelectorAll('th, td');
    cells.forEach(cell => {
      cell.style.padding = '8px';
      cell.style.textAlign = 'right';
    });
    
    // تنسيق العناوين
    const headers = doc.querySelectorAll('h4');
    headers.forEach(header => {
      header.style.fontSize = '16px';
      header.style.marginTop = '20px';
      header.style.marginBottom = '10px';
      header.style.borderBottom = '1px solid #eee';
      header.style.paddingBottom = '5px';
    });
  }
  
  // التحقق من اتصال الإنترنت
  function checkConnection() {
    if (!navigator.onLine) {
      showMessage(
        `<div class="text-center">
          <i class="fas fa-wifi fa-3x mb-3 text-warning"></i>
          <h4>لا يوجد اتصال بالإنترنت</h4>
          <p class="text-muted">يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</p>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.location.reload()">
            <i class="fas fa-sync me-2"></i> إعادة المحاولة
          </button>
        </div>`,
        "warning"
      );
      return false;
    }
    return true;
  }
  
  // إضافة المستمع لحالة الاتصال
  window.addEventListener('online', function() {
    showToast('تم استعادة الاتصال بالإنترنت', 'success');
  });
  
  window.addEventListener('offline', function() {
    showToast('انقطع الاتصال بالإنترنت', 'warning');
  });
  
  // إضافة مستمع لإغلاق النوافذ المنبثقة عند النقر خارجها
  document.addEventListener('click', function(event) {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
      const tooltipTrigger = document.querySelector(`[aria-describedby="${tooltip.id}"]`);
      if (tooltipTrigger && !tooltipTrigger.contains(event.target) && !tooltip.contains(event.target)) {
        const bsTooltip = bootstrap.Tooltip.getInstance(tooltipTrigger);
        if (bsTooltip) {
          bsTooltip.hide();
        }
      }
    });
  });
  
  // التعامل مع أخطاء الشبكة
  window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT') {
      console.error(`فشل تحميل المورد: ${e.target.src}`);
    }
  }, true);
  
  // تتبع الأداء
  if (window.performance) {
    console.log(`وقت تحميل الصفحة: ${Math.round(performance.now())} مللي ثانية`);
  }
})();


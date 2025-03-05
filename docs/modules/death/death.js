/**
 * وحدة تسجيل وفاة الحجاج
 *
 * هذا الملف يتعامل مع وظائف تسجيل حالات الوفاة للحجاج،
 * بما في ذلك البحث عن الحاج، إدخال بيانات الوفاة وحفظها
 */

// استيراد الخدمات بطريقة ES Modules
import { ApiService } from "../../core/services/api.service.js";
import { AuthService } from "../../core/services/auth.service.js";
import { PilgrimService } from "../../core/services/pilgrim.service.js";
import { DateUtils } from "../../core/utils/date.utils.js";
import { ValidationUtils } from "../../core/utils/validation.utils.js";

// تهيئة متغيرات الوحدة
let currentPilgrim = null;
let isFormValid = false;
let isSubmitting = false;
let autoSaveInterval = null;
let lastDraftSave = null;

// دالة للتأخير (Debounce)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

document.addEventListener("DOMContentLoaded", () => {
  // تعريف العناصر
  const searchBtn = document.getElementById("searchBtn");
  const pilgrimSearch = document.getElementById("pilgrimSearch");
  const pilgrimDetails = document.getElementById("pilgrimDetails");
  const deathForm = document.getElementById("deathForm");
  const deathCause = document.getElementById("deathCause");
  const otherCauseDiv = document.getElementById("otherCauseDiv");
  const deathLocation = document.getElementById("deathLocation");
  const hospitalDiv = document.getElementById("hospitalDiv");
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");
  const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
  const confirmSave = document.getElementById("confirmSave");
  const reportUpload = document.getElementById("reportUpload");
  const filePreviewContainer = document.getElementById("filePreviewContainer");

  // تهيئة التاريخ والوقت الحالي
  initDateAndTime();

  // محاولة استعادة نموذج مؤقت إذا كان موجودًا
  loadFormDraft();

  // بدء الحفظ التلقائي
  startAutoSave();

  // إضافة الأحداث للعناصر
  searchBtn.addEventListener("click", handleSearch);
  
  // إضافة التأخير (Debounce) على البحث
  pilgrimSearch.addEventListener("input", debounce(() => {
    if (pilgrimSearch.value.length >= 3) {
      handleSearch();
    }
  }, 500));
  
  pilgrimSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  });

  deathForm.addEventListener("submit", handleSubmit);
  resetBtn.addEventListener("click", resetForm);
  confirmSave.addEventListener("click", saveDeathRecord);
  printBtn.addEventListener("click", printDeathCertificate);

  // أحداث للحقول الديناميكية
  deathCause.addEventListener("change", () => {
    if (deathCause.value === "other") {
      otherCauseDiv.classList.remove("d-none");
      document.getElementById("otherCause").setAttribute("required", "required");
    } else {
      otherCauseDiv.classList.add("d-none");
      document.getElementById("otherCause").removeAttribute("required");
    }
    validateForm();
  });

  deathLocation.addEventListener("change", () => {
    if (deathLocation.value === "hospital") {
      hospitalDiv.classList.remove("d-none");
      document.getElementById("hospital").setAttribute("required", "required");
    } else {
      hospitalDiv.classList.add("d-none");
      document.getElementById("hospital").removeAttribute("required");
    }
    validateForm();
  });

  // التحقق من الملف المرفوع
  reportUpload.addEventListener("change", function (e) {
    const file = this.files[0];
    if (!file) {
      filePreviewContainer.classList.add("d-none");
      return;
    }

    if (!validateFileUpload(file)) {
      this.value = "";
      return;
    }

    // عرض معاينة الملف
    const preview = document.getElementById("filePreview");
    filePreviewContainer.classList.remove("d-none");

    if (file.type.startsWith("image/")) {
      preview.innerHTML = `<img src="${URL.createObjectURL(
        file
      )}" class="img-fluid" style="max-height: 200px;">`;
    } else {
      preview.innerHTML = `<i class="fas fa-file-pdf fa-3x text-danger"></i><p class="mt-2">${file.name}</p>`;
    }
  });

  // إضافة مستمعي الأحداث لجميع حقول النموذج للتحقق
  const formInputs = deathForm.querySelectorAll("input, select, textarea");
  formInputs.forEach((input) => {
    input.addEventListener("change", validateForm);
    input.addEventListener("input", debounce(validateForm, 300));
  });

  // التحويل من تاريخ ميلادي إلى هجري
  document.getElementById("deathDate").addEventListener("change", (e) => {
    const gregorianDate = e.target.value;
    if (gregorianDate) {
      const hijriDate = DateUtils.convertToHijri(gregorianDate);
      document.getElementById("hijriDeathDate").textContent = hijriDate || "";
      
      // اقتراح سبب وفاة محتمل بناءً على التاريخ والموقع
      suggestCauseBasedOnDateAndLocation(gregorianDate);
    } else {
      document.getElementById("hijriDeathDate").textContent = "";
    }
  });
});

/**
 * تهيئة التاريخ والوقت الحالي في الحقول
 */
function initDateAndTime() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  // تعيين التاريخ الحالي
  document.getElementById("deathDate").value = today;

  // تعيين الوقت الحالي
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("deathTime").value = `${hours}:${minutes}`;

  // تحويل التاريخ إلى هجري
  const hijriDate = DateUtils.convertToHijri(today);
  document.getElementById("hijriDeathDate").textContent = hijriDate || "";
}

/**
 * اقتراح سبب وفاة محتمل بناءً على التاريخ والموقع
 * @param {string} date - التاريخ الميلادي بتنسيق yyyy-mm-dd
 */
function suggestCauseBasedOnDateAndLocation(date) {
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1; // getMonth() يبدأ من 0
  const deathLocation = document.getElementById("deathLocation").value;
  
  // اقتراح ضربة حرارة في فصل الصيف وخاصة في منى وعرفات
  if ((month >= 6 && month <= 9) && 
      (deathLocation === "mina" || deathLocation === "arafat")) {
    const deathCause = document.getElementById("deathCause");
    if (!deathCause.value || deathCause.value === "") {
      deathCause.value = "heat_stroke";
      // إعلام المستخدم بالاقتراح
      showEnhancedAlert(
        "تم اقتراح ضربة حرارة كسبب محتمل للوفاة بناءً على الموقع والتاريخ",
        "info"
      );
    }
  }
}

/**
 * البحث عن بيانات الحاج
 */
async function handleSearch() {
  const searchInput = document.getElementById("pilgrimSearch");
  const searchValue = ValidationUtils.sanitizeInput(searchInput.value.trim());
  
  if (!searchValue) {
    showEnhancedAlert("يرجى إدخال رقم الحاج أو رقم الجواز للبحث", "warning");
    return;
  }

  try {
    // عرض مؤشر التحميل
    searchInput.disabled = true;
    document.getElementById("searchBtn").innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 
      جاري البحث...
    `;

    // استدعاء خدمة البحث عن الحاج
    const pilgrim = await PilgrimService.findPilgrim(searchValue);

    if (pilgrim) {
      displayPilgrimInfo(pilgrim);
      validateForm();
      
      // إذا كان هناك مسودة محفوظة للنموذج، استخدمها
      if (currentPilgrim && currentPilgrim.pilgrim_id === pilgrim.pilgrim_id) {
        loadFormDraft();
      }
    } else {
      showEnhancedAlert(
        "لم يتم العثور على بيانات الحاج، يرجى التأكد من الرقم المدخل", 
        "error"
      );
      resetPilgrimInfo();
    }
  } catch (error) {
    console.error("خطأ في البحث:", error);
    showEnhancedAlert(
      "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى", 
      "error"
    );
  } finally {
    // إعادة تفعيل حقل البحث
    searchInput.disabled = false;
    document.getElementById("searchBtn").innerHTML = `<i class="fas fa-search"></i> بحث`;
  }
}

/**
 * عرض بيانات الحاج
 */
function displayPilgrimInfo(pilgrim) {
  // حفظ بيانات الحاج الحالي
  currentPilgrim = pilgrim;
  
  // إخفاء رسالة البحث وإظهار التفاصيل
  document.getElementById("searchPrompt").classList.add("d-none");
  document.getElementById("pilgrimDetails").classList.remove("d-none");

  // عرض البيانات
  document.getElementById("pilgrimName").textContent = pilgrim.name || "-";
  document.getElementById("pilgrimNationality").textContent = pilgrim.nationality || "-";
  document.getElementById("pilgrimPassport").textContent = pilgrim.passport_number || "-";
  document.getElementById("pilgrimId").textContent = pilgrim.pilgrim_id || "-";
  document.getElementById("pilgrimCampaign").textContent = pilgrim.campaign_name || "-";
  document.getElementById("pilgrimGender").textContent = pilgrim.gender === "M" ? "ذكر" : "أنثى";

  // تفعيل زر الحفظ وزر الطباعة
  document.getElementById("saveBtn").disabled = false;
  document.getElementById("printBtn").disabled = true; // يبقى معطلاً حتى يتم حفظ السجل

  // تعيين اسم الحاج في نافذة التأكيد
  document.getElementById("confirmName").textContent = pilgrim.name;
}

/**
 * إعادة تعيين بيانات الحاج
 */
function resetPilgrimInfo() {
  currentPilgrim = null;
  
  // إظهار رسالة البحث وإخفاء التفاصيل
  document.getElementById("searchPrompt").classList.remove("d-none");
  document.getElementById("pilgrimDetails").classList.add("d-none");

  // إعادة تعيين البيانات
  const fields = ["pilgrimName", "pilgrimNationality", "pilgrimPassport", "pilgrimId", "pilgrimCampaign", "pilgrimGender"];
  fields.forEach(field => {
    document.getElementById(field).textContent = "-";
  });

  // تعطيل زر الحفظ
  document.getElementById("saveBtn").disabled = true;
  document.getElementById("printBtn").disabled = true;
}

/**
 * التحقق من صحة الملف المرفوع
 * @param {File} file - ملف مرفق للتحقق
 * @returns {boolean} - هل الملف صالح
 */
function validateFileUpload(file) {
  const maxSize = 5 * 1024 * 1024; // 5 ميجابايت
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (file.size > maxSize) {
    showEnhancedAlert("حجم الملف يتجاوز الحد المسموح (5 ميجابايت)", "warning");
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    showEnhancedAlert("نوع الملف غير مدعوم. يُسمح فقط بملفات PDF، JPG، PNG", "warning");
    return false;
  }
  
  return true;
}

/**
 * التحقق من صحة النموذج
 */
function validateForm() {
  const requiredFields = [
    "deathDate", 
    "deathTime", 
    "deathCause",
    "deathLocation"
  ];
  
  // التحقق من حقل سبب آخر إذا تم اختياره
  if (document.getElementById("deathCause").value === "other") {
    requiredFields.push("otherCause");
  }

  // التحقق من حقل المستشفى إذا تم اختياره
  if (document.getElementById("deathLocation").value === "hospital") {
    requiredFields.push("hospital");
  }

  // التحقق من الحقول المطلوبة
  let valid = true;
  requiredFields.forEach(field => {
    const element = document.getElementById(field);
    if (!element.value.trim()) {
      valid = false;
    }
  });

  // التحقق من وجود حاج محدد
  if (!currentPilgrim) {
    valid = false;
  }

  isFormValid = valid;
  document.getElementById("saveBtn").disabled = !valid;

  // حفظ مسودة تلقائية عند تغيير البيانات
  saveFormDraft();

  return valid;
}

/**
 * حفظ مسودة النموذج في التخزين المحلي
 */
function saveFormDraft() {
  if (!currentPilgrim) return;
  
  const formData = {
    pilgrim_id: currentPilgrim.pilgrim_id,
    deathDate: document.getElementById("deathDate").value,
    deathTime: document.getElementById("deathTime").value,
    deathCause: document.getElementById("deathCause").value,
    deathLocation: document.getElementById("deathLocation").value,
    hospital: document.getElementById("hospital").value,
    otherCause: document.getElementById("otherCause").value,
    deathNotes: document.getElementById("deathNotes").value,
    savedAt: new Date().toISOString()
  };
  
  localStorage.setItem('deathFormDraft_' + currentPilgrim.pilgrim_id, JSON.stringify(formData));
  
  // تحديث حالة الحفظ التلقائي
  lastDraftSave = new Date();
  updateAutoSaveStatus();
}

/**
 * تحميل المسودة المحفوظة للنموذج
 */
function loadFormDraft() {
  if (!currentPilgrim) return;
  
  const draftKey = 'deathFormDraft_' + currentPilgrim.pilgrim_id;
  const draft = localStorage.getItem(draftKey);
  
  if (draft) {
    try {
      const formData = JSON.parse(draft);
      
      // التحقق من صلاحية المسودة (مثلاً: مدة صلاحية المسودة يوم واحد)
      const savedDate = new Date(formData.savedAt);
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (now - savedDate < oneDayInMs) {
        // استعادة القيم إلى النموذج
        document.getElementById("deathDate").value = formData.deathDate || "";
        document.getElementById("deathTime").value = formData.deathTime || "";
        document.getElementById("deathCause").value = formData.deathCause || "";
        document.getElementById("deathLocation").value = formData.deathLocation || "";
        document.getElementById("hospital").value = formData.hospital || "";
        document.getElementById("otherCause").value = formData.otherCause || "";
        document.getElementById("deathNotes").value = formData.deathNotes || "";
        
        // تحديث العناصر الديناميكية
        if (formData.deathCause === "other") {
          document.getElementById("otherCauseDiv").classList.remove("d-none");
        }
        
        if (formData.deathLocation === "hospital") {
          document.getElementById("hospitalDiv").classList.remove("d-none");
        }
        
        // تحديث التاريخ الهجري
        if (formData.deathDate) {
          const hijriDate = DateUtils.convertToHijri(formData.deathDate);
          document.getElementById("hijriDeathDate").textContent = hijriDate || "";
        }
        
        // إعلام المستخدم
        showEnhancedAlert(
          "تم استعادة بيانات مسودة محفوظة مسبقًا", 
          "info"
        );
        
        lastDraftSave = savedDate;
        updateAutoSaveStatus();
      } else {
        // حذف المسودة منتهية الصلاحية
        localStorage.removeItem(draftKey);
      }
    } catch (error) {
      console.error("خطأ في استعادة المسودة:", error);
      localStorage.removeItem(draftKey);
    }
  }
}

/**
 * بدء تشغيل الحفظ التلقائي
 */
function startAutoSave() {
  // تنفيذ الحفظ التلقائي كل دقيقة
  autoSaveInterval = setInterval(() => {
    if (currentPilgrim && isFormValid) {
      saveFormDraft();
    }
  }, 60000); // دقيقة واحدة
}

/**
 * تحديث حالة الحفظ التلقائي
 */
function updateAutoSaveStatus() {
  const statusElement = document.getElementById("autoSaveStatus");
  
  if (lastDraftSave) {
    const formattedTime = lastDraftSave.toLocaleTimeString();
    statusElement.textContent = `آخر حفظ تلقائي: ${formattedTime}`;
    statusElement.classList.add("active");
    
    // إخفاء الحالة بعد بضع ثوانٍ
    setTimeout(() => {
      statusElement.classList.remove("active");
    }, 3000);
  }
}

/**
 * معالجة تقديم النموذج
 */
function handleSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showEnhancedAlert("يرجى تعبئة جميع الحقول المطلوبة", "warning");
    return;
  }

  // إضافة محتوى CSRF للحماية
  const csrfToken = AuthService.getCSRFToken ? AuthService.getCSRFToken() : null;
  if (csrfToken) {
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "_csrf";
    csrfInput.value = csrfToken;
    document.getElementById("deathForm").appendChild(csrfInput);
  }

  // عرض نافذة التأكيد
  const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
  confirmModal.show();
}

/**
 * حفظ سجل الوفاة
 */
async function saveDeathRecord() {
  if (isSubmitting || !isFormValid) return;
  
  try {
    isSubmitting = true;

    // تعيين زر التأكيد لحالة التحميل
    const confirmButton = document.getElementById("confirmSave");
    const originalButtonText = confirmButton.innerHTML;
    confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...`;
    confirmButton.disabled = true;

    // تجميع بيانات الوفاة
    const deathData = {
      pilgrim_id: currentPilgrim.pilgrim_id,
      death_date: document.getElementById("deathDate").value,
      death_time: document.getElementById("deathTime").value,
      death_cause: document.getElementById("deathCause").value,
      death_location: document.getElementById("deathLocation").value,
      notes: document.getElementById("deathNotes").value || null,
      recorded_by: AuthService.getCurrentUser()?.id || null,
      _csrf: AuthService.getCSRFToken ? AuthService.getCSRFToken() : null
    };

    // إضافة بيانات إضافية إذا كانت متوفرة
    if (deathData.death_cause === "other") {
      deathData.other_cause = document.getElementById("otherCause").value;
    }

    if (deathData.death_location === "hospital") {
      deathData.hospital_name = document.getElementById("hospital").value;
    }

    // معالجة الملف المرفق إذا وجد
    const fileInput = document.getElementById("reportUpload");
    if (fileInput.files && fileInput.files[0]) {
      if (!validateFileUpload(fileInput.files[0])) {
        throw new Error("الملف المرفق غير صالح");
      }
      
      const formData = new FormData();
      formData.append("report", fileInput.files[0]);
      formData.append("pilgrim_id", currentPilgrim.pilgrim_id);
      if (deathData._csrf) {
        formData.append("_csrf", deathData._csrf);
      }
      
      // استدعاء API لرفع الملف
      const uploadResponse = await ApiService.uploadDeathReport(formData);
      if (uploadResponse && uploadResponse.file_path) {
        deathData.report_file = uploadResponse.file_path;
      }
    }

    // إرسال البيانات إلى الخادم
    const response = await ApiService.registerDeath(deathData);

    // إغلاق نافذة التأكيد
    const confirmModal = bootstrap.Modal.getInstance(document.getElementById("confirmModal"));
    confirmModal.hide();

    // حذف المسودة المحفوظة بعد الحفظ الناجح
    if (currentPilgrim) {
      localStorage.removeItem('deathFormDraft_' + currentPilgrim.pilgrim_id);
    }

    // عرض رسالة النجاح
    showEnhancedAlert("تم تسجيل بيانات الوفاة بنجاح", "success");

    // تفعيل زر الطباعة
    document.getElementById("printBtn").disabled = false;

    // حفظ معرف سجل الوفاة للطباعة
    if (response && response.death_record_id) {
      currentPilgrim.death_record_id = response.death_record_id;
    }

    // إعادة تعيين النموذج بعد فترة قصيرة
    setTimeout(() => {
      resetForm();
    }, 2000);
  } catch (error) {
    console.error("خطأ في حفظ بيانات الوفاة:", error);
    showEnhancedAlert(
      "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى", 
      "error"
    );
  } finally {
    isSubmitting = false;
    
    // إعادة تفعيل زر التأكيد
    const confirmButton = document.getElementById("confirmSave");
    confirmButton.innerHTML = `تأكيد تسجيل الوفاة`;
    confirmButton.disabled = false;
  }
}

/**
 * طباعة شهادة الوفاة
 */
function printDeathCertificate() {
  if (!currentPilgrim) return;
  
  // يمكن هنا أن نقوم بتوجيه المستخدم إلى صفحة طباعة خاصة
  // أو يمكن إنشاء نموذج الطباعة ديناميكيًا
  
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>شهادة وفاة - ${currentPilgrim.name}</title>
      <style>
        @media print {
          body {
            font-family: 'Tajawal', Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3c4b64;
            padding-bottom: 10px;
          }
          .print-header h1 {
            color: #3c4b64;
            margin-bottom: 5px;
          }
          .certificate {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 20px auto;
            max-width: 800px;
          }
          .certificate-title {
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
            color: #3c4b64;
          }
          .pilgrim-details {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }
          .detail-item {
            width: 50%;
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            color: #495057;
          }
          .death-details {
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            width: 200px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 12px;
            color: #6c757d;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="print-header">
          <h1>وزارة الحج والعمرة</h1>
          <p>المملكة العربية السعودية</p>
        </div>
        
        <div class="certificate">
          <h2 class="certificate-title">شهادة وفاة حاج</h2>
          
          <div class="pilgrim-details">
            <div class="detail-item">
              <span class="detail-label">اسم المتوفى:</span>
              <span>${currentPilgrim.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الجنسية:</span>
              <span>${currentPilgrim.nationality}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">رقم الجواز:</span>
              <span>${currentPilgrim.passport_number}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">رقم الحاج:</span>
              <span>${currentPilgrim.pilgrim_id}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الحملة:</span>
              <span>${currentPilgrim.campaign_name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الجنس:</span>
              <span>${currentPilgrim.gender === "M" ? "ذكر" : "أنثى"}</span>
            </div>
          </div>
          
          <div class="death-details">
            <div class="detail-item">
              <span class="detail-label">تاريخ الوفاة:</span>
              <span>${document.getElementById("deathDate").value} (${document.getElementById("hijriDeathDate").textContent})</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">وقت الوفاة:</span>
              <span>${document.getElementById("deathTime").value}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">سبب الوفاة:</span>
              <span>${getDeathCauseText()}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">مكان الوفاة:</span>
              <span>${getDeathLocationText()}</span>
            </div>
            ${document.getElementById("deathNotes").value ? `
            <div class="detail-item" style="width: 100%">
              <span class="detail-label">ملاحظات:</span>
              <span>${document.getElementById("deathNotes").value}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="signature-section">
            <div class="signature">
              <div class="signature-line"></div>
              <p>توقيع المسؤول المختص</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p>ختم الجهة</p>
            </div>
          </div>
          
          <div class="footer">
            <p>رقم السجل: ${currentPilgrim.death_record_id || '--'}</p>
            <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          // إغلاق النافذة بعد الطباعة (اختياري)
          // window.setTimeout(function() { window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

/**
 * الحصول على النص المعروض لسبب الوفاة
 */
function getDeathCauseText() {
  const causeValue = document.getElementById("deathCause").value;
  const causeMap = {
    "natural": "وفاة طبيعية",
    "heart_attack": "نوبة قلبية",
    "respiratory_failure": "فشل تنفسي",
    "accident": "حادث",
    "heat_stroke": "ضربة حرارة",
    "other": document.getElementById("otherCause").value
  };
  
  return causeMap[causeValue] || causeValue;
}

/**
 * الحصول على النص المعروض لمكان الوفاة
 */
function getDeathLocationText() {
  const locationValue = document.getElementById("deathLocation").value;
  let locationText = "";
  
  switch (locationValue) {
    case "hospital":
      locationText = `مستشفى ${document.getElementById("hospital").value}`;
      break;
    case "hotel":
      locationText = "سكن/ فندق";
      break;
    case "haram":
      locationText = "الحرم";
      break;
    case "mina":
      locationText = "منى";
      break;
    case "arafat":
      locationText = "عرفات";
      break;
    case "muzdalifah":
      locationText = "مزدلفة";
      break;
    case "other":
      locationText = "مكان آخر";
      break;
    default:
      locationText = locationValue;
  }
  
  return locationText;
}

/**
 * إعادة تعيين النموذج
 */
function resetForm() {
  // إعادة تعيين البحث
  document.getElementById("pilgrimSearch").value = "";
  resetPilgrimInfo();
  
  // إعادة تعيين نموذج الوفاة
  document.getElementById("deathForm").reset();

  // إعادة تعيين الحقول الديناميكية
  document.getElementById("otherCauseDiv").classList.add("d-none");
  document.getElementById("hospitalDiv").classList.add("d-none");
  document.getElementById("filePreviewContainer").classList.add("d-none");

  // إعادة تعيين التاريخ والوقت الحالي
  initDateAndTime();

  // إعادة تعيين المتغيرات
  currentPilgrim = null;
  isFormValid = false;
  lastDraftSave = null;
  
  // تحديث حالة الحفظ التلقائي
  document.getElementById("autoSaveStatus").textContent = "";
}

/**
 * عرض رسالة تنبيه متقدمة باستخدام SweetAlert2
 * @param {string} message نص الرسالة
 * @param {string} type نوع التنبيه (success, error, warning, info)
 */
function showEnhancedAlert(message, type = "info") {
  const iconMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  const confirmButtonColorMap = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  Swal.fire({
    title: type === 'success' ? 'تم بنجاح' : 
           type === 'error' ? 'خطأ' :
           type === 'warning' ? 'تنبيه' : 'معلومات',
    text: message,
    icon: iconMap[type] || 'info',
    confirmButtonText: 'حسناً',
    confirmButtonColor: confirmButtonColorMap[type] || '#3c4b64',
    timer: type === 'success' ? 3000 : type === 'info' ? 5000 : undefined,
    timerProgressBar: type === 'success' || type === 'info',
    position: 'top',
    toast: type === 'info',
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  });
}

// تصدير الدوال للاستخدام في ملفات أخرى
export {
  handleSearch,
  resetForm,
  validateForm,
  printDeathCertificate
};

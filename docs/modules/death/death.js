/**
 * وحدة تسجيل وفاة الحجاج
 * 
 * هذا الملف يتعامل مع وظائف تسجيل حالات الوفاة للحجاج، 
 * بما في ذلك البحث عن الحاج، إدخال بيانات الوفاة وحفظها
 */

// استيراد الخدمات والأدوات اللازمة
// (يفترض وجود هذه الخدمات في مجلد core)
const ApiService = window.ApiService || {};
const AuthService = window.AuthService || {};
const PilgrimService = window.PilgrimService || {};
const DateUtils = window.DateUtils || {
  convertToHijri: (date) => date,
  formatDate: (date) => date
};
const ValidationUtils = window.ValidationUtils || {
  validateRequired: (value) => !!value,
  sanitizeInput: (value) => value
};

// تهيئة متغيرات الوحدة
let currentPilgrim = null;
let isFormValid = false;
let isSubmitting = false;

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
  const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
  const confirmSave = document.getElementById("confirmSave");

  // تهيئة التاريخ والوقت الحالي
  initDateAndTime();

  // إضافة الأحداث للعناصر
  searchBtn.addEventListener("click", handleSearch);
  pilgrimSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  });

  deathForm.addEventListener("submit", handleSubmit);
  resetBtn.addEventListener("click", resetForm);
  confirmSave.addEventListener("click", saveDeathRecord);

  // أحداث للحقول الديناميكية
  deathCause.addEventListener("change", () => {
    if (deathCause.value === "other") {
      otherCauseDiv.classList.remove("d-none");
      document.getElementById("otherCause").setAttribute("required", "required");
    } else {
      otherCauseDiv.classList.add("d-none");
      document.getElementById("otherCause").removeAttribute("required");
    }
  });

  deathLocation.addEventListener("change", () => {
    if (deathLocation.value === "hospital") {
      hospitalDiv.classList.remove("d-none");
      document.getElementById("hospital").setAttribute("required", "required");
    } else {
      hospitalDiv.classList.add("d-none");
      document.getElementById("hospital").removeAttribute("required");
    }
  });

  // إضافة مستمعي الأحداث لجميع حقول النموذج للتحقق
  const formInputs = deathForm.querySelectorAll("input, select, textarea");
  formInputs.forEach(input => {
    input.addEventListener("change", validateForm);
    input.addEventListener("input", validateForm);
  });

  // التحويل من تاريخ ميلادي إلى هجري
  document.getElementById("deathDate").addEventListener("change", (e) => {
    const gregorianDate = e.target.value;
    if (gregorianDate) {
      const hijriDate = DateUtils.convertToHijri(gregorianDate);
      document.getElementById("hijriDeathDate").textContent = hijriDate || "";
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
 * البحث عن بيانات الحاج
 */
async function handleSearch() {
  const searchInput = document.getElementById("pilgrimSearch");
  const searchValue = ValidationUtils.sanitizeInput(searchInput.value.trim());
  
  if (!searchValue) {
    showAlert("يرجى إدخال رقم الحاج أو رقم الجواز للبحث", "warning");
    return;
  }
  
  try {
       // عرض مؤشر التحميل
    searchInput.disabled = true;
    document.getElementById("searchBtn").innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري البحث...`;
    
    // استدعاء خدمة البحث عن الحاج
    const pilgrim = await PilgrimService.findPilgrim(searchValue);
    
    if (pilgrim) {
      displayPilgrimInfo(pilgrim);
      validateForm();
    } else {
      showAlert("لم يتم العثور على بيانات الحاج، يرجى التأكد من الرقم المدخل", "danger");
      resetPilgrimInfo();
    }
  } catch (error) {
    console.error("خطأ في البحث:", error);
    showAlert("حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى", "danger");
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
  
  // تفعيل زر الحفظ
  document.getElementById("saveBtn").disabled = false;
  
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
}

/**
 * التحقق من صحة النموذج
 */
function validateForm() {
  const requiredFields = [
    "deathDate", 
    "deathTime", 
    "deathCause"
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
  
  return valid;
}

/**
 * معالجة تقديم النموذج
 */
function handleSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showAlert("يرجى تعبئة جميع الحقول المطلوبة", "warning");
    return;
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
      recorded_by: AuthService.getCurrentUser()?.id || null
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
      const formData = new FormData();
      formData.append("report", fileInput.files[0]);
      
      // استدعاء API لرفع الملف (يفترض وجود هذه الخدمة)
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
    
    // عرض رسالة النجاح
    showAlert("تم تسجيل بيانات الوفاة بنجاح", "success");
    
    // إعادة تعيين النموذج بعد فترة قصيرة
    setTimeout(() => {
      resetForm();
    }, 1500);
    
  } catch (error) {
    console.error("خطأ في حفظ بيانات الوفاة:", error);
    showAlert("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى", "danger");
    
    // إعادة تفعيل زر التأكيد
    const confirmButton = document.getElementById("confirmSave");
    confirmButton.innerHTML = originalButtonText;
    confirmButton.disabled = false;
  } finally {
    isSubmitting = false;
  }
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
  
  // إعادة تعيين التاريخ والوقت الحالي
  initDateAndTime();
  
  // إعادة تعيين المتغيرات
  currentPilgrim = null;
  isFormValid = false;
  
  // إخفاء أي تنبيهات
  const alertElement = document.querySelector(".alert:not(#searchPrompt)");
  if (alertElement) {
    alertElement.remove();
  }
}

/**
 * عرض رسالة تنبيه
 * @param {string} message نص الرسالة
 * @param {string} type نوع التنبيه (success, danger, warning, info)
 */
function showAlert(message, type = "info") {
  // إزالة التنبيهات السابقة
  const existingAlert = document.querySelector(".alert:not(#searchPrompt)");
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // إنشاء تنبيه جديد
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.role = "alert";
  
  // إضافة رمز مناسب حسب نوع التنبيه
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle me-2"></i>';
      break;
    case "danger":
      icon = '<i class="fas fa-exclamation-circle me-2"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle me-2"></i>';
  }
  
  alertDiv.innerHTML = `
    ${icon}${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
  `;
  
  // إضافة التنبيه إلى الصفحة
  document.querySelector(".container").insertBefore(alertDiv, document.querySelector(".page-header").nextSibling);
  
  // إخفاء التنبيه تلقائيًا بعد 5 ثوانٍ (إلا إذا كان خطأ)
  if (type !== "danger") {
    setTimeout(() => {
      const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
      alert.close();
    }, 5000);
  }
}

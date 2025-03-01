document.addEventListener("DOMContentLoaded", () => {
  // تعريف المتغيرات
  const treatmentForm = document.getElementById("treatmentForm");
  const resetFormBtn = document.getElementById("resetForm");
  const referralYes = document.getElementById("referralYes");
  const referralNo = document.getElementById("referralNo");
  const referralDetails = document.getElementById("referralDetails");
  const addMedicineBtn = document.getElementById("addMedicine");
  const prescriptionList = document.getElementById("prescriptionList");
  
  // ضبط التاريخ الافتراضي ليكون اليوم
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("treatmentDate").value = today;
  document.getElementById("referralDate").value = today;
  
  // إظهار/إخفاء قسم التحويل الخارجي
  function toggleReferralSection() {
    if (referralYes.checked) {
      referralDetails.style.display = "block";
      
      // جعل الحقول مطلوبة عند اختيار التحويل
      document.getElementById("hospitalName").required = true;
      document.getElementById("referralDate").required = true;
      document.getElementById("referralTime").required = true;
      document.getElementById("patientStatus").required = true;
    } else {
      referralDetails.style.display = "none";
      
      // إلغاء الحقول المطلوبة عند عدم اختيار التحويل
      document.getElementById("hospitalName").required = false;
      document.getElementById("referralDate").required = false;
      document.getElementById("referralTime").required = false;
      document.getElementById("patientStatus").required = false;
    }
  }
  
  // استدعاء الدالة عند التحميل
  toggleReferralSection();
  
  // مراقبة تغيير اختيار التحويل
  referralYes.addEventListener("change", toggleReferralSection);
  referralNo.addEventListener("change", toggleReferralSection);
  
  // إضافة دواء جديد إلى الوصفة الطبية
  addMedicineBtn.addEventListener("click", () => {
    const medicineInput = document.querySelector(".prescription-item");
    
    if (medicineInput.value.trim() !== "") {
      // إنشاء عنصر جديد في قائمة الأدوية
      const medicineItem = document.createElement("div");
      medicineItem.className = "prescription-item d-flex justify-content-between align-items-center mb-2 p-2";
      medicineItem.innerHTML = `
        <div>
          <i class="fas fa-prescription-bottle-alt me-2"></i>
          <span>${medicineInput.value}</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger btn-remove">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // إضافة عنصر الدواء للقائمة
      prescriptionList.appendChild(medicineItem);
      
      // تفريغ حقل الإدخال للدواء التالي
      medicineInput.value = "";
      medicineInput.focus();
      
      // إضافة مستمع حدث لزر الحذف
      medicineItem.querySelector(".btn-remove").addEventListener("click", () => {
        prescriptionList.removeChild(medicineItem);
      });
    }
  });
  
  // السماح بإضافة دواء جديد عند الضغط على Enter
  document.querySelector(".prescription-item").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMedicineBtn.click();
    }
  });
  
  // إعادة تعيين النموذج
  resetFormBtn.addEventListener("click", () => {
    // إعادة تعيين كل الحقول
    treatmentForm.reset();
    
    // إعادة تعيين قائمة الأدوية
    prescriptionList.innerHTML = "";
    
    // إعادة ضبط التواريخ
    document.getElementById("treatmentDate").value = today;
    document.getElementById("referralDate").value = today;
    
    // إخفاء قسم التحويل الخارجي
    referralNo.checked = true;
    toggleReferralSection();
    
    // التركيز على حقل اسم الطبيب
    document.getElementById("doctorName").focus();
  });
  
  // معالجة إرسال النموذج
  treatmentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // التحقق من صحة النموذج
    if (!validateForm()) {
      showAlert("يرجى ملء جميع الحقول المطلوبة", "danger");
      return;
    }
    
    // جمع بيانات الأدوية من الوصفة الطبية
    const medicines = [];
    document.querySelectorAll("#prescriptionList .prescription-item span").forEach(item => {
      medicines.push(item.textContent);
    });
    
    // جمع بيانات النموذج
    const formData = {
      // البيانات الأساسية
      doctorName: document.getElementById("doctorName").value,
      hotel: document.getElementById("hotel").value,
      treatmentDate: document.getElementById("treatmentDate").value,
      treatmentTime: document.getElementById("treatmentTime").value,
      
      // بيانات المريض
      governorate: document.getElementById("governorate").value,
      maritalStatus: document.getElementById("maritalStatus").value,
      medicalCondition: document.getElementById("medicalCondition").value,
      
      // التشخيص والعلاج
      diagnosis: document.getElementById("diagnosis").value,
      prescription: medicines,
      dispensed: document.querySelector('input[name="dispensed"]:checked')?.value || "لا",
      
      // التحويل الخارجي
      externalReferral: document.querySelector('input[name="externalReferral"]:checked').value
    };
    
    // إضافة بيانات التحويل إذا كان الاختيار "نعم"
    if (formData.externalReferral === "نعم") {
      formData.referralDetails = {
        hospitalName: document.getElementById("hospitalName").value,
        referralDate: document.getElementById("referralDate").value,
        referralTime: document.getElementById("referralTime").value,
        patientStatus: document.getElementById("patientStatus").value
      };
    }
    
    // في بيئة الإنتاج، سيتم إرسال البيانات للخادم
    console.log("بيانات العلاج:", formData);
    
    // عرض بيانات النموذج في وحدة التحكم للتحقق منها
    saveFormData(formData);
  });
  
  // دالة لحفظ البيانات (محاكاة)
  function saveFormData(data) {
    // هنا يمكن إضافة الكود الخاص بإرسال البيانات إلى الخادم
    // على سبيل المثال: استخدام fetch API
    
    // محاكاة للاتصال بالخادم
    setTimeout(() => {
      showAlert("تم حفظ بيانات العلاج بنجاح!", "success");
      
      // إعادة تعيين النموذج بعد الحفظ
      setTimeout(() => {
        resetFormBtn.click();
      }, 2000);
    }, 1000);
  }
  
  // دالة لإظهار التنبيهات
  function showAlert(message, type = "info") {
    // إنشاء عنصر التنبيه
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
    `;
    
    // إضافة التنبيه قبل النموذج
    treatmentForm.parentNode.insertBefore(alertDiv, treatmentForm);
    
    // إزالة التنبيه بعد 3 ثوانٍ
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }
  
  // إضافة التحقق من صحة إدخالات النموذج
  function validateForm() {
    // التحقق من الحقول المطلوبة
    const requiredFields = treatmentForm.querySelectorAll("[required]");
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add("is-invalid");
        isValid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    });
    
    // التحقق من صرف العلاج
    if (!document.querySelector('input[name="dispensed"]:checked')) {
      showAlert("يرجى تحديد ما إذا تم صرف العلاج أم لا", "warning");
      isValid = false;
    }
    
    // التحقق من وجود دواء واحد على الأقل في الوصفة إذا تم اختيار صرف العلاج "نعم"
    if (document.getElementById("dispensedYes").checked && prescriptionList.children.length === 0) {
      showAlert("يرجى إضافة دواء واحد على الأقل للوصفة الطبية", "warning");
      isValid = false;
    }
    
    return isValid;
  }
  
  // إضافة مستمعي الأحداث للحقول لإزالة التنبيهات عند الإدخال
  document.querySelectorAll(".form-control, .form-select").forEach(field => {
    field.addEventListener("input", () => {
      if (field.value.trim()) {
        field.classList.remove("is-invalid");
      }
    });
  });
  
  // إضافة خاصية تلميحات التوجيه لتحسين تجربة المستخدم (إذا كان Bootstrap يدعمها)
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});

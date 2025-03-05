document.addEventListener("DOMContentLoaded", () => {
  // تعريف المتغيرات
  const treatmentForm = document.getElementById("treatmentForm");
  const resetFormBtn = document.getElementById("resetForm");
  const referralYes = document.getElementById("referralYes");
  const referralNo = document.getElementById("referralNo");
  const referralDetails = document.getElementById("referralDetails");
  const followupYes = document.getElementById("followupYes");
  const followupNo = document.getElementById("followupNo");
  const followupDetails = document.getElementById("followupDetails");
  const addMedicineBtn = document.getElementById("addMedicine");
  const prescriptionList = document.getElementById("prescriptionList");
  const printButton = document.getElementById("printButton");
  const browseButton = document.getElementById("browseButton");
  const fileInput = document.getElementById("fileInput");
  const attachmentsPreview = document.getElementById("attachmentsPreview");
  
  // ضبط التاريخ الافتراضي ليكون اليوم
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("treatmentDate").value = today;
  document.getElementById("referralDate").value = today;
  
  // إضافة تاريخ افتراضي للمتابعة (بعد 3 أيام)
  const followupDefaultDate = new Date();
  followupDefaultDate.setDate(followupDefaultDate.getDate() + 3);
  document.getElementById("followupDate").value = followupDefaultDate.toISOString().split("T")[0];
  
  // إظهار/إخفاء قسم التحويل الخارجي
  function toggleReferralSection() {
    if (referralYes.checked) {
      referralDetails.style.display = "block";
      
      // جعل الحقول مطلوبة عند اختيار التحويل
      document.getElementById("hospitalName").required = true;
      document.getElementById("referralDate").required = true;
      document.getElementById("referralTime").required = true;
      document.getElementById("patientStatus").required = true;
      document.getElementById("referralReason").required = true;
    } else {
      referralDetails.style.display = "none";
      
      // إلغاء الحقول المطلوبة عند عدم اختيار التحويل
      document.getElementById("hospitalName").required = false;
      document.getElementById("referralDate").required = false;
      document.getElementById("referralTime").required = false;
      document.getElementById("patientStatus").required = false;
      document.getElementById("referralReason").required = false;
    }
  }
  
  // إظهار/إخفاء قسم المتابعة
  function toggleFollowupSection() {
    if (followupYes.checked) {
      followupDetails.style.display = "block";
      
      // جعل الحقول مطلوبة عند اختيار المتابعة
      document.getElementById("followupDate").required = true;
      document.getElementById("followupTime").required = true;
      document.getElementById("followupType").required = true;
    } else {
      followupDetails.style.display = "none";
      
      // إلغاء الحقول المطلوبة عند عدم اختيار المتابعة
      document.getElementById("followupDate").required = false;
      document.getElementById("followupTime").required = false;
      document.getElementById("followupType").required = false;
    }
  }
  
  // استدعاء الدالات عند التحميل
  toggleReferralSection();
  toggleFollowupSection();
  
  // مراقبة تغيير اختيار التحويل
  referralYes.addEventListener("change", toggleReferralSection);
  referralNo.addEventListener("change", toggleReferralSection);
  
  // مراقبة تغيير اختيار المتابعة
  followupYes.addEventListener("change", toggleFollowupSection);
  followupNo.addEventListener("change", toggleFollowupSection);
  
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
  
  // معالج رفع الملفات
  browseButton.addEventListener("click", () => {
    fileInput.click();
  });
  
  // معالج تغيير اختيار الملفات
  fileInput.addEventListener("change", handleFileUpload);
  
  // منطقة السحب والإفلات
  const dropzone = document.getElementById("attachmentDropzone");
  
  // إضافة مستمعي الأحداث للسحب والإفلات
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });
  
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  });
  
  // معالجة رفع الملفات
  function handleFileUpload(e) {
    const files = e.target.files;
    
    if (!files.length) return;
    
    // مسح العرض الحالي
    attachmentsPreview.innerHTML = "";
    
    // إنشاء معاينة لكل ملف
    Array.from(files).forEach(file => {
      const fileCard = document.createElement("div");
      fileCard.className = "col-6 col-md-4 col-lg-3";
      
      let previewHTML = "";
      const isImage = file.type.startsWith("image/");
      
      if (isImage) {
        // إنشاء معاينة مصغرة للصور
        const imageUrl = URL.createObjectURL(file);
        previewHTML = `<img src="${imageUrl}" class="img-thumbnail mb-2 w-100" style="height: 120px; object-fit: cover;">`;
      } else {
        // أيقونة للملفات الأخرى
        let fileIcon = "fa-file";
        if (file.type.includes("pdf")) fileIcon = "fa-file-pdf";
        else if (file.type.includes("word")) fileIcon = "fa-file-word";
        else if (file.type.includes("excel") || file.type.includes("sheet")) fileIcon = "fa-file-excel";
        
        previewHTML = `<div class="text-center p-4 mb-2 border rounded">
                         <i class="fas ${fileIcon} fa-3x text-secondary"></i>
                       </div>`;
      }
      
      fileCard.innerHTML = `
        <div class="attachment-preview">
          ${previewHTML}
          <div class="d-flex justify-content-between align-items-center">
            <div class="text-truncate" title="${file.name}">${file.name}</div>
            <button type="button" class="btn btn-sm btn-outline-danger file-remove">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="small text-muted">${formatFileSize(file.size)}</div>
        </div>
      `;
      
      // إضافة حدث لإزالة الملف
      fileCard.querySelector(".file-remove").addEventListener("click", () => {
        attachmentsPreview.removeChild(fileCard);
        
        // إذا تمت إزالة جميع الملفات، إعادة تعيين حقل الإدخال
        if (attachmentsPreview.children.length === 0) {
          fileInput.value = "";
        }
      });
      
      attachmentsPreview.appendChild(fileCard);
    });
  }
  
  // تنسيق حجم الملف
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  
  // طباعة التقرير
  printButton.addEventListener("click", () => {
    preparePrintData();
    window.print();
  });
  
  // إعداد بيانات الطباعة
  function preparePrintData() {
    // ضبط تاريخ الطباعة
    document.getElementById("printDate").textContent = new Date().toLocaleString("ar");
    
    // نسخ البيانات الأساسية
    document.getElementById("print-doctorName").textContent = document.getElementById("doctorName").value || "-";
    document.getElementById("print-hotel").textContent = document.getElementById("hotel").value || "-";
    document.getElementById("print-serviceOffice").textContent = document.getElementById("serviceOffice").value || "-";
    document.getElementById("print-date").textContent = document.getElementById("treatmentDate").value || "-";
    document.getElementById("print-time").textContent = document.getElementById("treatmentTime").value || "-";
    document.getElementById("print-condition").textContent = document.getElementById("medicalCondition").value || "-";
    
    // المؤشرات الحيوية
    document.getElementById("print-temperature").textContent = document.getElementById("temperature").value ? `${document.getElementById("temperature").value} °C` : "-";
    document.getElementById("print-bloodPressure").textContent = document.getElementById("bloodPressure").value || "-";
    document.getElementById("print-pulseRate").textContent = document.getElementById("pulseRate").value ? `${document.getElementById("pulseRate").value} bpm` : "-";
    document.getElementById("print-respiratoryRate").textContent = document.getElementById("respiratoryRate").value ? `${document.getElementById("respiratoryRate").value} bpm` : "-";
    
    // التشخيص
    document.getElementById("print-diagnosis").textContent = document.getElementById("diagnosis").value || "-";
    
    // الوصفة الطبية
    const prescriptionPrint = document.getElementById("print-prescription");
    prescriptionPrint.innerHTML = "";
    
    const medicines = document.querySelectorAll("#prescriptionList .prescription-item span");
    if (medicines.length > 0) {
      medicines.forEach(medicine => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = medicine.textContent;
        prescriptionPrint.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = "لا يوجد أدوية";
      prescriptionPrint.appendChild(li);
    }
    
    // معلومات التحويل
    const printReferralSection = document.getElementById("print-referral-section");
    if (referralYes.checked) {
      printReferralSection.style.display = "block";
      document.getElementById("print-hospitalName").textContent = document.getElementById("hospitalName").value || "-";
      document.getElementById("print-patientStatus").textContent = document.getElementById("patientStatus").value || "-";
      document.getElementById("print-referralDate").textContent = document.getElementById("referralDate").value || "-";
      document.getElementById("print-referralTime").textContent = document.getElementById("referralTime").value || "-";
      document.getElementById("print-referralReason").textContent = document.getElementById("referralReason").value || "-";
    } else {
      printReferralSection.style.display = "none";
    }
    
    // معلومات المتابعة
    const printFollowupSection = document.getElementById("print-followup-section");
    if (followupYes.checked) {
      printFollowupSection.style.display = "block";
      document.getElementById("print-followupDate").textContent = document.getElementById("followupDate").value || "-";
      document.getElementById("print-followupTime").textContent = document.getElementById("followupTime").value || "-";
      document.getElementById("print-followupType").textContent = document.getElementById("followupType").value || "-";
      document.getElementById("print-followupNotes").textContent = document.getElementById("followupNotes").value || "-";
    } else {
      printFollowupSection.style.display = "none";
    }
  }
  
  // إعادة تعيين النموذج
  resetFormBtn.addEventListener("click", () => {
    // إعادة تعيين كل الحقول
    treatmentForm.reset();
    
    // إعادة تعيين قائمة الأدوية
    prescriptionList.innerHTML = "";
    
    // إعادة تعيين المرفقات
    attachmentsPreview.innerHTML = "";
    fileInput.value = "";
    
    // إعادة ضبط التواريخ
    document.getElementById("treatmentDate").value = today;
    document.getElementById("referralDate").value = today;
    document.getElementById("followupDate").value = followupDefaultDate.toISOString().split("T")[0];
    
    // إخفاء قسم التحويل الخارجي
    referralNo.checked = true;
    toggleReferralSection();
    
    // إخفاء قسم المتابعة
    followupNo.checked = true;
    toggleFollowupSection();
    
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
    
    // جمع معلومات المرفقات
    const attachments = [];
    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach(file => {
        attachments.push({
          name: file.name,
          type: file.type,
          size: file.size
        });
      });
    }
    
    // جمع بيانات النموذج
    const formData = {
      // البيانات الأساسية
      doctorName: document.getElementById("doctorName").value,
      serviceOffice: document.getElementById("serviceOffice").value,
      hotel: document.getElementById("hotel").value,
      treatmentDate: document.getElementById("treatmentDate").value,
      treatmentTime: document.getElementById("treatmentTime").value,
      
      // بيانات المريض
      governorate: document.getElementById("governorate").value,
      maritalStatus: document.getElementById("maritalStatus").value,
      medicalCondition: document.getElementById("medicalCondition").value,
      
      // المؤشرات الحيوية
      vitalSigns: {
        temperature: document.getElementById("temperature").value,
        bloodPressure: document.getElementById("bloodPressure").value,
        pulseRate: document.getElementById("pulseRate").value,
        respiratoryRate: document.getElementById("respiratoryRate").value,
        oxygenSaturation: document.getElementById("oxygenSaturation").value,
        bloodGlucose: document.getElementById("bloodGlucose").value,
        painLevel: document.getElementById("painLevel").value
      },
      
      // التشخيص والعلاج
      diagnosis: document.getElementById("diagnosis").value,
      prescription: medicines,
      dispensed: document.querySelector('input[name="dispensed"]:checked')?.value || "لا",
      
      // التحويل الخارجي
      externalReferral: document.querySelector('input[name="externalReferral"]:checked').value,
      
      // المرفقات
      attachments: attachments,
      
      // المتابعة
      needsFollowup: document.querySelector('input[name="needsFollowup"]:checked').value
    };
    
    // إضافة بيانات التحويل إذا كان الاختيار "نعم"
    if (formData.externalReferral === "نعم") {
      formData.referralDetails = {
        hospitalName: document.getElementById("hospitalName").value,
        referralDate: document.getElementById("referralDate").value,
        referralTime: document.getElementById("referralTime").value,
        patientStatus: document.getElementById("patientStatus").value,
        referralReason: document.getElementById("referralReason").value
      };
    }
    
    // إضافة بيانات المتابعة إذا كان الاختيار "نعم"
    if (formData.needsFollowup === "نعم") {
      formData.followupDetails = {
        followupDate: document.getElementById("followupDate").value,
        followupTime: document.getElementById("followupTime").value,
        followupType: document.getElementById("followupType").value,
        followupNotes: document.getElementById("followupNotes").value
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
  
  // تكيف حقل مستوى الألم مع التغييرات
  const painLevel = document.getElementById("painLevel");
  const painLevelValue = document.createElement("span");
  painLevelValue.className = "badge bg-primary ms-2";
  painLevelValue.textContent = painLevel.value;
  painLevel.parentNode.appendChild(painLevelValue);
  
  painLevel.addEventListener("input", () => {
    painLevelValue.textContent = painLevel.value;
    
    // تغيير لون المؤشر بناءً على مستوى الألم
    painLevelValue.className = "badge ms-2 ";
    if (painLevel.value <= 3) {
      painLevelValue.className += "bg-success";
    } else if (painLevel.value <= 7) {
      painLevelValue.className += "bg-warning text-dark";
    } else {
      painLevelValue.className += "bg-danger";
    }
  });
  
  // إضافة خاصية تلميحات التوجيه لتحسين تجربة المستخدم (إذا كان Bootstrap يدعمها)
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
  // إضافة دعم للأجهزة المحمولة - تفعيل السحب والإفلات بمكتبة الجوّال
  if ('ontouchstart' in window) {
    document.querySelector('.container').classList.add('mobile-optimized');
  }
});

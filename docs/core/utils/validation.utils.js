// utils/validation.utils.js
/**
 * مجموعة دوال للتحقق من صحة المدخلات
 */

/**
 * التحقق من صحة رقم جواز السفر
 * @param {string} passport - رقم جواز السفر
 * @returns {boolean} صحة الرقم
 */
export function isValidPassport(passport) {
  if (!passport || typeof passport !== 'string') return false;
  
  // نمط أساسي للتحقق من جواز السفر: حروف وأرقام، من 6 إلى 15 حرفًا
  return /^[A-Z0-9]{6,15}$/i.test(passport.trim());
}

/**
 * التحقق من صحة الهوية الوطنية (رقم 10 أعداد)
 * @param {string} id - رقم الهوية
 * @returns {boolean} صحة الرقم
 */
export function isValidNationalID(id) {
  if (!id || typeof id !== 'string') return false;
  
  // رقم 10 أعداد للهوية الوطنية السعودية
  return /^[0-9]{10}$/.test(id.trim());
}

/**
 * التحقق من صحة رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @param {string} [countryCode='966'] - رمز الدولة الافتراضي
 * @returns {boolean} صحة الرقم
 */
export function isValidPhone(phone, countryCode = '966') {
  if (!phone || typeof phone !== 'string') return false;
  
  // إزالة الرموز غير الرقمية
  const cleanPhone = phone.replace(/\D/g, '');
  
  // التحقق من الطول والبداية
  if (cleanPhone.startsWith(countryCode)) {
    return cleanPhone.length === (countryCode.length + 9);
  } else if (cleanPhone.startsWith('0')) {
    return cleanPhone.length === 10;
  } else {
    return cleanPhone.length === 9;
  }
}

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحة البريد
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // نمط التحقق من البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// utils/validation.utils.js (تكملة)

/**
 * التحقق من صحة التاريخ وأنه ضمن نطاق معقول
 * @param {string|Date} date - التاريخ المراد التحقق منه
 * @param {Object} options - خيارات التحقق
 * @param {Date|string} [options.minDate] - أقدم تاريخ مسموح به
 * @param {Date|string} [options.maxDate] - أحدث تاريخ مسموح به
 * @returns {boolean} صحة التاريخ
 */
export function isValidDate(date, options = {}) {
  try {
    if (!date) return false;
    
    const dateObj = new Date(date);
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) return false;
    
    // التحقق من النطاق إذا تم تحديده
    if (options.minDate) {
      const minDate = new Date(options.minDate);
      if (dateObj < minDate) return false;
    }
    
    if (options.maxDate) {
      const maxDate = new Date(options.maxDate);
      if (dateObj > maxDate) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * التحقق من إدخال نص غير فارغ
 * @param {string} text - النص المراد التحقق منه
 * @param {Object} options - خيارات التحقق
 * @param {number} [options.minLength=1] - الحد الأدنى للطول
 * @param {number} [options.maxLength] - الحد الأقصى للطول
 * @returns {boolean} صحة النص
 */
export function isValidText(text, options = {}) {
  if (text === undefined || text === null) return false;
  
  const { minLength = 1, maxLength } = options;
  const strText = String(text).trim();
  
  if (strText.length < minLength) return false;
  if (maxLength && strText.length > maxLength) return false;
  
  return true;
}

/**
 * التحقق من صحة رقم (عددي)
 * @param {number|string} value - القيمة المراد التحقق منها
 * @param {Object} options - خيارات التحقق
 * @param {number} [options.min] - الحد الأدنى للقيمة
 * @param {number} [options.max] - الحد الأقصى للقيمة
 * @returns {boolean} صحة الرقم
 */
export function isValidNumber(value, options = {}) {
  if (value === undefined || value === null || value === '') return false;
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) return false;
  
  const { min, max } = options;
  
  if (min !== undefined && numValue < min) return false;
  if (max !== undefined && numValue > max) return false;
  
  return true;
}

/**
 * التحقق من صحة رقم الغرفة
 * @param {string|number} roomNumber - رقم الغرفة
 * @returns {boolean} صحة رقم الغرفة
 */
export function isValidRoomNumber(roomNumber) {
  if (!roomNumber) return false;
  
  // رقم الغرفة عادة ما يتكون من أرقام وقد يتضمن حروفًا
  return /^[A-Za-z0-9-]{1,10}$/.test(String(roomNumber).trim());
}

/**
 * التحقق من صحة الجنسية
 * @param {string} nationality - الجنسية
 * @param {Array} validNationalities - قائمة الجنسيات الصالحة (اختياري)
 * @returns {boolean} صحة الجنسية
 */
export function isValidNationality(nationality, validNationalities = []) {
  if (!nationality || typeof nationality !== 'string') return false;
  
  const cleanNationality = nationality.trim();
  
  // إذا كان هناك قائمة محددة من الجنسيات الصالحة
  if (validNationalities.length > 0) {
    return validNationalities.includes(cleanNationality);
  }
  
  // التحقق العام: فقط تأكد من وجود نص غير فارغ
  return cleanNationality.length > 0;
}

/**
 * التحقق من صحة مجموعة من المدخلات
 * @param {Object} inputs - كائن يحتوي على المدخلات المراد التحقق منها
 * @param {Object} validations - قواعد التحقق لكل مدخل
 * @returns {Object} نتائج التحقق مع أخطاء لكل حقل غير صالح
 */
export function validateForm(inputs, validations) {
  const errors = {};
  let isValid = true;
  
  Object.keys(validations).forEach(field => {
    const value = inputs[field];
    const rules = validations[field];
    
    // التحقق من القواعد المحددة
    if (rules.required && !value) {
      errors[field] = 'هذا الحقل مطلوب';
      isValid = false;
    } else if (value) {
      if (rules.minLength && String(value).length < rules.minLength) {
        errors[field] = `يجب أن يحتوي هذا الحقل على ${rules.minLength} أحرف على الأقل`;
        isValid = false;
      }
      
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors[field] = `يجب ألا يتجاوز هذا الحقل ${rules.maxLength} أحرف`;
        isValid = false;
      }
      
      if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
        errors[field] = rules.message || 'قيمة غير صالحة';
        isValid = false;
      }
      
      if (rules.validator && typeof rules.validator === 'function') {
        if (!rules.validator(value)) {
          errors[field] = rules.message || 'قيمة غير صالحة';
          isValid = false;
        }
      }
    }
  });
  
  return { isValid, errors };
}

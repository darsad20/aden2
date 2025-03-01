// utils/date.utils.js
/**
 * مجموعة دوال لمعالجة التواريخ والأوقات في التطبيق
 */

/**
 * تنسيق التاريخ حسب التنسيق المحلي العربي
 * @param {Date|string} date - كائن التاريخ أو سلسلة نصية
 * @param {string} [locale='ar-YE'] - رمز اللغة والمنطقة
 * @returns {string} التاريخ بالتنسيق المحلي
 */
export function formatDate(date, locale = 'ar-YE') {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return '';
  }
}

/**
 * تنسيق التاريخ مع الوقت
 * @param {Date|string} date - كائن التاريخ أو سلسلة نصية
 * @param {string} [locale='ar-YE'] - رمز اللغة والمنطقة
 * @returns {string} التاريخ والوقت المنسقين
 */
export function formatDateTime(date, locale = 'ar-YE') {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ والوقت:', error);
    return '';
  }
}

/**
 * تنسيق التاريخ الهجري
 * @param {Date|string} date - كائن التاريخ الميلادي أو سلسلة نصية
 * @returns {string} التاريخ بالتقويم الهجري
 */
export function formatHijriDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return new Intl.DateTimeFormat('ar-SA-islamic', {
      calendar: 'islamic',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ الهجري:', error);
    return '';
  }
}

/**
 * حساب الفرق بين تاريخين بالأيام
 * @param {Date|string} startDate - تاريخ البداية
 * @param {Date|string} endDate - تاريخ النهاية (إذا لم يحدد، يستخدم التاريخ الحالي)
 * @returns {number} عدد الأيام بين التاريخين
 */
export function dateDiffInDays(startDate, endDate = new Date()) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('خطأ في حساب الفرق بين التواريخ:', error);
    return 0;
  }
}

/**
 * إضافة أيام إلى تاريخ محدد
 * @param {Date|string} date - التاريخ الأصلي
 * @param {number} days - عدد الأيام للإضافة
 * @returns {Date} التاريخ الجديد بعد إضافة الأيام
 */
export function addDays(date, days) {
  try {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  } catch (error) {
    console.error('خطأ في إضافة الأيام:', error);
    return new Date();
  }
}

/**
 * التحقق مما إذا كان التاريخ ضمن الفترة المحددة
 * @param {Date|string} date - التاريخ المراد فحصه
 * @param {Date|string} startDate - بداية الفترة
 * @param {Date|string} endDate - نهاية الفترة
 * @returns {boolean} ما إذا كان التاريخ ضمن الفترة
 */
export function isDateInRange(date, startDate, endDate) {
  try {
    const checkDate = new Date(date).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return checkDate >= start && checkDate <= end;
  } catch (error) {
    console.error('خطأ في التحقق من نطاق التاريخ:', error);
    return false;
  }
}

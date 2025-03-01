// storage.service.js
/**
 * خدمة التخزين المحلي
 * تدير عمليات حفظ واسترجاع البيانات من التخزين المحلي للمتصفح
 */
export default class StorageService {
  /**
   * تخزين قيمة في التخزين المحلي
   * @param {string} key - مفتاح التخزين
   * @param {any} value - القيمة المراد تخزينها
   */
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('خطأ في تخزين البيانات:', error);
    }
  }
  
  /**
   * استرجاع قيمة من التخزين المحلي
   * @param {string} key - مفتاح التخزين
   * @returns {any|null} القيمة المخزنة أو null في حالة عدم وجودها
   */
  static getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('خطأ في استرجاع البيانات:', error);
      return null;
    }
  }
  
  /**
   * حذف قيمة من التخزين المحلي
   * @param {string} key - مفتاح التخزين
   */
  static removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error);
    }
  }
  
  /**
   * مسح جميع البيانات المخزنة محليًا
   */
  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('خطأ في مسح التخزين المحلي:', error);
    }
  }
}

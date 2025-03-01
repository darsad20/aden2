// auth.service.js
import ApiService from './api.service.js';
import StorageService from './storage.service.js';

/**
 * خدمة المصادقة وإدارة المستخدمين
 * تتعامل مع تسجيل الدخول والخروج وصلاحيات المستخدم
 */
export default class AuthService {
  constructor() {
    this.api = new ApiService();
    this.tokenKey = 'auth_token';
    this.userKey = 'current_user';
  }
  
  /**
   * تسجيل الدخول للمستخدم
   * @param {Object} credentials - بيانات اعتماد المستخدم
   * @returns {Promise<Object>} معلومات المستخدم مع رمز المصادقة
   */
  async login(credentials) {
    try {
      // إرسال بيانات الاعتماد إلى الخادم
      const response = await this.api.post('/auth/login', credentials);
      
      if (response.success && response.token) {
        // تخزين رمز المصادقة ومعلومات المستخدم
        StorageService.setItem(this.tokenKey, response.token);
        StorageService.setItem(this.userKey, response.user);
        return response;
      } else {
        throw new Error(response.message || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      throw error;
    }
  }
  
  /**
   * تسجيل خروج المستخدم
   * @returns {Promise<boolean>} نجاح عملية تسجيل الخروج
   */
  async logout() {
    try {
      // إرسال طلب تسجيل الخروج (اختياري)
      await this.api.post('/auth/logout');
      
      // حذف البيانات المخزنة محليًا
      StorageService.removeItem(this.tokenKey);
      StorageService.removeItem(this.userKey);
      
      return true;
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      // حذف البيانات المخزنة على أي حال
      StorageService.removeItem(this.tokenKey);
      StorageService.removeItem(this.userKey);
      return false;
    }
  }
  
  /**
   * التحقق من حالة تسجيل دخول المستخدم
   * @returns {boolean} حالة تسجيل الدخول
   */
  isLoggedIn() {
    return !!StorageService.getItem(this.tokenKey);
  }
  
  /**
   * الحصول على معلومات المستخدم الحالي
   * @returns {Object|null} معلومات المستخدم المسجل
   */
  getCurrentUser() {
    return StorageService.getItem(this.userKey);
  }
  
  /**
   * الحصول على رمز المصادقة الحالي
   * @returns {string|null} رمز المصادقة
   */
  getToken() {
    return StorageService.getItem(this.tokenKey);
  }
}

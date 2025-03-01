// pilgrim.service.js
import ApiService from './api.service.js';

/**
 * خدمة بيانات الحجاج
 * تدير عمليات البحث والإضافة والتعديل والحذف لبيانات الحجاج
 */
export default class PilgrimService {
  constructor() {
    this.api = new ApiService();
  }
  
  /**
   * البحث عن حاج أو مجموعة حجاج
   * @param {Object} params - معايير البحث
   * @returns {Promise<Array>} قائمة الحجاج المطابقين لمعايير البحث
   */
  async search(params) {
    try {
      return await this.api.get('/pilgrim/search', params);
    } catch (error) {
      console.error('خطأ في البحث عن الحجاج:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على معلومات حاج بواسطة المعرف
   * @param {string} id - معرف الحاج
   * @returns {Promise<Object>} بيانات الحاج
   */
  async getPilgrimById(id) {
    try {
      return await this.api.get(`/pilgrim/${id}`);
    } catch (error) {
      console.error('خطأ في الحصول على بيانات الحاج:', error);
      throw error;
    }
  }
  
  /**
   * إضافة حاج جديد
   * @param {Object} pilgrimData - بيانات الحاج
   * @returns {Promise<Object>} نتيجة العملية مع بيانات الحاج المضاف
   */
  async addPilgrim(pilgrimData) {
    try {
      return await this.api.post('/pilgrim/add', pilgrimData);
    } catch (error) {
      console.error('خطأ في إضافة حاج جديد:', error);
      throw error;
    }
  }
  
  /**
   * تحديث بيانات حاج
   * @param {string} id - معرف الحاج
   * @param {Object} pilgrimData - البيانات الجديدة
   * @returns {Promise<Object>} نتيجة العملية مع البيانات المحدثة
   */
  async updatePilgrim(id, pilgrimData) {
    try {
      return await this.api.post(`/pilgrim/update/${id}`, pilgrimData);
    } catch (error) {
      console.error('خطأ في تحديث بيانات الحاج:', error);
      throw error;
    }
  }
  
  /**
   * تسجيل حالة وفاة لحاج
   * @param {string} id - معرف الحاج
   * @param {Object} deathData - بيانات الوفاة
   * @returns {Promise<Object>} نتيجة العملية
   */
  async registerDeath(id, deathData) {
    try {
      return await this.api.post(`/pilgrim/death/${id}`, deathData);
    } catch (error) {
      console.error('خطأ في تسجيل حالة الوفاة:', error);
      throw error;
    }
  }
  
  /**
   * تسجيل حالة علاجية لحاج
   * @param {string} id - معرف الحاج
   * @param {Object} treatmentData - بيانات العلاج
   * @returns {Promise<Object>} نتيجة العملية
   */
  async registerTreatment(id, treatmentData) {
    try {
      return await this.api.post(`/pilgrim/treatment/${id}`, treatmentData);
    } catch (error) {
      console.error('خطأ في تسجيل الحالة العلاجية:', error);
      throw error;
    }
  }
}

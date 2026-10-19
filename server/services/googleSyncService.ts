import { Staff, Task, Document, Campus, AuditLog } from '../../src/types/index.js';

export interface GoogleSyncConfig {
  isConfigured: boolean;
  webAppUrlConfigured: boolean;
  driveFolderConfigured: boolean;
  maskedUrl?: string;
  driveFolderId?: string;
}

class GoogleSyncService {
  private getWebHookUrl(): string {
    return process.env.GOOGLE_APPS_SCRIPT_URL || '';
  }

  private getDriveFolderId(): string {
    return process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  }

  public getConfig(): GoogleSyncConfig {
    const url = this.getWebHookUrl();
    const folderId = this.getDriveFolderId();
    return {
      isConfigured: !!url,
      webAppUrlConfigured: !!url,
      driveFolderConfigured: !!folderId,
      maskedUrl: url ? `${url.substring(0, 30)}...${url.slice(-10)}` : undefined,
      driveFolderId: folderId || undefined,
    };
  }

  /**
   * Helper to send action to Google Apps Script Web App
   */
  private async sendToAppsScript(action: string, payload: any): Promise<{ success: boolean; data?: any; message?: string }> {
    const url = this.getWebHookUrl();
    if (!url) {
      return { success: false, message: 'GOOGLE_APPS_SCRIPT_URL chưa được cấu hình trong biến môi trường.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          payload,
          folderId: this.getDriveFolderId(),
          timestamp: new Date().toISOString(),
          system: 'OneSchool AI - Trường Tiểu học Nguyễn Trãi',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[GoogleSyncService] Apps Script returned status ${response.status}:`, text);
        return { success: false, message: `Lỗi kết nối Apps Script: ${response.status}` };
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.warn('[GoogleSyncService] Không thể kết nối tới Google Apps Script:', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Đồng bộ toàn bộ dữ liệu hệ thống (112 hồ sơ, cài đặt, điểm trường) lên Google Sheets
   */
  public async syncAll(data: {
    staff: Staff[];
    campuses: Campus[];
    settings: any;
    tasks?: Task[];
    documents?: Document[];
  }): Promise<{ success: boolean; message: string; details?: any }> {
    const res = await this.sendToAppsScript('SYNC_INITIAL_DATA', data);
    return {
      success: res.success,
      message: res.message || (res.success ? 'Đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!' : 'Đồng bộ thất bại.'),
      details: res.data,
    };
  }

  /**
   * Đồng bộ một hồ sơ nhân sự (khi thêm, sửa, hoặc xác minh)
   */
  public async syncStaff(staff: Staff, eventType: 'create' | 'update' | 'verify' = 'update'): Promise<void> {
    if (!this.getWebHookUrl()) return;
    // Chạy ngầm không chặn luồng chính
    this.sendToAppsScript('SYNC_STAFF', { staff, eventType }).catch((err) => {
      console.error('[GoogleSyncService] Lỗi đồng bộ staff ngầm:', err);
    });
  }

  /**
   * Đồng bộ một nhiệm vụ / lịch công tác
   */
  public async syncTask(task: Task, eventType: 'create' | 'update' | 'delete' = 'create'): Promise<void> {
    if (!this.getWebHookUrl()) return;
    this.sendToAppsScript('SYNC_TASK', { task, eventType }).catch((err) => {
      console.error('[GoogleSyncService] Lỗi đồng bộ task ngầm:', err);
    });
  }

  /**
   * Tải tài liệu lên Google Drive qua Google Apps Script
   */
  public async uploadDocumentToDrive(
    fileName: string,
    mimeType: string,
    buffer: Buffer,
    metadata?: {
      title?: string;
      documentNumber?: string;
      category?: string;
      campusId?: string;
      campusName?: string;
      uploadedByName?: string;
    }
  ): Promise<{ success: boolean; fileId?: string; webViewLink?: string; downloadLink?: string; message?: string }> {
    const url = this.getWebHookUrl();
    if (!url) {
      return { success: false, message: 'Chưa cấu hình GOOGLE_APPS_SCRIPT_URL. Hãy xem hướng dẫn tích hợp Google Drive.' };
    }

    const base64Data = buffer.toString('base64');
    const res = await this.sendToAppsScript('UPLOAD_DOCUMENT_DRIVE', {
      fileName,
      mimeType,
      base64Data,
      metadata,
    });

    if (res.success && res.data) {
      return {
        success: true,
        fileId: res.data.fileId,
        webViewLink: res.data.webViewLink,
        downloadLink: res.data.downloadLink,
      };
    }

    return {
      success: false,
      message: res.message || 'Không thể tải file lên Google Drive qua Apps Script.',
    };
  }

  /**
   * Ghi vết nhật ký kiểm toán vào Sheet
   */
  public async syncAuditLog(log: AuditLog): Promise<void> {
    if (!this.getWebHookUrl()) return;
    this.sendToAppsScript('LOG_AUDIT', { log }).catch(() => {});
  }
}

export const googleSyncService = new GoogleSyncService();

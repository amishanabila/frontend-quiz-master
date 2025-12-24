// Update deploy ke Vercel fix 
// --- LOGIKA SMART URL (Sama seperti authService) ---
// Ambil URL dari .env, atau gunakan link Railway sebagai cadangan
let rawUrl = import.meta.env.VITE_API_URL || 'https://backend-quiz-master-production.up.railway.app';

// 1. Hapus tanda garis miring (slash) di belakang jika ada
if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}

// 2. Cek apakah sudah ada '/api' di belakangnya? Jika belum, tambahkan otomatis.
// Ini MENJAMIN semua request ke backend akan selalu punya format .../api/...
const BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

console.log('🔗 ApiService - BASE_URL yang digunakan:', BASE_URL);

export const apiService = {
  // Auth API calls
  async register(data) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async login(data) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async resetPasswordRequest(email) {
    const response = await fetch(`${BASE_URL}/auth/reset-password-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  },

  // Kategori API calls
  async getKategori() {
    const response = await fetch(`${BASE_URL}/kategori`);
    return await response.json();
  },

  async getKategoriById(id) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`);
    return await response.json();
  },

  async createKategori(data, token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/kategori`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async updateKategori(id, data, token) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteKategori(id, token) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Materi API calls
  async getMateri(kategoriId = null, createdBy = null) {
    let url = `${BASE_URL}/materi`;
    const params = new URLSearchParams();
    
    if (kategoriId) params.append('kategori_id', kategoriId);
    // OPTIONAL: Jika createdBy disediakan, gunakan untuk filter
    // Tapi load semua jika tidak ada untuk backward compatibility
    if (createdBy) params.append('created_by', createdBy);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log("🔗 API Call: GET", url);
    const response = await fetch(url);
    return await response.json();
  },

  // Get kumpulan soal created by current user (for dashboard)
  async getMyKumpulanSoal(kategoriId = null) {
    const token = localStorage.getItem('authToken'); // ✅ FIX: Match authService key
    let url = `${BASE_URL}/soal/my-kumpulan/all`;
    
    if (kategoriId) {
      url += '?kategori_id=' + kategoriId;
    }
    
    console.log("🔗 API Call: GET", url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      console.log('🔗 Response Status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API returned', response.status);
        return {
          status: 'error',
          message: 'API Error: ' + response.status,
          data: []
        };
      }
      
      const data = await response.json();
      console.log('✅ MyKumpulanSoal response:', data);
      return data;
    } catch (error) {
      console.error('❌ MyKumpulanSoal API error:', error);
      return {
        status: 'error',
        message: error.message,
        data: []
      };
    }
  },

  async getMateriById(id) {
    const response = await fetch(`${BASE_URL}/materi/${id}`);
    return await response.json();
  },

  async createMateri(data, token) {
    const response = await fetch(`${BASE_URL}/materi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async updateMateri(id, data, token) {
    const response = await fetch(`${BASE_URL}/materi/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteMateri(id, token) {
    const response = await fetch(`${BASE_URL}/materi/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Soal API calls
  async createKumpulanSoal(data, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getKumpulanSoal(id) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`);
    return await response.json();
  },

  async updateKumpulanSoal(id, data, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteKumpulanSoal(id, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  async getSoalByKategori(kategoriId) {
    const response = await fetch(`${BASE_URL}/soal/kategori/${kategoriId}`);
    return await response.json();
  },

  async getSoalByMateri(materiId) {
    const response = await fetch(`${BASE_URL}/soal/materi/${materiId}`);
    return await response.json();
  },

  async getSoalByKumpulanSoal(kumpulanSoalId) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan-soal/${kumpulanSoalId}`);
    return await response.json();
  },

  // Quiz API calls
  async generatePin(data) {
    const response = await fetch(`${BASE_URL}/quiz/generate-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async validatePin(pin) {
    try {
      console.log('🔍 Validating PIN:', pin);
      console.log('📡 Request URL:', `${BASE_URL}/quiz/validate-pin`);
      
      const response = await fetch(`${BASE_URL}/quiz/validate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          status: 'error', 
          message: `HTTP error! status: ${response.status}` 
        }));
        console.log('❌ Response not OK:', errorData);
        return errorData;
      }

      const data = await response.json();
      console.log('✅ Validate PIN success:', data);
      return data;
    } catch (error) {
      console.error('❌ validatePin error:', error);
      return {
        status: 'error',
        message: 'Tidak dapat terhubung ke server.',
        error: error.message
      };
    }
  },

  async startQuiz(data) {
    const response = await fetch(`${BASE_URL}/quiz/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getRemainingTime(sessionId) {
    const response = await fetch(`${BASE_URL}/quiz/session/${sessionId}/remaining-time`);
    return await response.json();
  },

  async updateQuizProgress(sessionId, currentIndex) {
    const response = await fetch(`${BASE_URL}/quiz/session/${sessionId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current_soal_index: currentIndex }),
    });
    return await response.json();
  },

  async submitQuiz(data) {
    const response = await fetch(`${BASE_URL}/quiz/submit-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getQuizResults(hasilId) {
    const response = await fetch(`${BASE_URL}/quiz/results/${hasilId}`);
    return await response.json();
  },

  // Leaderboard API calls
  async getLeaderboard(filters = {}) {
    const params = new URLSearchParams();
    if (filters.kategori_id) params.append('kategori_id', filters.kategori_id);
    if (filters.materi_id) params.append('materi_id', filters.materi_id);
    if (filters.created_by) params.append('created_by', filters.created_by);
    
    const url = `${BASE_URL}/leaderboard${params.toString() ? '?' + params.toString() : ''}`;
    console.log("🔗 API Call: GET", url);
    
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      console.log('🔗 Response Status:', response.status);
      const data = await response.json();
      console.log('✅ Leaderboard API response:', data);
      return data;
    } catch (error) {
      console.error('❌ Leaderboard API error:', error);
      return {
        status: 'error',
        message: error.message,
        data: []
      };
    }
  },

  async getKategoriWithStats() {
    const response = await fetch(`${BASE_URL}/leaderboard/kategori`);
    return await response.json();
  },

  async getMateriByKategori(kategoriId = null) {
    const url = kategoriId 
      ? `${BASE_URL}/leaderboard/materi?kategori_id=${kategoriId}`
      : `${BASE_URL}/leaderboard/materi`;
    const response = await fetch(url);
    return await response.json();
  },

  async resetLeaderboard() {
    const token = localStorage.getItem('authToken'); // ✅ FIX: Match authService key
    const response = await fetch(`${BASE_URL}/leaderboard/reset`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },
};
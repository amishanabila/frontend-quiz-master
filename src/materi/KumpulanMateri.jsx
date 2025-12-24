// src/pages/KumpulanMateri.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import Kategori from "../kategori/Kategori";
import HapusSoalPopup from "../popup/HapusSoalPopup";
import { apiService } from "../services/api";

export default function KumpulanMateri() {
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [materiList, setMateriList] = useState([]);
  const [allKategori, setAllKategori] = useState([]);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [materiToDelete, setMateriToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk menyimpan data user yang login
  const [currentUser, setCurrentUser] = useState(null);
  
  const navigate = useNavigate();

  // Load User Data saat pertama kali render (ambil dari localStorage)
  useEffect(() => {
    const userString = localStorage.getItem("userData"); // ✅ FIX: Use correct localStorage key
    console.log("🔍 localStorage userData:", userString);
    if (userString) {
      try {
        const user = JSON.parse(userString);
        console.log("✅ Parsed user:", user);
        setCurrentUser(user);
      } catch (e) {
        console.error("❌ Error parsing user data:", e);
      }
    } else {
      console.warn("⚠️ No userData found in localStorage");
    }
  }, []);

  // fungsi bikin slug dari nama materi
  const toSlug = (text) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Load kategori from API - HANYA kategori yang punya kumpulan soal dari kreator
  useEffect(() => {
    const loadKategori = async () => {
      try {
        if (!currentUser) {
          console.log("⚠️ No currentUser, skipping kategori load");
          return;
        }
        
        console.log("📊 Loading kategori for creator:", currentUser.id);
        const response = await apiService.getKategoriWithStats(currentUser.id);
        if (response.status === "success" && response.data) {
          console.log("✅ Loaded kategori:", response.data.length, "categories");
          setAllKategori(response.data.map(k => ({
            id: k.kategori_id,
            nama_kategori: k.nama_kategori
          })));
        }
      } catch (error) {
        console.error("❌ Error loading kategori:", error);
      }
    };
    if (currentUser) {
      loadKategori();
    }
  }, [currentUser]);

  // Load materi from API - HANYA DARI KREATOR YANG LOGIN
  useEffect(() => {
    const loadMateri = async () => {
      setLoading(true);
      try {
        if (!currentUser) {
          console.log("⚠️ No currentUser, skipping load");
          setMateriList([]);
          setLoading(false);
          return;
        }

        console.log("📊 LoadMateri triggered - currentUser:", currentUser.id);

        // 🔥 Load from /soal/my-kumpulan/all endpoint
        let response = null;

        if (kategoriAktif === "Semua") {
          console.log("📊 Fetching all kumpulan soal (no kategori filter)");
          response = await apiService.getMyKumpulanSoal(null);
        } else {
          const kategori = allKategori.find(k => k.nama_kategori === kategoriAktif);
          if (kategori) {
            console.log("📊 Fetching kumpulan soal for kategori:", kategori.id);
            response = await apiService.getMyKumpulanSoal(kategori.id);
          } else {
            console.warn("⚠️ Kategori tidak ditemukan:", kategoriAktif);
            setMateriList([]);
            setLoading(false);
            return;
          }
        }

        console.log("📊 API Response:", response);

        if (response?.status === "success" && Array.isArray(response?.data)) {
          console.log("📊 Data received - count:", response.data.length);
          
          // Transform data ke format komponen
          const materiFromAPI = response.data.map((item) => {
            return {
              materi_id: item.kumpulan_soal_id,
              kumpulan_soal_id: item.kumpulan_soal_id,
              materi: item.judul,
              kategori_id: item.kategori_id,
              kategori: item.nama_kategori || "Unknown",
              jumlahSoal: item.jumlah_soal || 0,
              createdAt: item.created_at,
              user_id: item.created_by,
              pin_code: item.pin_code
            };
          });
          
          console.log("🔍 Mapped count:", materiFromAPI.length);
          
          const sortedMateri = materiFromAPI.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });

          console.log("✅ Setting list with", sortedMateri.length, "items");
          console.log("📋 First item:", sortedMateri[0]);
          setMateriList(sortedMateri);
        } else {
          console.error("❌ Invalid response:", response);
          setMateriList([]);
        }
      } catch (error) {
        console.error("❌ Error loading materi:", error);
        setMateriList([]);
      } finally {
        setLoading(false);
      }
    };

    // Trigger load when currentUser is available
    if (currentUser) {
      console.log("🎯 Triggering loadMateri with:", {
        currentUser: currentUser.id,
        kategoriAktif,
        allKategoriLength: allKategori.length
      });
      loadMateri();
    } else {
      console.log("⚠️ No currentUser, setting loading false");
      setLoading(false);
    }
  }, [kategoriAktif, allKategori, currentUser]);

  // LOGIKA UTAMA: Soal terbaru dari list yang sudah di-filter (semua dari kreator login)
  const soalTerbaru = materiList.slice(0, 3); 

  const toggleMenu = (e, index) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    if (openMenuIndex !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuIndex]);

  const handleLihatSoal = (e, materiData) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    navigate(`/lihat-soal/${toSlug(materiData.materi)}`, { 
      state: { ...materiData } 
    });
  };

  const handleEditSoal = async (e, materiData) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    navigate("/buat-soal", { 
      state: { ...materiData } 
    });
  };

  const handleHapusSoal = (e, materi) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    setMateriToDelete(materi);
    setShowDeletePopup(true);
  };

  const confirmDeleteSoal = async () => {
    if (!materiToDelete) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert("Anda harus login untuk menghapus materi");
        return;
      }
      const response = await apiService.deleteMateri(materiToDelete.materi_id, token);
      if (response.status === "success") {
        setShowDeletePopup(false);
        setMateriToDelete(null);
        // Refresh list
        setKategoriAktif(prev => {
          const temp = prev + " ";
          setTimeout(() => setKategoriAktif(prev), 10);
          return temp;
        });
      } else {
        throw new Error(response.message || "Gagal menghapus materi");
      }
    } catch (error) {
      alert(error.message || "Terjadi kesalahan saat menghapus materi");
      setShowDeletePopup(false);
      setMateriToDelete(null);
    }
  };

  return (
    <div>
      <Kategori
        onPilihKategori={setKategoriAktif}
        kategoriAktif={kategoriAktif}
      />

      <hr className="my-4" />

      {/* Bagian Soal Terbaru Saya (Hanya muncul jika user punya soal) */}
      {soalTerbaru.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-600">⭐</span>
            Soal Terbaru Saya
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {soalTerbaru.map((m, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-md p-4 flex flex-col justify-between transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl relative"
              >
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Baru
                </span>
                
                <div className="absolute top-2 right-14">
                  <button
                    onClick={(e) => toggleMenu(e, `terbaru-${idx}`)}
                    className="p-1 hover:bg-blue-200 rounded-full transition"
                  >
                    <MoreVertical size={20} className="text-blue-700" />
                  </button>
                  
                  {openMenuIndex === `terbaru-${idx}` && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <button
                        onClick={(e) => handleLihatSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                      >
                        <Eye size={16} className="text-blue-600" />
                        Lihat Soal
                      </button>
                      <button
                        onClick={(e) => handleEditSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit size={16} className="text-green-600" />
                        Edit Soal
                      </button>
                      <button
                        onClick={(e) => handleHapusSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-b-lg text-red-600"
                      >
                        <Trash2 size={16} />
                        Hapus Soal
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-1 pr-24 text-blue-900">{m.materi}</h3>
                  <p className="text-blue-600 text-sm font-medium">{m.kategori}</p>
                </div>
                {m.jumlahSoal && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">
                      📝 {m.jumlahSoal} soal
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <hr className="my-6" />
        </div>
      )}

      {/* Bagian Semua Materi */}
      <div className="px-4 mb-2">
        <h2 className="text-xl font-bold mb-4">
          {kategoriAktif === "Semua" ? "Semua Materi" : `Materi ${kategoriAktif}`}
        </h2>
      </div>
      
      {/* Debug: Show current state */}
      {console.log("🎨 RENDER - materiList length:", materiList.length, "loading:", loading)}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Loading materi...</div>
        </div>
      ) : (
        <div className="grid gap-6 p-4 grid-cols-2 xs:grid-cols-1 lg:grid-cols-3">
          {materiList.length > 0 ? (
            materiList.map((m, idx) => {
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg relative"
              >
                {/* Label 'Soal Saya' & menu edit/hapus (semua item di sini adalah milik user) */}
                <>
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Soal Saya
                  </span>
                  
                  <div className="absolute top-2 right-20">
                    <button
                      onClick={(e) => toggleMenu(e, `all-${idx}`)}
                      className="p-1 hover:bg-gray-200 rounded-full transition"
                    >
                      <MoreVertical size={20} className="text-gray-700" />
                    </button>
                    
                    {openMenuIndex === `all-${idx}` && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                        <button
                          onClick={(e) => handleLihatSoal(e, m)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                        >
                          <Eye size={16} className="text-blue-600" />
                          Lihat Soal
                        </button>
                        <button
                          onClick={(e) => handleEditSoal(e, m)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Edit size={16} className="text-green-600" />
                          Edit Soal
                        </button>
                        <button
                          onClick={(e) => handleHapusSoal(e, m)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-b-lg text-red-600"
                        >
                          <Trash2 size={16} />
                          Hapus Soal
                        </button>
                      </div>
                    )}
                  </div>
                </>
                
                <div>
                  <h3 className="font-bold text-lg mb-1 pr-20">{m.materi}</h3>
                  <p className="text-gray-500 text-sm">{m.kategori}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    📝 {m.jumlahSoal} soal
                  </p>
                </div>
              </div>
            );
          })
            ) : (
            <p className="text-center text-gray-500 col-span-full">Tidak ada materi untuk kategori ini.</p>
          )}
        </div>
      )}
      
      {showDeletePopup && materiToDelete && (
        <HapusSoalPopup
          materi={materiToDelete.materi}
          onConfirm={confirmDeleteSoal}
          onCancel={() => {
            setShowDeletePopup(false);
            setMateriToDelete(null);
          }}
        />
      )}
    </div>
  );
}
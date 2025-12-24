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
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        setCurrentUser(JSON.parse(userString));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  // fungsi bikin slug dari nama materi
  const toSlug = (text) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Load kategori from API
  useEffect(() => {
    const loadKategori = async () => {
      try {
        const response = await apiService.getKategori();
        if (response.status === "success" && response.data) {
          setAllKategori(response.data);
        }
      } catch (error) {
        console.error("❌ Error loading kategori:", error);
      }
    };
    loadKategori();
  }, []);

  // Load materi from API
  useEffect(() => {
    const loadMateri = async () => {
      setLoading(true);
      try {
        let response;
        if (kategoriAktif === "Semua") {
          response = await apiService.getMateri();
        } else {
          const kategori = allKategori.find(k => k.nama_kategori === kategoriAktif);
          if (kategori) {
            response = await apiService.getMateri(kategori.id);
          } else {
            response = { status: "success", data: [] };
          }
        }

        if (response.status === "success" && response.data) {
          console.log("📊 Raw materi data from API:", response.data);
          
          const materiFromAPI = await Promise.all(response.data.map(async (m) => {
            let kumpulanSoalId = null;
            let jumlahSoal = 0;
            try {
              const soalResponse = await apiService.getSoalByMateri(m.materi_id);
              if (soalResponse.status === "success" && soalResponse.data) {
                kumpulanSoalId = soalResponse.data.kumpulan_soal_id;
                jumlahSoal = soalResponse.data.soal_list?.length || 0;
              }
            } catch (err) {
              console.error(`❌ Error fetching soal:`, err);
            }

            return {
              materi_id: m.materi_id,
              kumpulan_soal_id: kumpulanSoalId,
              materi: m.judul,
              kategori_id: m.kategori_id,
              kategori: allKategori.find(k => k.id === m.kategori_id)?.nama_kategori || "Unknown",
              jumlahSoal: jumlahSoal,
              createdAt: m.created_at,
              // UPDATE: Menggunakan 'created_by' sesuai database backend
              user_id: m.created_by 
            };
          }));
          
          const sortedMateri = materiFromAPI.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });

          setMateriList(sortedMateri);
        }
      } catch (error) {
        console.error("❌ Error loading materi:", error);
        setMateriList([]);
      } finally {
        setLoading(false);
      }
    };

    if (allKategori.length > 0 || kategoriAktif === "Semua") {
      loadMateri();
    }
  }, [kategoriAktif, allKategori]);

  // LOGIKA UTAMA: Filter hanya soal milik user yang login (berdasarkan created_by)
  const soalTerbaru = materiList
    .filter(m => {
      if (!currentUser) return false;
      // Pastikan tipe data sama (kadang ID bisa string atau number)
      return String(m.user_id) === String(currentUser.id);
    })
    .slice(0, 3); 

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
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Loading materi...</div>
        </div>
      ) : (
        <div className="grid gap-6 p-4 grid-cols-2 xs:grid-cols-1 lg:grid-cols-3">
          {materiList.length > 0 ? (
            materiList.map((m, idx) => {
              // Cek kepemilikan soal
              const isUserCreated = currentUser && String(m.user_id) === String(currentUser.id);
            
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg relative"
              >
                {/* Hanya tampilkan label 'Soal Saya' & menu edit/hapus jika punya sendiri */}
                {isUserCreated && (
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
                )}
                
                <div>
                  <h3 className="font-bold text-lg mb-1 pr-20">{m.materi}</h3>
                  <p className="text-gray-500 text-sm">{m.kategori}</p>
                </div>
                {m.jumlahSoal > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      📝 {m.jumlahSoal} soal
                    </p>
                  </div>
                )}
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
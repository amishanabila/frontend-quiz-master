import React from "react";
import { useNavigate } from "react-router-dom";

const ResetPasswordBerhasil = ({ token, onClose }) => {
  const navigate = useNavigate();

  const handleGoToPasswordBaru = () => {
    // Navigate ke halaman password baru dengan token
    navigate(`/password-baru?token=${token}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-2xl p-6 sm:p-8 w-full sm:w-[400px] md:w-[500px] max-w-full text-center border-2 border-orange-300 animate-scaleIn">
          <div className="flex justify-center mb-4">
            <div className="w-[85px] h-[85px] border-4 border-green-500 rounded-full flex items-center justify-center bg-white shadow-lg animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3">
            Reset Password Berhasil!
          </h2>
          <p className="text-gray-700 text-sm mb-6 leading-relaxed px-2">
            Silakan klik tombol di bawah untuk membuat password baru Anda.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoToPasswordBaru}
              className="font-bold px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 w-full shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              🔐 Ke Halaman Password Baru
            </button>
            <button
              onClick={onClose}
              className="font-bold px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-200 w-full shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordBerhasil;

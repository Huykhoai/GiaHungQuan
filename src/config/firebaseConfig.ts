// File cấu hình Firebase
// Hãy thay thế nội dung trong firebaseConfig bằng cấu hình bạn lấy được từ trang Firebase Console
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXgB9tp_Tys3TgwXsq_bAleF_xsxZvmfk",
  authDomain: "giahungquan-1ae6a.firebaseapp.com",
  projectId: "giahungquan-1ae6a",
  storageBucket: "giahungquan-1ae6a.firebasestorage.app",
  messagingSenderId: "614269635884",
  appId: "1:614269635884:web:df9d7c54f1beda5c06b089",
  measurementId: "G-59H7468PNF"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Lấy tham chiếu tới cơ sở dữ liệu Firestore
export const db = getFirestore(app);

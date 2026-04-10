import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCswQoKzD5wfSnheEPpia1PCGqxVnXNQm8",
    authDomain: "wedd-cb4d6.firebaseapp.com",
    projectId: "wedd-cb4d6",
    storageBucket: "wedd-cb4d6.firebasestorage.app",
    messagingSenderId: "533724418327",
    appId: "1:533724418327:web:8bf38f1451b265ec11e752",
    databaseURL: "https://wedd-cb4d6-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

get(ref(db, '/')).then((snapshot) => {
    console.log(JSON.stringify(snapshot.val()).substring(0, 500));
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});

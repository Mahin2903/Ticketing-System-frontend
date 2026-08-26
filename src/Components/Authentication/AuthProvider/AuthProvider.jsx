import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
// eslint-disable-next-line no-unused-vars
import React, { createContext, useEffect, useState } from "react";
import app from "../Firebase/firebase.init";
// import app from "./Firebase/firebase.init";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  const LoginWithGoogle = () => {
    setLoading(true);

    return signInWithPopup(auth, googleProvider);
  };
  const LogOut = () => {
    return signOut(auth);
  };
  const updateUser = (updateData) => {
    return updateProfile(auth.currentUser, updateData);
  };

  useEffect(() => {
    const CUser = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => {
      CUser();
    };
  }, []);

  const authData = {
    user,
    setUser,
    LoginWithGoogle,
    LogOut,
    loading,
    setLoading,
    updateUser,
  };
  return <AuthContext value={authData}>{children}</AuthContext>;
};

export default AuthProvider;
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

import { isValidJustEmail } from "../../../Utilities/auth.utils";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const LoginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email;

      if (!isValidJustEmail(email)) {
        await signOut(auth);
        setUser(null);
        const error = new Error("INVALID_JUST_EMAIL");
        error.email = email;
        throw error;
      }

      return result;
    } finally {
      setLoading(false);
    }
  };
  const LogOut = () => {
    return signOut(auth);
  };
  const updateUser = (updateData) => {
    return updateProfile(auth.currentUser, updateData);
  };

  const refreshToken = async (forceRefresh = true) => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(forceRefresh);
    }
    return null;
  };

  useEffect(() => {
    const CUser = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !isValidJustEmail(currentUser.email)) {
        await signOut(auth);
        setUser(null);
        setLoading(false);
        return;
      }
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
    refreshToken,
  };
  return <AuthContext value={authData}>{children}</AuthContext>;
};

export default AuthProvider;
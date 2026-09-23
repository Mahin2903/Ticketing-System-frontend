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
import { axiosInstance } from "../../../Hooks/UseAxiosSecure";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser) => {
    if (!currentUser?.email) {
      setRole(null);
      setDbUser(null);
      return null;
    }

    let resolvedRole = null;
    try {
      const res = await axiosInstance.get(
        `/api/users?email=${encodeURIComponent(currentUser.email)}`
      );
      if (res.data?.success && res.data.data) {
        setDbUser(res.data.data);
        if (res.data.data.role) {
          resolvedRole = res.data.data.role;
        }
      }
    } catch (err) {
      console.warn("Could not fetch user profile from DB:", err?.message);
    }

    if (!resolvedRole) {
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        if (tokenResult?.claims?.role) {
          resolvedRole = tokenResult.claims.role;
        }
      } catch (claimErr) {
        console.warn("Could not fetch token custom claims:", claimErr?.message);
      }
    }

    const finalRole = resolvedRole || "user";
    setRole(finalRole);
    return finalRole;
  };

  const LoginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email;

      if (!isValidJustEmail(email)) {
        await signOut(auth);
        setUser(null);
        setRole(null);
        setDbUser(null);
        const error = new Error("INVALID_JUST_EMAIL");
        error.email = email;
        throw error;
      }

      await fetchUserData(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const LogOut = async () => {
    setUser(null);
    setRole(null);
    setDbUser(null);
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

  const refreshRole = async () => {
    if (auth.currentUser) {
      return await fetchUserData(auth.currentUser);
    }
  };

  useEffect(() => {
    const CUser = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser && !isValidJustEmail(currentUser.email)) {
          await signOut(auth);
          setUser(null);
          setRole(null);
          setDbUser(null);
          setLoading(false);
          return;
        }

        if (currentUser) {
          setUser(currentUser);
          await fetchUserData(currentUser);
        } else {
          setUser(null);
          setRole(null);
          setDbUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      CUser();
    };
  }, []);

  const authData = {
    user,
    setUser,
    role,
    setRole,
    dbUser,
    setDbUser,
    refreshRole,
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
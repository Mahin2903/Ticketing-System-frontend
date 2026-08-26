// src/Hooks/UseAuth.jsx

import { use } from "react";
import { AuthContext } from "../Components/Authentication/AuthProvider/AuthProvider";

const UseAuth = () => {
  return use(AuthContext); 
};

export default UseAuth;

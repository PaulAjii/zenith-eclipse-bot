import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserInfo {
  fullname: string;
  email: string;
  phone?: string;
}

interface UserInfoContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
  clearUserInfo: () => void;
}

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);

  const setUserInfo = (info: UserInfo) => setUserInfoState(info);
  const clearUserInfo = () => setUserInfoState(null);

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo, clearUserInfo }}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
}; 
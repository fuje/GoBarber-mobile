/* eslint-disable @typescript-eslint/ban-types */
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface AuthData {
  token: string;
  user: object;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  loading: boolean;
  user: object;
  signIn: (credentials: SignInCredentials) => void;
  signOut: () => void;
}

const TOKEN_KEY = '@GoBarber/token';
const USER_DATA_KEY = '@GoBarber/user_data';

export const AuthContext = React.createContext<AuthContextValue>(
  {} as AuthContextValue,
);

export const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthData>({} as AuthData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const [token, userData] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        USER_DATA_KEY,
      ]);

      if (!!token[1] && !!userData[1]) {
        setData({
          token: token[1],
          user: JSON.parse(userData[1]),
        });
      }

      setLoading(false);
    }

    loadStorageData();
  }, []);

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    const response = await api.post<{ user: object; token: string }>(
      '/sessions',
      credentials,
    );

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_DATA_KEY, JSON.stringify(user)],
    ]);

    setData({
      user,
      token,
    });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY]);
    setData({} as AuthData);
  }, []);

  return (
    <AuthContext.Provider value={{ loading, user: data.user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

'use client'

import { createContext, useContext } from 'react'

const UserIdContext = createContext<string>('')

export const UserProvider = ({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) => <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>

export const useUserId = (): string => useContext(UserIdContext)

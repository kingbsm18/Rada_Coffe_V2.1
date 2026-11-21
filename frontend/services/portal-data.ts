'use client'

import { useDevelopmentData } from './development-data'

export function usePortalData() {
  return useDevelopmentData()
}

export { canSeeFinancials, roleCanAccess } from './development-data'
